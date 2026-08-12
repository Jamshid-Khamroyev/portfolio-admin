"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

interface RichTextEditorProps {
  value: Record<string, unknown> | null
  onChange: (value: Record<string, unknown>) => void
}

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],

    content: value,

    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#213028] bg-[#131b16]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#213028] p-2">
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
          className="rounded px-3 py-1.5 text-sm font-bold text-[#aab8b0] hover:bg-[#1b2920]"
        >
          B
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
          className="rounded px-3 py-1.5 text-sm italic text-[#aab8b0] hover:bg-[#1b2920]"
        >
          I
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 2 })
              .run()
          }
          className="rounded px-3 py-1.5 text-sm text-[#aab8b0] hover:bg-[#1b2920]"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 3 })
              .run()
          }
          className="rounded px-3 py-1.5 text-sm text-[#aab8b0] hover:bg-[#1b2920]"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          className="rounded px-3 py-1.5 text-sm text-[#aab8b0] hover:bg-[#1b2920]"
        >
          • List
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          className="rounded px-3 py-1.5 text-sm text-[#aab8b0] hover:bg-[#1b2920]"
        >
          1. List
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          className="rounded px-3 py-1.5 text-sm text-[#aab8b0] hover:bg-[#1b2920]"
        >
          Quote
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().undo().run()
          }
          className="rounded px-3 py-1.5 text-sm text-[#aab8b0] hover:bg-[#1b2920]"
        >
          ↶
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().redo().run()
          }
          className="rounded px-3 py-1.5 text-sm text-[#aab8b0] hover:bg-[#1b2920]"
        >
          ↷
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="tiptap-editor min-h-[300px] px-4 py-3 text-sm text-[#eaf2ec]"
      />
    </div>
  )
}