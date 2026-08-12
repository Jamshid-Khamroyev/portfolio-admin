'use client';

import React, { useEffect, useState, useRef } from 'react';
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
} from 'lucide-react';
import { BlogPost } from '@/lib/data-store';
import { blogApi } from '@/lib/api-client';
import { useToast } from './Toast';
import type { JSONContent } from "@tiptap/react"
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import RichTextEditor from './shared/RichTextEditor';

export const BlogManager: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const imageObjectUrl = useRef<string | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    content: JSONContent;
    image: File | string | null;
    isPrivate: boolean;
  }>({
    title: '',
    description: '',
    content: { type: 'doc', content: [] } as JSONContent,
    image: null,
    isPrivate: false,
  });

  useEffect(() => {
    let ignore = false;
    const loadBlogs = async () => {
      setLoading(true);
      try {
        const data: BlogPost[] = searchQuery.trim() ? await blogApi.search(searchQuery) : await blogApi.getAll();
        if (!ignore) setBlogs(data);
      } catch (err: any) {
        if (!ignore) showToast('Bloglarni yuklashda xatolik', 'error', err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadBlogs();
    return () => { ignore = true; };
  }, [searchQuery, showToast]);

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
    setFormData({ title: '', description: '', content: { type: 'doc', content: [] } as JSONContent, image: null, isPrivate: false });
    setImagePreview('');
    setIsModalOpen(true);
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
    });
    setImagePreview(blog.coverImage || '');
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
    if (!formData.title.trim()) {
      showToast('Xatolik', 'error', 'Sarlavha (title) bo\'sh bo\'lishi mumkin emas');
      return;
    }
    setSubmitting(true);
    try {
      if (formData.isPrivate) {
        const privatePayload = { title: formData.title, description: formData.description, content: formData.content, visible: 'PRIVATE' };
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
          if (formData.image instanceof File) {
            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('description', formData.description);
            fd.append('content', JSON.stringify(formData.content));
            fd.append('visible', 'PUBLIC');
            fd.append('image', formData.image);
            const res = await blogApi.create(fd);
            const srv = res?.blog || res || {};
            const newBlog: BlogPost = {
              id: srv.id || `blog-${Date.now()}`,
              coverImage: srv.coverImage || imagePreview || '',
              visible: srv.visible || 'PUBLIC',
              ...(srv),
              title: formData.title,
              description: formData.description,
              content: formData.content,
              createdAt: srv.createdAt || new Date().toISOString(),
            } as any;
            setBlogs((prev) => [newBlog, ...prev]);
            showToast('Blog yaratildi', 'success', `Yangi PUBLIC blog saqlandi`);
          } else {
            const payload = {
              title: formData.title,
              description: formData.description,
              content: formData.content,
              image: typeof formData.image === 'string' ? formData.image : undefined,
              visible: 'PUBLIC',
            };
            const res = await blogApi.create(payload);
            const srv = res?.blog || res || {};
            const newBlog: BlogPost = {
              id: srv.id || `blog-${Date.now()}`,
              coverImage: srv.coverImage || payload.image || '',
              visible: srv.visible || 'PUBLIC',
              ...(srv),
              title: srv.title_uz || formData.title,
              description: srv.description_uz || formData.description,
              content: srv.content_uz || formData.content,
              createdAt: srv.createdAt || new Date().toISOString(),
            } as any;
            setBlogs((prev) => [newBlog, ...prev]);
            showToast('Blog yaratildi', 'success', `Yangi PUBLIC blog saqlandi`);
          }
        }
      }
      setIsModalOpen(false);
      revokeObjectUrl();
    } catch (err: any) {
      console.log(err);
      showToast('Saqlashda xatolik', 'error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openPublic = (slug?: string) => {
    if (!slug) return;
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/blogs/${slug}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#07120f] to-[#0b1220] p-5 rounded-sm border border-[#213028] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-sm bg-gradient-to-br from-[#1f3b2f] to-[#123127] border border-[#1f8a52]/40 text-[#a7ffd2]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#eaf2ec] flex items-center gap-2">
              <span>Blog Boshqaruvi</span>
              <span className="text-xs text-[#ffbf59] font-mono">{`(${blogs.length} ta)`}</span>
            </h2>
            <p className="text-xs text-[#cfe9dd]">Yangi maqolalar chop etish, yangilash va o'chirish — tez va chiroyli.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 rounded-sm bg-gradient-to-r from-accent-glow to-[#3D2314] text-white font-semibold text-sm flex items-center gap-2 shadow-lg hover:scale-[1.01] transition-transform"
            >
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white">Yangi Blog</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-[#131b16] rounded-sm border border-[#213028]"></div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="p-12 text-center bg-[#0d1310] rounded-sm border border-[#213028]">
          <FileText className="w-12 h-12 text-[#71847a] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#aab8b0]">Bloglar topilmadi</h3>
          <p className="text-xs text-[#71847a] mt-1">Yangi post yaratishni boshlang.</p>
          <button onClick={handleOpenNewModal} className="mt-4 px-4 py-2 rounded-xl bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a] text-xs font-mono font-semibold">+ Birinchi blog yaratish</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => {
            const title = (blog as any).title_uz || blog.title || '—';
            const desc = (blog as any).description_uz || (blog as any).description || '';
            const created = blog.createdAt 
  ? format(new Date(blog.createdAt), "d-MMMM, yyyy, HH:mm:ss", { locale: uz }) 
  : '';
            return (
              <div key={blog.id} className="bg-gradient-to-b from-[#07120f] to-[#071219] border border-[#2b3a33] rounded-sm overflow-hidden flex flex-col justify-between group hover:shadow-2xl transition-shadow duration-300">
                <div>
                  <div className="relative h-44 w-full bg-[#131b16] overflow-hidden">
                    <img src={blog.coverImage || imagePreview || 'https://unsplash.com/photos/a-golden-padlock-sitting-on-top-of-a-keyboard-FnA5pAzqhMM'} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071217]/80 via-transparent to-black/30" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#0b1b15]/90 border border-[#274b3c] text-[10px] font-mono font-semibold text-[#ffd8a8] flex items-center gap-2">
                      <Globe2 className="w-3 h-3 text-[#ffd8a8]" />
                      <span>{blog.visible === 'PRIVATE' ? 'MAXFIY' : 'PUBLIC'}</span>
                    </div>
                    {blog.visible === 'PRIVATE' && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#3b1717]/20 border border-[#7f2b2b] text-[10px] font-mono text-[#ff9a9a] flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Maxfiy</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-[#f3fff7] line-clamp-1 truncate max-w-[70%]">{title}</h3>
                    </div>

                    <p className="text-sm text-[#cfe4db] line-clamp-3">{desc || (blog as any).content_uz?.slice(0, 200) || (blog.content || '').slice(0, 200)}</p>
                  </div>
                </div>

                <div className="p-4 border-t border-[#213028] bg-[#041010]/60 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-[#8fbfa6] font-mono">
                    <div>{created}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openPublic((blog as any).slug)} className="px-3 py-1.5 rounded-lg bg-[#072b2f] border border-[#2ea7a8] text-[#c8fff7] hover:bg-[#0f5e61] text-xs font-semibold flex items-center gap-2 transition-colors">
                      <Globe2 className="w-4 h-4" />
                      Open
                    </button>
                    <button onClick={() => handleOpenEditModal(blog)} className="px-3 py-1.5 rounded-lg bg-[#0f2b26] border border-[#3e9b77] text-[#c8ffee] hover:bg-[#2a6a53] text-xs font-semibold flex items-center gap-2 transition-colors">
                      <Edit className="w-4 h-4" />
                      Update
                    </button>
                    <button onClick={() => handleDelete(blog.id, (blog as any).title_uz || blog.title)} disabled={deletingId === blog.id} className="p-2 rounded-lg bg-[#2b1212] border border-[#7f2b2b] text-[#ffb6b6] hover:bg-[#5a1f1f] text-xs transition-colors disabled:opacity-50 flex items-center justify-center">
                      {deletingId === blog.id ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#ffb6b6] border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0d1310] border border-[#213028] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-[#213028] flex items-center justify-between bg-[#080b09]">
              <div className="flex items-center gap-2 text-[#49f08a] font-mono text-sm font-bold">
                <BookOpen className="w-4 h-4" />
                <span>{editingBlog ? 'Blogni Yangilash (Update)' : 'Yangi Blog Yaratish (Create)'}</span>
              </div>
              <button onClick={() => { setIsModalOpen(false); revokeObjectUrl(); }} className="p-1 text-[#aab8b0] hover:text-[#eaf2ec]"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-mono text-[#aab8b0] block mb-1">Sarlavha (Title) *</label>
                <input type="text" required placeholder="Masalan: Next.js 15 App Router Qo'llanmasi" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3.5 py-2 bg-[#131b16] border border-[#213028] rounded-lg text-sm text-[#eaf2ec] focus:outline-none focus:border-[#49f08a]/60 font-sans" />
              </div>

              <div>
                <label className="text-xs font-mono text-[#aab8b0] block mb-1">Tavsif (Description)</label>
                <textarea rows={2} placeholder="Maqolaning qisqacha tavsifi (description)..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3.5 py-2 bg-[#131b16] border border-[#213028] rounded-lg text-sm text-[#eaf2ec] focus:outline-none focus:border-[#49f08a]/60 font-sans" />
              </div>

              <div>
                <label className="text-xs font-mono text-[#aab8b0] block mb-1">
                  Kontent (Content)
                </label>

                <RichTextEditor
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
                  <label className="text-xs font-mono text-[#aab8b0] block mb-1">Rasm Yuklash (Public blog uchun)</label>
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="w-full text-xs text-[#aab8b0] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#182119] file:text-[#49f08a] file:border-[#1f8a52]/40 hover:file:bg-[#1f8a52] hover:file:text-[#eaf2ec] cursor-pointer" />
                  {(imagePreview || typeof formData.image === 'string') && (
                    <div className="mt-2 p-2 bg-[#131b16] border border-[#213028] rounded-xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono text-[#49f08a] flex items-center gap-1"><Eye className="w-3 h-3" /><span>Rasm Preview:</span></span>
                      <div className="relative h-36 w-full rounded-lg overflow-hidden bg-[#080b09]">
                        <img src={imagePreview || (formData.image as string)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl text-xs font-mono text-[#ff6b6b]"><strong>Eslatma:</strong> Maxfiy blog (visible: PRIVATE) yaratilganda image/rasm parametr yuborilmaydi.</div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="isPrivate" checked={formData.isPrivate} onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })} className="w-4 h-4 rounded bg-[#131b16] border-[#213028] text-[#49f08a] focus:ring-[#49f08a]" />
                <label htmlFor="isPrivate" className="text-xs text-[#eaf2ec] font-mono cursor-pointer flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-[#ff6b6b]" /><span>Maxfiy blog sifatida saqlash (visible: PRIVATE)</span></label>
              </div>

              <div className="pt-4 border-t border-[#213028] flex items-center justify-end gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); revokeObjectUrl(); }} className="px-4 py-2 rounded-xl bg-[#131b16] text-[#aab8b0] hover:bg-[#182119] hover:text-[#eaf2ec] text-xs font-semibold transition-colors">Bekor qilish</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#7dd3fc] text-[#02201f] font-bold text-xs flex items-center gap-2 shadow-lg transition-colors disabled:opacity-50">
                  {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#02201f] border-t-transparent" /> : <Save className="w-4 h-4" />}
                  <span>{editingBlog ? 'Yangilashni Saqlash' : 'Chop Etish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};