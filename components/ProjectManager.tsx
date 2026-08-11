'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  FolderGit2,
  Edit,
  Trash2,
  Github,
  ExternalLink,
  X,
  Save,
  Layers,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Watch,
  WatchIcon,
  LucideWatch,
  ClockCheck,
} from 'lucide-react';
import { Project } from '@/lib/data-store';
import { projectApi } from '@/lib/api-client';
import { useToast } from './Toast';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

type PropsCard = {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (id: string, titleUz: string) => void;
};

const ProjectCard: React.FC<PropsCard> = ({ project, onEdit, onDelete }) => {
  const imgs = (project.images || []).slice(0, 12).map((i: any) => i.imageUrl);
  const images = imgs.length ? imgs : ['https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900&q=80'];
  const [active, setActive] = useState<number>(0);
  const created = project.createdAt ? format(new Date(project.createdAt), "dd-MMMM yyyy, HH:mm:ss", { locale: uz }) : '';

  const prev = () => setActive((s) => (s - 1 + images.length) % images.length);
  const next = () => setActive((s) => (s + 1) % images.length);

  return (
    <article className="bg-gradient-to-b from-[#07120f] to-[#071219] rounded-sm border border-[#213028] overflow-hidden flex flex-col justify-between shadow-lg group">
      <header className="relative h-44 select-none">
        <img src={images[active]} alt={project.title_uz || 'Project'} className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 text-[12px] text-[#cfeee8] font-semibold flex items-center gap-2 border border-[#123b33]">
          <ImageIcon className="w-4 h-4" />
          <span>{images.length} rasm</span>
        </div>

        <button onClick={prev} aria-label="oldingi" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={next} aria-label="keyingi" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white">
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`rasm ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === active ? 'bg-[#7dd3fc]' : 'bg-white/30'}`
              }
            />
          ))}
        </div>
      </header>

      <div className="p-5 space-y-3">
        <h3 className="text-lg font-semibold text-[#f8fff8] line-clamp-1">{project.title_uz}</h3>

        <p className="text-sm text-[#bfded6] line-clamp-3">{project.description_uz}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          {project.technologies?.map((t, i) => (
            <span key={i} className="text-xs bg-[#0f2b26] text-[#bfeee6] px-2 py-0.5 rounded-full border border-[#164e45]">
              #{t}
            </span>
          ))}
        </div>
      </div>

      <footer className="p-4 bg-[#041010]/60 border-t border-[#213028]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[#9fbfaf] flex items-center gap-1 font-mono">
            <span>{created}</span>
          </div>
          |
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-[60%] sm:w-auto">
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-md bg-[#0b2a2e] text-[#cfeee8] text-xs border border-[#135552] hover:bg-[#114d4f] justify-center">
                <Github className="w-4 h-4" /> 
              </a>
            )}

            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-md bg-[#072b2f] text-[#d7fff9] text-xs border border-[#0f6b68] hover:bg-[#0f6b68] justify-center">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button onClick={() => onEdit(project)} className="flex items-center gap-2 p-2 rounded-md bg-[#123b33] text-[#e6fff9] text-xs border border-[#1f8a52] hover:bg-[#1f8a52] justify-center">
              <Edit className="w-4 h-4" /> 
            </button>

            <button onClick={() => onDelete(project.id, project.title_uz)} disabled={false} className="flex items-center gap-2 p-2 rounded-md bg-[#3b1515] text-[#ffd7d7] hover:bg-[#6b1f1f] border border-[#7f2b2b] justify-center">
              <Trash2 className="w-4 h-4" /> 
            </button>
          </div>
        </div>
      </footer>
    </article>
  );
};

