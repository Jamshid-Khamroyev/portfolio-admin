'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Plus,
  BookOpen,
  Edit,
  Trash2,
  Lock,
  Eye,
  X,
  Save,
  FileText,
  Globe2,
  BarChart3,
  Search,
  PenLine,
  ImagePlus,
  Send,
  Linkedin,
  CloudCheck,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlogPost, BlogViewStats } from '@/lib/data-store';
import { blogApi, uploadApi } from '@/lib/api-client';
import { useBlogStore } from '@/hooks/useBlogStore';
import { useToast } from './Toast';
import type { JSONContent } from "@tiptap/react"
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import RichTextEditor, { collectImageFileIds } from './shared/RichTextEditor';
import { ExpandableModal } from './ExpandableModal';
import { DraftsTray } from './DraftsTray';
import { useDrafts, readDrafts, newDraftId, type Draft } from '@/lib/drafts';
import { readModalSession, writeModalSession, clearModalSession } from '@/lib/modalSession';
import { CARD, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST, FilterChip, Fab, OverflowMenu, SectionHeader, SwitchRow } from './ui';

interface BlogDraftData {
  form: { title: string; description: string; content: JSONContent; isPrivate: boolean; postToTelegram: boolean; postToLinkedIn: boolean };
  seen: string[];
}

