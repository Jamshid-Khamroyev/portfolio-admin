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
} from 'lucide-react';
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

interface BlogDraftData {
  form: { title: string; description: string; content: JSONContent; isPrivate: boolean; postToTelegram: boolean; postToLinkedIn: boolean };
  seen: string[];
}

interface BlogManagerProps {
  /** Navbar'dagi umumiy qidiruv qatori — blog raqami (masalan "1047") bo'yicha */
  searchQuery?: string;
}

export const BlogManager: React.FC<BlogManagerProps> = ({ searchQuery = '' }) => {
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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      revokeObjectUrl();
      const url = URL.createObjectURL(file);
      imageObjectUrl.current = url;
      setImagePreview(url);
      setFormData((prev) => ({ ...prev, image: file }));
    }
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

  const openPublic = (slug?: string) => {
    if (!slug) return;
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/blogs/${slug}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-1 p-5 rounded-sm border border-line shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-sm bg-accent/15 border border-accent-dim/30 text-accent">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-0 flex items-center gap-2">
              <span>Blog Boshqaruvi</span>
              <span className="text-xs text-warn font-mono">{`(${filteredBlogs.length}${filteredBlogs.length !== blogs.length ? ` / ${blogs.length}` : ''} ta)`}</span>
            </h2>
            <p className="text-xs text-text-0">Yangi maqolalar chop etish, yangilash va o&apos;chirish — tez va chiroyli.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 rounded-sm bg-accent text-on-accent hover:opacity-90 font-semibold text-sm flex items-center gap-2 shadow-sm transition-opacity"
            >
            <Plus className="w-4 h-4 text-on-accent" />
            <span className="text-on-accent">Yangi Blog</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-bg-2 rounded-sm border border-line"></div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="p-12 text-center bg-bg-1 rounded-sm border border-line">
          <FileText className="w-12 h-12 text-text-2 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-text-1">Bloglar topilmadi</h3>
          <p className="text-xs text-text-2 mt-1">Yangi post yaratishni boshlang.</p>
          <button onClick={handleOpenNewModal} className="mt-4 px-4 py-2 rounded-xl bg-bg-3 border border-accent-dim/40 text-accent text-xs font-mono font-semibold">+ Birinchi blog yaratish</button>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="p-12 text-center bg-bg-1 rounded-sm border border-line">
          <FileText className="w-12 h-12 text-text-2 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-text-1">#{searchQuery.replace(/\D/g, '')} raqamli blog topilmadi</h3>
          <p className="text-xs text-text-2 mt-1">Boshqa raqam bilan qidirib ko&apos;ring.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => {
            const title = (blog as any).title_uz || blog.title || '—';
            const desc = (blog as any).description_uz || (blog as any).description || '';
            const created = blog.createdAt 
  ? format(new Date(blog.createdAt), "d-MMMM, yyyy, HH:mm:ss", { locale: uz }) 
  : '';
            return (
              <div key={blog.id} className="bg-bg-1 border border-line rounded-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow duration-300">
                <div>
                  <div className="relative h-44 w-full bg-bg-2 overflow-hidden">
                    <img src={blog.coverImage || 'https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-bg-2/90 border border-line text-[10px] font-mono font-semibold text-text-0 flex items-center gap-2">
                      <Globe2 className="w-3 h-3 text-text-0" />
                      <span>{blog.visible === 'PRIVATE' ? 'MAXFIY' : 'PUBLIC'}</span>
                    </div>
                    {blog.visible === 'PRIVATE' && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-bg-2/20 border border-danger/40 text-[10px] font-mono text-warn flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Maxfiy</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-text-0 line-clamp-1 truncate max-w-[70%]">{title}</h3>
                      {typeof blog.blogNumber === 'number' && (
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-bg-2 border border-line text-[10px] font-mono font-semibold text-accent">#{blog.blogNumber}</span>
                      )}
                    </div>

                    <p className="text-sm text-text-0 line-clamp-3">{desc || (blog as any).content_uz?.slice(0, 200) || (blog.content || '').slice(0, 200)}</p>
                  </div>
                </div>

                <div className="p-4 border-t border-line bg-bg-2/60 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-text-1 font-mono">
                    <div>{created}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenStats(blog)}
                      title="Ko'rishlar statistikasi"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-2 border border-line text-text-1 hover:text-accent hover:border-accent-dim/50 text-xs font-mono transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{blog.views ?? 0}</span>
                    </button>
                    <button onClick={() => openPublic((blog as any).slug)} className="px-3 py-1.5 rounded-lg bg-bg-2 border border-accent-dim/40 text-text-0 hover:bg-bg-2 text-xs font-semibold flex items-center gap-2 transition-colors">
                      <Globe2 className="w-4 h-4" />
                      Open
                    </button>
                    <button onClick={() => handleOpenEditModal(blog)} className="px-3 py-1.5 rounded-lg bg-bg-2 border border-accent-dim/40 text-text-0 hover:bg-[#2a6a53] text-xs font-semibold flex items-center gap-2 transition-colors">
                      <Edit className="w-4 h-4" />
                      Update
                    </button>
                    <button onClick={() => handleDelete(blog.id, (blog as any).title_uz || blog.title)} disabled={deletingId === blog.id} className="p-2 rounded-lg bg-bg-2 border border-danger/40 text-warn hover:bg-danger/15 text-xs transition-colors disabled:opacity-50 flex items-center justify-center">
                      {deletingId === blog.id ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-danger border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DraftsTray drafts={drafts} onResume={handleResumeDraft} onDelete={handleDeleteDraft} />

      {isModalOpen && (
        <ExpandableModal
          onClose={handleCloseModal}
          icon={<BookOpen className="w-4 h-4" />}
          title={editingBlog ? 'Blogni Yangilash (Update)' : 'Yangi Blog Yaratish (Create)'}
          widthClass="max-w-3xl"
          persistKey="blog"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-mono text-text-1 block mb-1">Sarlavha (Title) *</label>
                <input type="text" required placeholder="Masalan: Next.js 15 App Router Qo'llanmasi" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3.5 py-2 bg-bg-2 border border-line rounded-lg text-sm text-text-0 focus:outline-none focus:border-accent/60 font-sans" />
              </div>

              <div>
                <label className="text-xs font-mono text-text-1 block mb-1">Tavsif (Description)</label>
                <textarea rows={2} placeholder="Maqolaning qisqacha tavsifi (description)..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3.5 py-2 bg-bg-2 border border-line rounded-lg text-sm text-text-0 focus:outline-none focus:border-accent/60 font-sans" />
              </div>

              <div>
                <label className="text-xs font-mono text-text-1 block mb-1">
                  Kontent (Content)
                </label>

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

              {!formData.isPrivate ? (
                <div className="space-y-2">
                  <label className="text-xs font-mono text-text-1 block mb-1">Rasm Yuklash (Public blog uchun)</label>
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="w-full text-xs text-text-1 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-bg-3 file:text-accent file:border-accent-dim/40 hover:file:bg-accent-dim hover:file:text-text-0 cursor-pointer" />
                  {(imagePreview || typeof formData.image === 'string') && (
                    <div className="mt-2 p-2 bg-bg-2 border border-line rounded-xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono text-accent flex items-center gap-1"><Eye className="w-3 h-3" /><span>Rasm Preview:</span></span>
                      <div className="relative h-36 w-full rounded-lg overflow-hidden bg-bg-0">
                        <img src={imagePreview || (formData.image as string)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-xs font-mono text-danger"><strong>Eslatma:</strong> Maxfiy blog (visible: PRIVATE) yaratilganda image/rasm parametr yuborilmaydi.</div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="isPrivate" checked={formData.isPrivate} onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })} className="w-4 h-4 rounded bg-bg-2 border-line text-accent focus:ring-accent" />
                <label htmlFor="isPrivate" className="text-xs text-text-0 font-mono cursor-pointer flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-danger" /><span>Maxfiy blog sifatida saqlash (visible: PRIVATE)</span></label>
              </div>

              {!editingBlog && !formData.isPrivate && (
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="postToTelegram" checked={formData.postToTelegram} onChange={(e) => setFormData({ ...formData, postToTelegram: e.target.checked })} className="w-4 h-4 rounded bg-bg-2 border-line text-accent focus:ring-accent" />
                    <label htmlFor="postToTelegram" className="text-xs text-text-0 font-mono cursor-pointer">Telegram&apos;ga post qilish</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="postToLinkedIn" checked={formData.postToLinkedIn} onChange={(e) => setFormData({ ...formData, postToLinkedIn: e.target.checked })} className="w-4 h-4 rounded bg-bg-2 border-line text-accent focus:ring-accent" />
                    <label htmlFor="postToLinkedIn" className="text-xs text-text-0 font-mono cursor-pointer">LinkedIn&apos;ga post qilish</label>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 rounded-xl bg-bg-2 text-text-1 hover:bg-bg-3 hover:text-text-0 text-xs font-semibold transition-colors">Bekor qilish</button>
                <button type="submit" disabled={submitting || imagesUploading} title={imagesUploading ? "Rasm yuklanmoqda..." : undefined} className="px-5 py-2 disabled:opacity-50 rounded-xl bg-accent text-on-accent hover:opacity-90 font-bold text-xs flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50">
                  {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-line border-t-transparent" /> : <Save className="w-4 h-4" />}
                  <span>{editingBlog ? 'Yangilashni Saqlash' : 'Chop Etish'}</span>
                </button>
              </div>
            </form>
        </ExpandableModal>
      )}

      {statsBlog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg-1 border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-sm my-8">
            <div className="p-5 border-b border-line flex items-center justify-between bg-bg-0">
              <div className="flex items-center gap-2 text-accent font-mono text-sm font-bold">
                <BarChart3 className="w-4 h-4" />
                <span>Ko&apos;rishlar statistikasi</span>
              </div>
              <button onClick={() => setStatsBlog(null)} className="p-1 text-text-1 hover:text-text-0"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-text-0 line-clamp-1">
                {(statsBlog as any).title_uz || statsBlog.title}
              </p>

              {statsLoading ? (
                <div className="py-8 flex items-center justify-center">
                  <span className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
                </div>
              ) : statsData ? (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-2 border border-line">
                    <Eye className="w-6 h-6 text-accent" />
                    <div>
                      <div className="text-2xl font-bold text-text-0 font-mono leading-none">{statsData.views}</div>
                      <div className="text-[11px] text-text-2 mt-1">jami ko&apos;rishlar</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-text-2 uppercase tracking-widest mb-2">Qayerdan kirishdi</div>

                    {statsData.sources.length === 0 ? (
                      <p className="text-xs text-text-2">Hali ma&apos;lumot yo&apos;q.</p>
                    ) : (
                      <div className="space-y-2">
                        {statsData.sources.map((s) => {
                          const percentage = statsData.views ? Math.round((s.count / statsData.views) * 100) : 0;
                          return (
                            <div key={s.source}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-text-0 font-mono">{sourceLabel(s.source)}</span>
                                <span className="text-text-1 font-mono">{s.count} ({percentage}%)</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-bg-2 overflow-hidden">
                                <div className="h-full bg-accent" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p className="text-[10px] text-text-2 mt-4">
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