export const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesList, setImagesList] = useState<File[]>([]);
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    githubUrl: '',
    liveUrl: '',
    techStack: 'Next.js, TypeScript, Tailwind',
  });

  useEffect(() => {
    let ignore = false;
    projectApi.getAll('uz')
      .then((data) => {
        if (!ignore) {
          setProjects(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!ignore) {
          showToast('Loyihalarni yuklashda xatolik', 'error', err.message);
          setLoading(false);
        }
      });
    return () => { ignore = true; };
  }, [showToast]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const remainingSlots = 6 - existingImages.length;
    if (remainingSlots <= 0) {
      showToast('Cheklov', 'error', "Maksimal 6 ta rasm qo'shish mumkin");
      return;
    }

    const newFiles = Array.from(files).slice(0, remainingSlots);
    setImagesList((prev) => [...prev, ...newFiles]);
    setExistingImages((prev) => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    showToast('Rasm qo\'shildi', 'success', `${newFiles.length} ta rasm tanlandi`);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setImagesList((prev) => prev.filter((_, i) => i !== index));
    if (selectedPreviewIdx >= index && selectedPreviewIdx > 0) setSelectedPreviewIdx((p) => p - 1);
  };

  const handleOpenNewModal = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      githubUrl: '',
      liveUrl: '',
      techStack: 'Next.js, TypeScript, Tailwind CSS',
    });
    setImagesList([]);
    setExistingImages([]);
    setSelectedPreviewIdx(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title_uz || '',
      description: project.description_uz || '',
      githubUrl: project.githubUrl || '',
      liveUrl: project.liveUrl || '',
      techStack: (project.technologies || []).join(', '),
    });
    const imgs = (project.images || []).slice(0, 6).map((i: any) => i.imageUrl);
    setExistingImages(imgs);
    setImagesList([]);
    setSelectedPreviewIdx(0);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, titleUz: string) => {
    if (!window.confirm(`"${titleUz}" loyihasini o'chirmoqchimisiz?`)) return;
    setDeletingId(id);
    try {
      await projectApi.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast('Loyiha o\'chirildi', 'success', `"${titleUz}" muvaffaqiyatli o'chirildi`);
    } catch (err: any) {
      showToast('O\'chirishda xatolik', 'error', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return showToast('Xatolik', 'error', 'Loyiha nomi majburiy');
    if (existingImages.length < 2) return showToast('Xatolik', 'error', "Kamida 2 ta rasm kerak");

    setSubmitting(true);
    try {
      const techStack = formData.techStack.split(',').map(s => s.trim()).filter(Boolean);
      const data = new FormData();

      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('githubUrl', formData.githubUrl);
      data.append('liveUrl', formData.liveUrl);
      data.append('technologies', JSON.stringify(techStack));
      imagesList.forEach((file) => data.append('images', file));

      if (editingProject) {
        const res = await projectApi.update(editingProject.id, data);
        const srv = res?.project || res || {};
        const updated: Project = {
          ...editingProject,
          ...(srv),
          title_uz: formData.title,
          description_uz: formData.description,
          githubUrl: formData.githubUrl,
          liveUrl: formData.liveUrl,
          technologies: techStack,
          images: srv?.images || editingProject.images,
        } as any;
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast('Loyiha yangilandi', 'success', `"${formData.title}" saqlandi`);
      } else {
        const res = await projectApi.create(data);
        const project = res?.project || res || {};
        const newProject: Project = {
          id: project?.id || `proj-${Date.now()}`,
          ...(project),
          title_uz: formData.title,
          description_uz: formData.description,
          githubUrl: formData.githubUrl,
          liveUrl: formData.liveUrl,
          technologies: techStack,
          createdAt: project?.createdAt || new Date().toISOString(),
          images: project?.images || [],
        } as any;
        setProjects((prev) => [newProject, ...prev]);
        showToast('Loyiha yaratildi', 'success', 'Yangi loyiha saqlandi');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Saqlashda xatolik', 'error', err?.message || 'Noma\'lum xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-1 from-[#07121b] to-[#081227] p-5 rounded-sm border border-[#22302a] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-sm bg-accent-dim from-[#0ea5a4] to-[#7dd3fc] text-[#012527]">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#f1fff7] flex items-center gap-2">
              <span>Loyihalar</span>
              <span className="text-xs text-[#c2f0e8] font-mono">({projects.length} ta)</span>
            </h2>
            <p className="text-xs text-[#bcded6]">Har bir loyiha uchun rasmlar, havolalar va texnologiyalarni boshqaring.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 rounded-sm bg-gradient-to-r from-accent-glow to-[#3D2314] text-white font-semibold text-sm flex items-center gap-2 shadow-lg hover:scale-[1.01] transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi loyiha</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-[#0e1411] rounded-sm border border-[#213028]" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-[#071217] rounded-sm border border-[#213028]">
          <Layers className="w-12 h-12 text-[#7baea6] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#cfe9dd]">Loyiha topilmadi</h3>
          <p className="text-xs text-[#9fbfaf] mt-1">Yangi loyiha qo'shishni boshlang.</p>
          <button onClick={handleOpenNewModal} className="mt-4 px-4 py-2 rounded-xl bg-[#0ea5a4] text-[#02201f] font-semibold">+ Qo'shish</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onEdit={handleOpenEditModal} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0d1310] rounded-2xl border border-[#213028] shadow-2xl overflow-auto">
            <div className="p-5 border-b border-[#213028] flex items-center justify-between bg-[#080b09]">
              <div className="flex items-center gap-2 text-[#49f08a] font-mono text-sm font-bold">
                <FolderGit2 className="w-4 h-4" />
                <span>{editingProject ? 'Loyihani Yangilash (Update)' : 'Yangi Loyiha Yaratish (Create)'}</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-[#aab8b0] hover:text-[#eaf2ec]"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-mono text-[#aab8b0] block mb-1">Loyiha Nomi (Title) *</label>
                <input type="text" required placeholder="Masalan: DevPulse AI Code Reviewer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3.5 py-2 bg-[#131b16] border border-[#213028] rounded-lg text-sm text-[#eaf2ec] focus:outline-none focus:border-[#49f08a]/60 font-sans" />
              </div>

              <div>
                <label className="text-xs font-mono text-[#aab8b0] block mb-1">Qisqa Izoh (Description)</label>
                <textarea rows={2} placeholder="Loyiha vazifasi va asosiy afzalliklari..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3.5 py-2 bg-[#131b16] border border-[#213028] rounded-lg text-sm text-[#eaf2ec] focus:outline-none focus:border-[#49f08a]/60 font-sans" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#aab8b0] block mb-1">GitHub URL</label>
                  <input type="url" placeholder="https://github.com/..." value={formData.githubUrl} onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })} className="w-full px-3.5 py-2 bg-[#131b16] border border-[#213028] rounded-lg text-sm text-[#eaf2ec] focus:outline-none focus:border-[#49f08a]/60 font-mono" />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#aab8b0] block mb-1">Live Demo URL</label>
                  <input type="url" placeholder="https://my-app.demo.com" value={formData.liveUrl} onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })} className="w-full px-3.5 py-2 bg-[#131b16] border border-[#213028] rounded-lg text-sm text-[#eaf2ec] focus:outline-none focus:border-[#49f08a]/60 font-mono" />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[#aab8b0] block mb-1">Texnologiyalar (Vergul bilan ajratilgan Tech Stack)</label>
                <input type="text" placeholder="Next.js 15, TypeScript, Tailwind, Gemini AI" value={formData.techStack} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} className="w-full px-3.5 py-2 bg-[#131b16] border border-[#213028] rounded-lg text-sm text-[#eaf2ec] focus:outline-none focus:border-[#49f08a]/60 font-mono" />
              </div>

              <div className="space-y-3 pt-2 border-t border-[#213028]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-mono text-[#49f08a] font-bold block">Loyiha Rasmlari (2 - 6 ta rasm) *</label>
                    <p className="text-[11px] text-[#aab8b0]">Minimal 2 ta, maksimal 6 ta rasm biriktirilishi shart.</p>
                  </div>
                </div>

                {existingImages.length < 6 && (
                  <div>
                    <input type="file" accept="image/*" multiple onChange={handleImageFileChange} className="w-full text-xs text-[#aab8b0] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#182119] file:text-[#49f08a] file:border-[#1f8a52]/40 hover:file:bg-[#1f8a52] hover:file:text-[#eaf2ec] cursor-pointer" />
                  </div>
                )}

                {existingImages.length > 0 && (
                  <>
                    <div className="relative h-44 w-full rounded-xl overflow-hidden bg-[#080b09] border border-[#213028]">
                      <img src={existingImages[selectedPreviewIdx] || existingImages[0]} alt="Selected Project Preview" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-[#080b09]/80 text-[#49f08a] text-[10px] font-mono border border-[#213028]">
                        {selectedPreviewIdx === 0 ? '1-Rasm (Muqova Rasm)' : `${selectedPreviewIdx + 1}-Rasm`}
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-2 pt-1">
                      {existingImages.map((imgUrl, index) => (
                        <div key={index} onClick={() => setSelectedPreviewIdx(index)} className={`relative group h-20 rounded-xl overflow-hidden border cursor-pointer transition-all ${selectedPreviewIdx === index ? 'border-[#49f08a] ring-2 ring-[#49f08a]/30' : 'border-[#213028] hover:border-[#1f8a52]/60'}`}>
                          <img src={imgUrl} alt={`Rasm ${index + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-[#eaf2ec] font-mono">#{index + 1}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }} className="absolute top-1 right-1 p-1 rounded-full bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-500/40 opacity-90 group-hover:opacity-100 transition-opacity" title="O'chirish">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-[#213028] flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-[#182119] text-[#aab8b0] hover:bg-[#213028] hover:text-[#eaf2ec] text-xs font-semibold transition-colors">Bekor qilish</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#10b981] text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors disabled:opacity-50">
                  {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-transparent" /> : <Save className="w-4 h-4" />}
                  <span>{editingProject ? 'Loyihani Yangilash' : 'Loyihani Yaratish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};