interface BlogManagerProps {
  /** Navbar'dagi umumiy qidiruv qatori — blog raqami (masalan "1047") bo'yicha */
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const BlogManager: React.FC<BlogManagerProps> = ({ searchQuery = '', setSearchQuery }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<'all' | 'PUBLIC' | 'PRIVATE'>('all');
  const { blogs, loaded, setBlogs } = useBlogStore();
  const [loading, setLoading] = useState<boolean>(!loaded);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [imagesUploading, setImagesUploading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const imageObjectUrl = useRef<string | null>(null);
  /* Muharrir sessiyasida ko'rilgan barcha rasm fileId'lari — saqlangach ishlatilmaganlari ImageKit'dan o'chiriladi */
  const seenImageIds = useRef<Set<string>>(new Set());
  const [draftId, setDraftId] = useState<string | null>(null);
  const restored = useRef(false);
  const [sessionReady, setSessionReady] = useState(false);
  const { drafts, save: saveDraft, remove: removeDraft } = useDrafts<BlogDraftData>('blog');
  const { showToast } = useToast();

  const [statsBlog, setStatsBlog] = useState<BlogPost | null>(null);
  const [statsData, setStatsData] = useState<BlogViewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  const handleOpenStats = async (blog: BlogPost) => {
    setStatsBlog(blog);
    setStatsData(null);
    setStatsLoading(true);
    try {
      const data: BlogViewStats = await blogApi.getStats(blog.id);
      setStatsData(data);
    } catch (err: any) {
      showToast("Statistikani yuklashda xatolik", 'error', err.message);
      setStatsBlog(null);
    } finally {
      setStatsLoading(false);
    }
  };

  /** Redis'dagi manba kodini o'qiladigan yorliqqa aylantiradi (lib/blogViews.ts bilan mos) */
  const sourceLabel = (source: string): string => {
    const known: Record<string, string> = {
      direct: "To'g'ridan-to'g'ri havola",
      internal: 'Sayt ichidan',
      telegram: 'Telegram',
      google: 'Google',
      social: 'Ijtimoiy tarmoq',
    };
    if (known[source]) return known[source];
    if (source.startsWith('referral:')) return source.slice('referral:'.length);
    return source;
  };

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    content: JSONContent;
    image: File | string | null;
    isPrivate: boolean;
    postToTelegram: boolean;
    postToLinkedIn: boolean;
  }>({
    title: '',
    description: '',
    content: { type: 'doc', content: [] } as JSONContent,
    image: null,
    isPrivate: false,
    postToTelegram: true,
    postToLinkedIn: true,
  });

  useEffect(() => {
    /* Avval yuklangan bo'lsa — qayta so'rov yubormaymiz, sahifaga qaytilganda darhol ko'rsatiladi */
    if (loaded) {
      setLoading(false);
      return;
    }

    let ignore = false;
    const loadBlogs = async () => {
      setLoading(true);
      try {
        const data: BlogPost[] = await blogApi.getAll();
        if (!ignore) setBlogs(data);
      } catch (err: any) {
        if (!ignore) showToast('Bloglarni yuklashda xatolik', 'error', err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadBlogs();
    return () => { ignore = true; };
  }, [loaded, showToast, setBlogs]);

  const hasDraftContent = (f: { title: string; description: string; content: JSONContent }) =>
    Boolean(f.title.trim() || f.description.trim() || (f.content?.content ?? []).some((n: any) => n.type === 'image' || n.content?.length));

  /* Yangi blog yozilayotganda qoralama avtomatik saqlanadi */
  useEffect(() => {
    if (!isModalOpen || editingBlog || !draftId || !hasDraftContent(formData)) return;
    const t = setTimeout(() => {
      saveDraft(draftId, formData.title, {
        form: {
          title: formData.title,
          description: formData.description,
          content: formData.content,
          isPrivate: formData.isPrivate,
          postToTelegram: formData.postToTelegram,
          postToLinkedIn: formData.postToLinkedIn,
        },
        seen: [...seenImageIds.current],
      });
    }, 600);
    return () => clearTimeout(t);
  }, [formData, isModalOpen, editingBlog, draftId, saveDraft]);

  /*
    Qidiruv — sarlavha/tavsif emas, blog raqami (masalan "1047") bo'yicha.
    Hammasi allaqachon Zustand'da xotirada turgani uchun server'ga
    murojaat qilmasdan, shu yerning o'zida filtrlab ko'rsatamiz.
  */
  const filteredBlogs = useMemo(() => {
    const digits = searchQuery.replace(/\D/g, '');
    if (!digits) return blogs;
    return blogs.filter((b) => String(b.blogNumber ?? '').includes(digits));
  }, [blogs, searchQuery]);

  const revokeObjectUrl = () => {
    if (imageObjectUrl.current) {
      URL.revokeObjectURL(imageObjectUrl.current);
      imageObjectUrl.current = null;
    }
  };

  const applyCoverFile = (file: File) => {
    revokeObjectUrl();
    const url = URL.createObjectURL(file);
    imageObjectUrl.current = url;
    setImagePreview(url);
    setFormData((prev) => ({ ...prev, image: file }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) applyCoverFile(file);
  };

  const handleOpenNewModal = () => {
    revokeObjectUrl();
    setEditingBlog(null);
    setFormData({ title: '', description: '', content: { type: 'doc', content: [] } as JSONContent, image: null, isPrivate: false, postToTelegram: true, postToLinkedIn: true });
    setImagePreview('');
    seenImageIds.current = new Set();
    setDraftId(newDraftId());
    setIsModalOpen(true);
  };

  const handleResumeDraft = (d: Draft<BlogDraftData>) => {
    revokeObjectUrl();
    setEditingBlog(null);
    setFormData({ ...d.data.form, image: null });
    setImagePreview('');
    seenImageIds.current = new Set(d.data.seen ?? []);
    setDraftId(d.id);
    setIsModalOpen(true);
  };

  /* Qoralamani butunlay o'chirish — unga yuklangan rasmlar ImageKit'dan ham o'chadi */
  const handleDeleteDraft = (d: Draft<BlogDraftData>) => {
    if (!window.confirm(`"${d.title || 'Nomsiz qoralama'}" qoralamasini o'chirmoqchimisiz?`)) return;
    const ids = collectImageFileIds(d.data.form.content).concat(d.data.seen ?? []);
    uploadApi.remove([...new Set(ids)]).catch(() => {});
    removeDraft(d.id);
    showToast("Qoralama o'chirildi", 'info', 'Rasmlari ham tozalandi');
  };

  /* Yopish — qoralama saqlanib qoladi (pastdagi ro'yxatdan davom ettiriladi) */
  const handleCloseModal = () => {
    if (imagesUploading) {
      showToast('Rasm yuklanmoqda', 'info', 'Yuklash tugashini kuting');
      return;
    }
    if (!editingBlog && draftId) {
      if (hasDraftContent(formData)) {
        showToast('Qoralama saqlandi', 'info', 'Sahifa pastidan davom ettirishingiz mumkin');
      } else {
        removeDraft(draftId);
      }
    }
    setIsModalOpen(false);
    setDraftId(null);
    revokeObjectUrl();
  };

  const handleOpenEditModal = (blog: BlogPost) => {
    revokeObjectUrl();
    setEditingBlog(blog);
    setFormData({
      title: (blog as any).title_uz || blog.title || '',
      content: (blog as any).content_uz || blog.content || '',
      image: blog.coverImage || null,
      description: (blog as any).description_uz || blog.description || '',
      isPrivate: blog.visible === 'PRIVATE',
      postToTelegram: true,
      postToLinkedIn: true,
    });
    setImagePreview(blog.coverImage || '');
    seenImageIds.current = new Set(collectImageFileIds((blog as any).content_uz || blog.content));
    setDraftId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Siz rostdan ham "${title}" blogini o'chirmoqchimisiz?`)) return;
    setDeletingId(id);
    try {
      await blogApi.delete(id);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      showToast('Blog o\'chirildi', 'success', `"${title}" muvaffaqiyatli o'chirib tashlandi`);
    } catch (err: any) {
      showToast('O\'chirishda xatolik', 'error', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const isContentEmpty = (content: JSONContent | null | undefined) => {
      if (!content?.content?.length) return true
      return !content.content[0].content?.[0]?.text?.trim()
    }

  const buildUpdatePayload = () => {
    const payload = new FormData()

    let changed = false

    if (formData.title !== editingBlog?.title) {
      payload.append("title", formData.title)
      changed = true
    }

    if (formData.description !== editingBlog?.description) {
      payload.append("description", formData.description)
      changed = true
    }

    if (
      JSON.stringify(formData.content) !==
      JSON.stringify(editingBlog?.content)
    ) {
      if (!isContentEmpty(formData.content)) {
        payload.append("content", JSON.stringify(formData.content))
        changed = true
      }
    }

    if (formData.image instanceof File) {
      payload.append("image", formData.image)
      changed = true
    }

    const visible = formData.isPrivate ? "PRIVATE" : "PUBLIC"

    if (visible !== editingBlog?.visible) {
      payload.append("visible", visible)
      changed = true
    }

    return changed ? payload : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imagesUploading) {
      showToast("Rasm yuklanmoqda", "info", "Yuklash tugashini kuting");
      return;
    }
    if (!formData.title.trim()) {
      showToast('Xatolik', 'error', 'Sarlavha (title) bo\'sh bo\'lishi mumkin emas');
      return;
    }
    setSubmitting(true);
    try {
      if (formData.isPrivate) {
       const privatePayload = new FormData();

        privatePayload.append("title", formData.title);
        privatePayload.append("description", formData.description);
        privatePayload.append("content", JSON.stringify(formData.content));
        privatePayload.append("visible", "PRIVATE");

        const res = await blogApi.createPrivate(privatePayload);
        const srv = res?.blog || res || {};
        const newPrivateBlog: BlogPost = {
          id: srv.id || `blog-private-${Date.now()}`,
          coverImage: srv.coverImage || '',
          visible: srv.visible || 'PRIVATE',
          ...(srv),
          title: srv.title_uz || formData.title,
          description: srv.description_uz || formData.description,
          content: srv.content_uz || formData.content,
          createdAt: srv.createdAt || new Date().toISOString(),
        } as any;
        setBlogs((prev) => [newPrivateBlog, ...prev]);
        showToast('Maxfiy blog yaratildi', 'success', `"${formData.title}" maxfiy blog sifatida saqlandi`);
      } else {
        if (editingBlog) {
          const payload = buildUpdatePayload();
          if (!payload) {
            showToast('Hech narsa o\'zgarmadi', 'info', 'Yangilash uchun o\'zgartirilgan maydon yo\'q');
            setIsModalOpen(false);
            setSubmitting(false);
            return;
          }
          const res = await blogApi.update(editingBlog.id, payload);
          const srv = res?.blog || res || {};
          const updated: BlogPost = {
            ...editingBlog,
            id: srv.id || editingBlog.id,
            coverImage: srv.coverImage || imagePreview || editingBlog.coverImage,
            visible: srv.visible || (formData.isPrivate ? 'PRIVATE' : 'PUBLIC'),
            ...(srv),
            title: formData.title ||  editingBlog.title,
            description: formData.description || (editingBlog as any).description || '',
            content: formData.content || (editingBlog as any).content || { type: 'doc', content: [] } as JSONContent,
            updatedAt: srv.updatedAt || new Date().toISOString(),
          } as any;
          setBlogs((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          showToast('Blog yangilandi', 'success', `"${updated.title}" ma'lumotlari yangilandi`);
        } else {
          {
            /*
              Har doim FormData — hatto rasm tanlanmagan holatda ham.
              Avval rasm bo'lmasa oddiy JS obyekt yuborilardi, lekin
              header "multipart/form-data" deb yolg'on ko'rsatilgani
              uchun (axios buni JSON qilib jo'natadi) backend
              `req.formData()` uni to'g'ri o'qiy olmasdi.
            */
            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('description', formData.description);
            fd.append('content', JSON.stringify(formData.content));
            fd.append('visible', 'PUBLIC');
            if (formData.image instanceof File) {
              fd.append('image', formData.image);
            }
            fd.append('postToTelegram', String(formData.postToTelegram));
            fd.append('postToLinkedIn', String(formData.postToLinkedIn));
            const res = await blogApi.create(fd);
            const srv = res?.blog || res || {};
            const newBlog: BlogPost = {
              id: srv.id || `blog-${Date.now()}`,
              coverImage: srv.coverImage || '',
              visible: srv.visible || 'PUBLIC',
              ...(srv),
              title: srv.title_uz || formData.title,
              description: srv.description_uz || formData.description,
              content: srv.content_uz || formData.content,
              createdAt: srv.createdAt || new Date().toISOString(),
            } as any;
            setBlogs((prev) => [newBlog, ...prev]);

            if (formData.postToLinkedIn && srv.linkedin?.posted === false) {
              showToast(
                'Blog yaratildi',
                'info',
                `LinkedIn'ga post qilinmadi: ${srv.linkedin.reason === 'not_connected' ? "LinkedIn ulanmagan (Setting'da token yo'q)" : srv.linkedin.reason === 'token_expired' ? 'LinkedIn tokeni muddati tugagan' : 'LinkedIn API xatosi'}`
              );
            } else {
              showToast('Blog yaratildi', 'success', `Yangi PUBLIC blog saqlandi`);
            }
          }
        }
      }
      /* Matndan olib tashlangan / almashtirilgan rasmlarni ImageKit'dan tozalaymiz */
      const keep = new Set(collectImageFileIds(formData.content));
      const orphans = [...seenImageIds.current].filter((id) => !keep.has(id));
      if (orphans.length) uploadApi.remove(orphans).catch(() => {});
      if (draftId) removeDraft(draftId);
      setIsModalOpen(false);
      setDraftId(null);
      revokeObjectUrl();
    } catch (err: any) {
      console.log(err);
      showToast('Saqlashda xatolik', 'error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* Sahifa yangilanganda modal oldingi holatida (ochiq/yopiq, qaysi yozuv) qayta ochiladi */
  useEffect(() => {
    if (restored.current) return;
    const sess = readModalSession<{ title: string; description: string; content: JSONContent; isPrivate: boolean }>('blog');

    if (sess?.mode === 'edit') {
      if (!loaded) return; // bloglar yuklanishini kutamiz
      const blog = blogs.find((b) => b.id === sess.editingId);
      restored.current = true;
      if (blog) {
        handleOpenEditModal(blog);
        if (sess.form) setFormData((prev) => ({ ...prev, ...sess.form }));
      }
    } else if (sess?.mode === 'new') {
      restored.current = true;
      const d = readDrafts<BlogDraftData>('blog').find((x) => x.id === sess.draftId);
      if (d) {
        handleResumeDraft(d);
      } else {
        handleOpenNewModal();
        if (sess.draftId) setDraftId(sess.draftId);
      }
    } else {
      restored.current = true;
    }
    setSessionReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, blogs]);

  /* Modal holatini yozib boramiz (yopilganda — o'chiramiz) */
  useEffect(() => {
    if (!sessionReady) return;
    if (!isModalOpen) {
      clearModalSession('blog');
      return;
    }
    const t = setTimeout(() => {
      if (editingBlog) {
        writeModalSession('blog', {
          mode: 'edit',
          editingId: editingBlog.id,
          form: { title: formData.title, description: formData.description, content: formData.content, isPrivate: formData.isPrivate },
        });
      } else {
        writeModalSession('blog', { mode: 'new', draftId });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [sessionReady, isModalOpen, editingBlog, draftId, formData]);

  /* Bosh sahifadagi "tezkor amal" orqali kelinganda (?create=1) — yangi blog oynasi ochiladi */
  useEffect(() => {
    if (!sessionReady || searchParams.get('create') !== '1') return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('create');
    router.replace(`?${params.toString()}`);
    if (!isModalOpen) handleOpenNewModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, searchParams]);

  const openPublic = (slug?: string) => {
    if (!slug) return;
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/blogs/${slug}`;
    window.open(url, '_blank');
  };

  /* Holat filtri (yuklangan ro'yxatdan hisoblanadi) */
  const statusCounts = useMemo(
    () => ({
      all: filteredBlogs.length,
      PUBLIC: filteredBlogs.filter((b) => b.visible !== 'PRIVATE').length,
      PRIVATE: filteredBlogs.filter((b) => b.visible === 'PRIVATE').length,
    }),
    [filteredBlogs]
  );
  const visibleBlogs = useMemo(
    () =>
      statusFilter === 'all'
        ? filteredBlogs
        : filteredBlogs.filter((b) => (statusFilter === 'PRIVATE' ? b.visible === 'PRIVATE' : b.visible !== 'PRIVATE')),
    [filteredBlogs, statusFilter]
  );

  const coverSrc = imagePreview || (typeof formData.image === 'string' ? formData.image : '');

  return (
    <div className="px-4 lg:px-8 space-y-4 lg:space-y-5">
      <SectionHeader
        meta={`(${filteredBlogs.length}${filteredBlogs.length !== blogs.length ? ` / ${blogs.length}` : ''} ta)`}
        title="Blog Boshqaruvi"
        desc={<>Yangi maqolalar chop etish, yangilash va o&apos;chirish — tez va chiroyli.</>}
        actions={
          <button onClick={handleOpenNewModal} className={`${BTN_PRIMARY} hidden lg:inline-flex`}>
            <Plus className="w-4 h-4" />
            <span>Yangi Blog</span>
          </button>
        }
      />

      {/* Qidiruv (mobil — desktopda yon paneldagi qidiruv ishlatiladi) */}
      {setSearchQuery && (
        <div className="relative lg:hidden">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-2" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="Blog ID (masalan 1047)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="h-11 w-full rounded-sm border border-line bg-bg-1 pl-11 pr-4 text-[15px] text-text-0 placeholder:text-text-2 focus:border-accent focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Holat filtrlari */}
      {!loading && blogs.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="Hammasi" count={statusCounts.all} />
          <FilterChip active={statusFilter === 'PUBLIC'} onClick={() => setStatusFilter('PUBLIC')} label="PUBLIC" count={statusCounts.PUBLIC} />
          <FilterChip active={statusFilter === 'PRIVATE'} onClick={() => setStatusFilter('PRIVATE')} label="Maxfiy" count={statusCounts.PRIVATE} />
        </div>
      )}

      {/* Saqlangan qoralamalar banneri */}
      <DraftsTray drafts={drafts} onResume={handleResumeDraft} onDelete={handleDeleteDraft} />

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[104px] bg-bg-1 rounded-md border border-line"></div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <FileText className="w-10 h-10 text-text-2 mx-auto mb-3" />
          <h3 className="font-display text-base font-semibold text-text-0">Bloglar topilmadi</h3>
          <p className="text-[13px] text-text-2 mt-1">Yangi post yaratishni boshlang.</p>
          <button onClick={handleOpenNewModal} className={`${BTN_PRIMARY} mt-5`}>+ Birinchi blog yaratish</button>
        </div>
      ) : visibleBlogs.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <FileText className="w-10 h-10 text-text-2 mx-auto mb-3" />
          <h3 className="font-display text-base font-semibold text-text-0">
            {searchQuery.replace(/\D/g, '') ? `#${searchQuery.replace(/\D/g, '')} raqamli blog topilmadi` : 'Bloglar topilmadi'}
          </h3>
          {searchQuery.replace(/\D/g, '') && <p className="text-[13px] text-text-2 mt-1">Boshqa raqam bilan qidirib ko&apos;ring.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {visibleBlogs.map((blog) => {
            const title = (blog as any).title_uz || blog.title || '—';
            const desc = (blog as any).description_uz || (blog as any).description || '';
            const created = blog.createdAt
              ? format(new Date(blog.createdAt), "d-MMMM, yyyy, HH:mm", { locale: uz })
              : '';
            const isPrivate = blog.visible === 'PRIVATE';
            return (
              <article key={blog.id} className={`${CARD} flex items-start gap-3 p-3 lg:p-4`}>
                {/* Muqova (yo'q bo'lsa — blog raqami) */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(blog)}
                  className="relative h-[72px] w-[72px] lg:h-20 lg:w-24 shrink-0 overflow-hidden rounded-sm bg-bg-3"
                  aria-label={`${title} — Update`}
                >
                  {blog.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={blog.coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center font-mono text-[12px] text-text-2">
                      {typeof blog.blogNumber === 'number' ? `#${blog.blogNumber}` : <FileText className="h-5 w-5" />}
                    </span>
                  )}
                </button>

                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex items-start gap-2">
                    <h3 className="flex-1 font-display text-[15px] lg:text-base font-semibold leading-snug text-text-0 line-clamp-2">
                      {title}
                    </h3>
                    {typeof blog.blogNumber === 'number' && blog.coverImage && (
                      <span className="shrink-0 rounded-sm bg-bg-3 px-1.5 py-0.5 font-mono text-[10px] text-text-1">#{blog.blogNumber}</span>
                    )}
                  </div>
                  {desc && <p className="mt-1 hidden lg:block text-[13px] text-text-1 line-clamp-1">{desc}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text-2">
                    <span className={`inline-flex items-center gap-1.5 text-text-1`}>
                      <i className={`h-1.5 w-1.5 rounded-full ${isPrivate ? 'bg-text-2' : 'bg-accent'}`} />
                      {isPrivate ? 'Maxfiy' : 'PUBLIC'}
                    </span>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => handleOpenStats(blog)}
                      title="Ko'rishlar statistikasi"
                      className="inline-flex items-center gap-1 font-mono hover:text-text-0 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {blog.views ?? 0}
                    </button>
                    {created && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{created}</span>
                      </>
                    )}
                  </div>
                </div>

                {deletingId === blog.id ? (
                  <span className="m-3 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-danger border-t-transparent" />
                ) : (
                  <OverflowMenu
                    items={[
                      { label: "Ko'rishlar statistikasi", icon: BarChart3, onClick: () => handleOpenStats(blog) },
                      ...(blog.slug ? [{ label: 'Open', icon: Globe2, onClick: () => openPublic(blog.slug) }] : []),
                      { label: 'Update', icon: Edit, onClick: () => handleOpenEditModal(blog) },
                      {
                        label: "O'chirish",
                        icon: Trash2,
                        danger: true,
                        onClick: () => handleDelete(blog.id, (blog as any).title_uz || blog.title),
                      },
                    ]}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}

      <Fab onClick={handleOpenNewModal} icon={PenLine} label="Yangi Blog" />

      {isModalOpen && (
        <ExpandableModal
          onClose={handleCloseModal}
          icon={<BookOpen className="w-4 h-4" />}
          title={editingBlog ? 'Blogni Yangilash (Update)' : 'Yangi Blog Yaratish (Create)'}
          subtitle={
            !editingBlog && hasDraftContent(formData) ? (
              <span className="inline-flex items-center gap-1 text-accent">
                <CloudCheck className="h-3 w-3" />
                Qoralama saqlandi
              </span>
            ) : undefined
          }
          actions={
            <button
              type="submit"
              form="blog-form"
              disabled={submitting || imagesUploading}
              title={imagesUploading ? "Rasm yuklanmoqda..." : undefined}
              className={`${BTN_PRIMARY} h-11 px-4`}
            >
              {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-on-accent border-t-transparent" /> : <Save className="w-4 h-4 hidden sm:block" />}
              <span>{editingBlog ? 'Yangilashni Saqlash' : 'Chop Etish'}</span>
            </button>
          }
          widthClass="max-w-3xl"
          persistKey="blog"
        >
            <form id="blog-form" onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-5">
              {!formData.isPrivate ? (
                <div>
                  <span className={LABEL}>Rasm Yuklash (Public blog uchun)</span>
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
                      if (file) applyCoverFile(file);
                    }}
                    className="group relative flex min-h-[148px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed border-line bg-bg-1 p-5 text-center hover:border-text-2 transition-colors"
                  >
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="sr-only" />
                    {coverSrc ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverSrc} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
                        <span className="relative mt-auto inline-flex items-center gap-1.5 rounded-sm bg-black/60 px-2.5 py-1 font-mono text-[11px] text-white">
                          <ImagePlus className="h-3.5 w-3.5" />
                          Rasm Preview
                        </span>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6 text-text-2" />
                        <span className="text-[14px] font-semibold text-text-0">Rasm Yuklash</span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-sm border border-danger/30 bg-danger/10 p-3.5 text-[13px] text-danger">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                  <p><strong>Eslatma:</strong> Maxfiy blog (visible: PRIVATE) yaratilganda image/rasm parametr yuborilmaydi.</p>
                </div>
              )}

              <div>
                <label htmlFor="blog-title" className={LABEL}>Sarlavha (Title) *</label>
                <input id="blog-title" type="text" required placeholder="Masalan: Next.js 15 App Router Qo'llanmasi" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`${INPUT} h-12 font-display text-[16px] font-semibold`} />
              </div>

              <div>
                <label htmlFor="blog-desc" className={LABEL}>Tavsif (Description)</label>
                <textarea id="blog-desc" rows={3} placeholder="Maqolaning qisqacha tavsifi (description)..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${INPUT} resize-none`} />
              </div>

              <div>
                <span className={LABEL}>Kontent (Content)</span>
                <RichTextEditor
                  onUploadingChange={setImagesUploading}
                  onImageUploaded={(id) => seenImageIds.current.add(id)}
                  onImageRemoved={(id) => seenImageIds.current.delete(id)}
                  protectedImageIds={editingBlog ? collectImageFileIds((editingBlog as any).content_uz || editingBlog.content) : []}
                  value={formData.content}
                  onChange={(content) =>
                    setFormData((prev) => ({
                      ...prev,
                      content,
                    }))
                  }
                />
              </div>

              <div className={`${CARD} divide-y divide-line overflow-hidden`}>
                <SwitchRow
                  id="isPrivate"
                  icon={Lock}
                  tone="danger"
                  label="Maxfiy blog sifatida saqlash (visible: PRIVATE)"
                  checked={formData.isPrivate}
                  onChange={(v) => setFormData((prev) => ({ ...prev, isPrivate: v }))}
                />
                {!editingBlog && !formData.isPrivate && (
                  <>
                    <SwitchRow
                      id="postToTelegram"
                      icon={Send}
                      label="Telegram'ga post qilish"
                      checked={formData.postToTelegram}
                      onChange={(v) => setFormData((prev) => ({ ...prev, postToTelegram: v }))}
                    />
                    <SwitchRow
                      id="postToLinkedIn"
                      icon={Linkedin}
                      label="LinkedIn'ga post qilish"
                      checked={formData.postToLinkedIn}
                      onChange={(v) => setFormData((prev) => ({ ...prev, postToLinkedIn: v }))}
                    />
                  </>
                )}
              </div>

              <div className="hidden lg:flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={handleCloseModal} className={BTN_GHOST}>Bekor qilish</button>
              </div>
            </form>
        </ExpandableModal>
      )}

      {statsBlog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setStatsBlog(null)}>
          <div
            className="bg-bg-1 border border-line rounded-t-md sm:rounded-md w-full sm:max-w-md overflow-hidden pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <BarChart3 className="w-4 h-4 shrink-0 text-text-2" />
                <span className="font-display text-[16px] font-semibold text-text-0">Ko&apos;rishlar statistikasi</span>
              </div>
              <button onClick={() => setStatsBlog(null)} aria-label="Yopish" className="grid h-10 w-10 place-items-center rounded-sm text-text-1 hover:bg-bg-2 hover:text-text-0"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-sm text-text-1 line-clamp-1">
                {(statsBlog as any).title_uz || statsBlog.title}
              </p>

              {statsLoading ? (
                <div className="py-8 flex items-center justify-center">
                  <span className="animate-spin rounded-full h-6 w-6 border-2 border-text-2 border-t-transparent" />
                </div>
              ) : statsData ? (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-md bg-bg-2 border border-line">
                    <Eye className="w-5 h-5 shrink-0 text-text-2" />
                    <div>
                      <div className="font-display text-[28px] font-semibold text-text-0 leading-none tabular-nums">{statsData.views}</div>
                      <div className="text-[12px] text-text-2 mt-1">jami ko&apos;rishlar</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-medium text-text-2 uppercase tracking-wider mb-3">Qayerdan kirishdi</div>

                    {statsData.sources.length === 0 ? (
                      <p className="text-xs text-text-2">Hali ma&apos;lumot yo&apos;q.</p>
                    ) : (
                      <div className="space-y-3">
                        {statsData.sources.map((s) => {
                          const percentage = statsData.views ? Math.round((s.count / statsData.views) * 100) : 0;
                          return (
                            <div key={s.source}>
                              <div className="flex items-center justify-between text-[13px] mb-1.5">
                                <span className="text-text-0">{sourceLabel(s.source)}</span>
                                <span className="text-text-1 font-mono text-[12px]">{s.count} ({percentage}%)</span>
                              </div>
                              <div className="h-1.5 rounded-[2px] bg-bg-3 overflow-hidden">
                                <div className="h-full rounded-[2px] bg-accent" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p className="text-[11px] text-text-2 mt-4">
                      Kesh orqali har 10 daqiqada yangilanadi — so&apos;nggi ko&apos;rishlar hali bu yerda bo&apos;lmasligi mumkin.
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
