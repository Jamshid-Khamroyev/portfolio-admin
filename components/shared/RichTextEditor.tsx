"use client"

import { useRef, useState } from "react"
import { useEditor, useEditorState, EditorContent } from "@tiptap/react"
import type { Editor } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Image, { type ImageOptions } from "@tiptap/extension-image"
import { uploadApi } from "@/lib/api-client"
import { useToast } from "@/components/Toast"

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const isImage = (file: File) => file.type.startsWith("image/")

/*
  Rasm tuguni: yuklanayotganda lokal preview (blob) ko'rsatiladi, ustida blur va
  aylanuvchi loader turadi. Yuklash tugagach `src` ImageKit havolasiga almashadi.
*/
/* Matndagi barcha rasmlarning ImageKit fileId'lari (o'chirish uchun kerak) */
export function collectImageFileIds(content: unknown): string[] {
  const ids: string[] = []
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return
    if (node.type === "image" && typeof node.attrs?.fileId === "string") ids.push(node.attrs.fileId)
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(content)
  return ids
}

const ContentImage = Image.extend<ImageOptions & { onReplace: (file: File, pos: number) => void }>({
  addOptions() {
    return { ...(this.parent?.() as ImageOptions), onReplace: () => {} }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      fileId: { default: null, rendered: false },
      uploadId: { default: null, rendered: false },
      uploading: { default: false, rendered: false },
    }
  },

  addNodeView() {
    const { onReplace } = this.options

    return ({ node, editor, getPos }) => {
      const dom = document.createElement("div")
      dom.className = "tt-image"

      const img = document.createElement("img")
      img.draggable = false // sudraladigan narsa — butun blok, rasmning o'zi emas

      const spinner = document.createElement("span")
      spinner.className = "tt-image-spinner"

      const controls = document.createElement("div")
      controls.className = "tt-image-controls"

      const makeBtn = (label: string, title: string, cls = "") => {
        const b = document.createElement("button")
        b.type = "button"
        b.textContent = label
        b.title = title
        b.className = cls
        return b
      }

      const replaceBtn = makeBtn("↻ Almashtirish", "Rasmni almashtirish")
      const deleteBtn = makeBtn("🗑 O'chirish", "Rasmni o'chirish", "is-danger")
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.hidden = true

      replaceBtn.addEventListener("click", () => input.click())
      input.addEventListener("change", () => {
        const file = input.files?.[0]
        input.value = ""
        const pos = getPos()
        if (file && typeof pos === "number") onReplace(file, pos)
      })
      deleteBtn.addEventListener("click", () => {
        const pos = getPos()
        if (typeof pos !== "number") return
        editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
      })

      controls.append(replaceBtn, deleteBtn, input)
      dom.append(img, spinner, controls)

      const apply = (n: typeof node) => {
        img.src = n.attrs.src
        img.alt = n.attrs.alt ?? ""
        dom.classList.toggle("is-uploading", Boolean(n.attrs.uploading))
      }
      apply(node)

      return {
        dom,
        update: (n) => {
          if (n.type !== node.type) return false
          apply(n)
          return true
        },
      }
    }
  },
})

interface RichTextEditorProps {
  value: Record<string, unknown> | null
  onChange: (value: Record<string, unknown>) => void
  /** Rasm yuklanayotganda true — forma yuborishni to'xtatish uchun */
  onUploadingChange?: (uploading: boolean) => void
  /** Yangi rasm ImageKit'ga yuklanganda chaqiriladi (keyin tozalash uchun fileId kuzatiladi) */
  onImageUploaded?: (fileId: string) => void
  /** Saqlangan blogga tegishli rasmlar — ular faqat blog saqlanganda o'chiriladi (darhol emas) */
  protectedImageIds?: string[]
  /** Rasm ImageKit'dan o'chirilgach chaqiriladi */
  onImageRemoved?: (fileId: string) => void
}

/* O'chirilgan rasm shu vaqt davomida qaytmasa (undo qilinmasa) ImageKit'dan o'chiriladi */
const REMOVE_GRACE_MS = 3000

const btn = "rounded px-3 py-1.5 text-sm text-text-1 hover:bg-bg-3"

export default function RichTextEditor({
  value,
  onChange,
  onUploadingChange,
  onImageUploaded,
  protectedImageIds,
  onImageRemoved,
}: RichTextEditorProps) {
  const protectedRef = useRef<Set<string>>(new Set())
  protectedRef.current = new Set(protectedImageIds ?? [])
  const removedCb = useRef(onImageRemoved)
  removedCb.current = onImageRemoved
  const knownIds = useRef<Set<string>>(new Set(collectImageFileIds(value)))
  const removeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const { showToast } = useToast()
  const replaceRef = useRef<(file: File, pos: number) => void>(() => {})
  const [editingLink, setEditingLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const fileInput = useRef<HTMLInputElement>(null)
  const pending = useRef(0)
  const editorRef = useRef<Editor | null>(null)
  const uploadRef = useRef<(files: File[], pos?: number) => void>(() => {})

  const editor = useEditor({
    extensions: [
      ContentImage.configure({
        allowBase64: false,
        onReplace: (file, pos) => replaceRef.current(file, pos),
      }),
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
    ],

    content: value,

    immediatelyRender: false,

    editorProps: {
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter(isImage)
        if (!files.length) return false
        event.preventDefault()
        uploadRef.current(files)
        return true
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter(isImage)
        if (!files.length) return false // tugunni ko'chirish — ProseMirror o'zi hal qiladi
        event.preventDefault()
        // Tashlangan joyga (istalgan qatorga) qo'yiladi
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY })
        uploadRef.current(files, at?.pos)
        return true
      },
    },

    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChange(json)

      /* Matndan yo'qolgan rasmlarni ImageKit'dan o'chirish (undo uchun qisqa kutish bilan) */
      const current = new Set(collectImageFileIds(json))
      current.forEach((id) => {
        knownIds.current.add(id)
        const t = removeTimers.current.get(id)
        if (t) {
          clearTimeout(t)
          removeTimers.current.delete(id)
        }
      })
      knownIds.current.forEach((id) => {
        if (current.has(id) || protectedRef.current.has(id) || removeTimers.current.has(id)) return
        removeTimers.current.set(
          id,
          setTimeout(() => {
            removeTimers.current.delete(id)
            let still: string[] = []
            try {
              still = collectImageFileIds(editorRef.current?.getJSON())
            } catch {}
            if (still.includes(id)) return
            knownIds.current.delete(id)
            uploadApi
              .remove([id])
              .then(() => removedCb.current?.(id))
              .catch(() => knownIds.current.add(id))
          }, REMOVE_GRACE_MS)
        )
      })
    },
  })

  editorRef.current = editor

  const linkState =
    useEditorState({
      editor,
      selector: ({ editor }) => ({
        active: !!editor?.isActive("link"),
        href: (editor?.getAttributes("link").href as string | undefined) ?? "",
      }),
    }) ?? { active: false, href: "" }

  if (!editor) {
    return null
  }

  const setPending = (delta: number) => {
    pending.current += delta
    onUploadingChange?.(pending.current > 0)
  }

  const patchImageAt = (pos: number, attrs: Record<string, unknown>) => {
    const ed = editorRef.current
    const node = ed?.state.doc.nodeAt(pos)
    if (!ed || !node) return
    ed.view.dispatch(ed.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs }))
  }

  /* uploadId bo'yicha rasm tugunini topib, yangilaydi (attrs === null bo'lsa — o'chiradi) */
  const patchImage = (uploadId: string, attrs: Record<string, unknown> | null) => {
    const ed = editorRef.current
    if (!ed) return
    const { state, view } = ed
    let done = false

    state.doc.descendants((node, pos) => {
      if (done || node.type.name !== "image" || node.attrs.uploadId !== uploadId) return
      done = true
      view.dispatch(
        attrs
          ? state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs })
          : state.tr.delete(pos, pos + node.nodeSize)
      )
    })
  }

  const newUploadId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  /* Rasmni yuklaydi; `onFail` — xatoda nima qilish (yangi rasm o'chadi, almashtirilgan rasm eskisiga qaytadi) */
  const runUpload = (file: File, uploadId: string, preview: string, onFail: () => void) => {
    setPending(1)

    uploadApi
      .image(file)
      .then(({ url, fileId }) => {
        patchImage(uploadId, { src: url, fileId, uploading: false, uploadId: null })
        onImageUploaded?.(fileId)
      })
      .catch((err: Error) => {
        onFail()
        showToast("Rasm yuklanmadi", "error", err?.message || "Rasmni yuklashda xatolik yuz berdi")
      })
      .finally(() => {
        setPending(-1)
        URL.revokeObjectURL(preview)
      })
  }

  uploadRef.current = (files, at) => {
    let pos = at ?? editor.state.selection.to

    for (const file of files) {
      if (file.size > MAX_IMAGE_BYTES) {
        showToast("Rasm juda katta", "error", `"${file.name}" hajmi 4MB dan oshmasligi kerak`)
        continue
      }

      const uploadId = newUploadId()
      const preview = URL.createObjectURL(file)

      editor
        .chain()
        .focus()
        .insertContentAt(pos, {
          type: "image",
          attrs: { src: preview, alt: "", uploadId, uploading: true },
        })
        .run()
      pos += 1

      runUpload(file, uploadId, preview, () => patchImage(uploadId, null))
    }
  }

  /* Mavjud rasmni almashtirish: eski rasm ImageKit'dan saqlashda tozalanadi */
  replaceRef.current = (file, pos) => {
    if (file.size > MAX_IMAGE_BYTES) {
      showToast("Rasm juda katta", "error", `"${file.name}" hajmi 4MB dan oshmasligi kerak`)
      return
    }

    const node = editor.state.doc.nodeAt(pos)
    if (!node || node.type.name !== "image") return

    const previous = { src: node.attrs.src, fileId: node.attrs.fileId }
    const uploadId = newUploadId()
    const preview = URL.createObjectURL(file)

    patchImageAt(pos, { src: preview, uploading: true, uploadId })
    runUpload(file, uploadId, preview, () => patchImage(uploadId, { ...previous, uploading: false, uploadId: null }))
  }

  const openLinkEditor = () => {
    setLinkUrl(linkState.href)
    setEditingLink(true)
  }

  const closeLinkEditor = () => {
    setEditingLink(false)
    editor.chain().focus().run()
  }

  const saveLink = () => {
    let url = linkUrl.trim()

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      setEditingLink(false)
      return
    }

    // Saytda faqat http(s) va mailto havolalar ishlaydi
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) url = `mailto:${url}`
    else if (!/^(https?:\/\/|mailto:)/i.test(url)) url = `https://${url.replace(/^\/+/, "")}`

    const chain = editor.chain().focus().extendMarkRange("link")

    // Matn tanlanmagan bo'lsa — havolaning o'zini matn sifatida qo'shamiz
    if (editor.state.selection.empty && !linkState.active) {
      chain.insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] }).run()
    } else {
      chain.setLink({ href: url }).run()
    }
    setEditingLink(false)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-bg-2">
      <div className="flex flex-wrap items-center gap-1 border-b border-line p-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btn} font-bold`}>
          B
        </button>

        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btn} italic`}>
          I
        </button>

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn}>
          H2
        </button>

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn}>
          H3
        </button>

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn}>
          • List
        </button>

        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn}>
          1. List
        </button>

        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn}>
          Quote
        </button>

        <button
          type="button"
          onClick={openLinkEditor}
          title="Havola qo'shish / tahrirlash"
          className={`rounded px-3 py-1.5 text-sm hover:bg-bg-3 ${
            linkState.active || editingLink ? "bg-bg-3 text-accent" : "text-text-1"
          }`}
        >
          🔗 Link
        </button>

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          title="Rasm qo'shish (yoki rasmni bu yerga tashlang / joylang)"
          className={btn}
        >
          🖼 Rasm
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).filter(isImage)
            e.target.value = ""
            if (files.length) uploadRef.current(files)
          }}
        />

        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn}>
          ↶
        </button>

        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn}>
          ↷
        </button>
      </div>

      {editingLink && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveLink()
          }}
          className="flex flex-wrap items-center gap-2 border-b border-line bg-bg-1 px-3 py-2"
        >
          <input
            autoFocus
            type="text"
            name="editor-link-url"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && closeLinkEditor()}
            placeholder="https://example.com"
            className="min-w-[200px] flex-1 rounded-md border border-line bg-bg-2 px-3 py-1.5 text-sm text-text-0 outline-none placeholder:text-text-2 focus:border-accent"
          />
          <button type="submit" className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:opacity-90">
            Saqlash
          </button>
          <button type="button" onClick={closeLinkEditor} className="rounded-md px-3 py-1.5 text-sm text-text-1 hover:bg-bg-3">
            Bekor qilish
          </button>
        </form>
      )}

      {!editingLink && linkState.active && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-bg-1 px-3 py-2 text-sm">
          <span className="text-text-2">Havola:</span>
          <a
            href={linkState.href}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-[45%] truncate text-accent underline"
            title={linkState.href}
          >
            {linkState.href}
          </a>
          <a
            href={linkState.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line px-2.5 py-1 text-text-1 hover:border-accent-dim hover:text-accent"
          >
            Ochish ↗
          </a>
          <button type="button" onClick={openLinkEditor} className="rounded-md px-2.5 py-1 text-text-1 hover:bg-bg-3">
            Tahrirlash
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
            className="rounded-md px-2.5 py-1 text-danger hover:bg-bg-3"
          >
            O&apos;chirish
          </button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className="tiptap-editor min-h-[300px] px-4 py-3 text-sm text-text-0"
      />
    </div>
  )
}
