'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  FolderGit2,
  Pencil,
  Trash2,
  Github,
  ExternalLink,
  X,
  Save,
  Layers,
  Image as ImageIcon,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  CloudCheck,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CARD, INPUT, LABEL, BTN_PRIMARY, BTN_GHOST, Fab, SectionHeader } from './ui';
import { Project } from '@/lib/data-store';
import { projectApi } from '@/lib/api-client';
import { useToast } from './Toast';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

type PropsCard = {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (id: string, titleUz: string) => void;
  deleting?: boolean;
};

const ProjectCard: React.FC<PropsCard> = ({ project, onEdit, onDelete, deleting }) => {
  const images: string[] = (project.images || []).slice(0, 12).map((i: any) => i.imageUrl).filter(Boolean);
  const [active, setActive] = useState<number>(0);
  const created = project.createdAt ? format(new Date(project.createdAt), "dd-MMMM yyyy, HH:mm", { locale: uz }) : '';

  const prev = () => setActive((s) => (s - 1 + images.length) % images.length);
  const next = () => setActive((s) => (s + 1) % images.length);

  const iconBtn =
    'grid h-11 w-11 shrink-0 place-items-center rounded-sm text-text-2 hover:bg-bg-2 hover:text-text-0 transition-colors';

  return (
    <article className={`${CARD} overflow-hidden flex flex-col group`}>
      <header className="relative aspect-[16/9] select-none bg-bg-3">
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={images[active]} alt={project.title_uz || 'Project'} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-text-2">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-sm bg-black/60 px-2 py-0.5 font-mono text-[11px] text-white">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{images.length} rasm</span>
        </div>

        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="oldingi" className="absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-sm bg-black/50 text-white opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={next} aria-label="keyingi" className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-sm bg-black/50 text-white opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`rasm ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}
      </header>

      <div className="flex flex-1 items-start gap-2 p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="font-display text-[17px] font-semibold text-text-0 line-clamp-1">{project.title_uz}</h3>
          {project.technologies?.length > 0 && (
            <p className="font-mono text-[11px] text-text-2 line-clamp-1">{project.technologies.join(' · ')}</p>
          )}
          {project.description_uz && <p className="text-[13px] text-text-1 line-clamp-2">{project.description_uz}</p>}
          {created && <p className="font-mono text-[11px] text-text-2">{created}</p>}
        </div>

        <div className="-mr-1 -mt-1 flex shrink-0 items-center">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noreferrer" title="GitHub" aria-label="GitHub" className={`${iconBtn} hidden sm:grid`}>
              <Github className="w-[18px] h-[18px]" />
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer" title="Live Demo" aria-label="Live Demo" className={`${iconBtn} hidden sm:grid`}>
              <ExternalLink className="w-[18px] h-[18px]" />
            </a>
          )}
          <button onClick={() => onEdit(project)} title="Update" aria-label="Update" className={iconBtn}>
            <Pencil className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={() => onDelete(project.id, project.title_uz)}
            disabled={deleting}
            title="O'chirish"
            aria-label="O'chirish"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-danger border-t-transparent" />
            ) : (
              <Trash2 className="w-[18px] h-[18px]" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

import { ExpandableModal } from './ExpandableModal';
import { DraftsTray } from './DraftsTray';
import { useDrafts, readDrafts, newDraftId, type Draft } from '@/lib/drafts';
import { readModalSession, writeModalSession, clearModalSession } from '@/lib/modalSession';

interface ProjectDraftData {
  title: string; description: string; githubUrl: string; liveUrl: string; techStack: string;
}

export const ProjectManager: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [draftId, setDraftId] = useState<string | null>(null);
  const restored = useRef(false);
  const [sessionReady, setSessionReady] = useState(false);
  const { drafts, save: saveDraft, remove: removeDraft } = useDrafts<ProjectDraftData>('project');

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

  const hasDraftContent = (f: ProjectDraftData) =>
    Boolean(f.title.trim() || f.description.trim() || f.githubUrl.trim() || f.liveUrl.trim());

  /* Yangi loyiha yozilayotganda qoralama avtomatik saqlanadi (rasm fayllari brauzerda saqlanmaydi) */
  useEffect(() => {
    if (!isModalOpen || editingProject || !draftId || !hasDraftContent(formData)) return;
    const t = setTimeout(() => saveDraft(draftId, formData.title, formData), 600);
    return () => clearTimeout(t);
  }, [formData, isModalOpen, editingProject, draftId, saveDraft]);

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
    setDraftId(newDraftId());
    setIsModalOpen(true);
  };

  const handleResumeDraft = (d: Draft<ProjectDraftData>) => {
    setEditingProject(null);
    setFormData(d.data);
    setImagesList([]);
    setExistingImages([]);
    setSelectedPreviewIdx(0);
    setDraftId(d.id);
    setIsModalOpen(true);
  };

  const handleDeleteDraft = (d: Draft<ProjectDraftData>) => {
    if (!window.confirm(`"${d.title || 'Nomsiz qoralama'}" qoralamasini o'chirmoqchimisiz?`)) return;
    removeDraft(d.id);
    showToast("Qoralama o'chirildi", 'info');
  };

  /* Yopish — matn maydonlari qoralama sifatida saqlanib qoladi */
  const handleCloseModal = () => {
    if (!editingProject && draftId) {
      if (hasDraftContent(formData)) {
        showToast('Qoralama saqlandi', 'info', 'Rasmlar saqlanmaydi — davom ettirganda qayta tanlang');
      } else {
        removeDraft(draftId);
      }
    }
    setIsModalOpen(false);
    setDraftId(null);
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
    setDraftId(null);
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

      if (draftId) removeDraft(draftId);
      setIsModalOpen(false);
      setDraftId(null);
    } catch (err: any) {
      showToast('Saqlashda xatolik', 'error', err?.message || 'Noma\'lum xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  /* Sahifa yangilanganda modal oldingi holatida qayta ochiladi */
  useEffect(() => {
    if (restored.current) return;
    const sess = readModalSession<ProjectDraftData>('project');

    if (sess?.mode === 'edit') {
      if (loading) return; // loyihalar yuklanishini kutamiz
      const project = projects.find((p) => p.id === sess.editingId);
      restored.current = true;
      if (project) {
        handleOpenEditModal(project);
        if (sess.form) setFormData(sess.form);
      }
    } else if (sess?.mode === 'new') {
      restored.current = true;
      const d = readDrafts<ProjectDraftData>('project').find((x) => x.id === sess.draftId);
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
  }, [loading, projects]);

  useEffect(() => {
    if (!sessionReady) return;
    if (!isModalOpen) {
      clearModalSession('project');
      return;
    }
    const t = setTimeout(() => {
      if (editingProject) {
        writeModalSession('project', { mode: 'edit', editingId: editingProject.id, form: formData });
      } else {
        writeModalSession('project', { mode: 'new', draftId });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [sessionReady, isModalOpen, editingProject, draftId, formData]);

  /* Bosh sahifadagi "tezkor amal" orqali kelinganda (?create=1) — yangi loyiha oynasi ochiladi */
  useEffect(() => {
    if (!sessionReady || searchParams.get('create') !== '1') return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('create');
    router.replace(`?${params.toString()}`);
    if (!isModalOpen) handleOpenNewModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, searchParams]);

  return (
    <div className="px-4 lg:px-8 space-y-4 lg:space-y-5">
      <SectionHeader
        meta={`(${projects.length} ta)`}
        title="Loyihalar"
        desc="Har bir loyiha uchun rasmlar, havolalar va texnologiyalarni boshqaring."
        actions={
          <button onClick={handleOpenNewModal} className={`${BTN_PRIMARY} hidden lg:inline-flex`}>
            <Plus className="w-4 h-4" />
            <span>Yangi loyiha</span>
          </button>
        }
      />

      <DraftsTray drafts={drafts} onResume={handleResumeDraft} onDelete={handleDeleteDraft} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-bg-1 rounded-md border border-line" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <Layers className="w-10 h-10 text-text-2 mx-auto mb-3" />
          <h3 className="font-display text-base font-semibold text-text-0">Loyiha topilmadi</h3>
          <p className="text-[13px] text-text-2 mt-1">Yangi loyiha qo&apos;shishni boshlang.</p>
          <button onClick={handleOpenNewModal} className={`${BTN_PRIMARY} mt-5`}>+ Qo&apos;shish</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
              deleting={deletingId === project.id}
            />
          ))}
        </div>
      )}

      <Fab onClick={handleOpenNewModal} icon={Plus} label="Yangi loyiha" />

      {isModalOpen && (
        <ExpandableModal
          onClose={handleCloseModal}
          icon={<FolderGit2 className="w-4 h-4" />}
          title={editingProject ? 'Loyihani Yangilash (Update)' : 'Yangi Loyiha Yaratish (Create)'}
          subtitle={
            !editingProject && hasDraftContent(formData) ? (
              <span className="inline-flex items-center gap-1 text-accent">
                <CloudCheck className="h-3 w-3" />
                Qoralama saqlandi
              </span>
            ) : undefined
          }
          actions={
            <button type="submit" form="project-form" disabled={submitting} className={`${BTN_PRIMARY} h-11 px-4`}>
              {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-on-accent border-t-transparent" /> : <Save className="w-4 h-4 hidden sm:block" />}
              <span>{editingProject ? 'Loyihani Yangilash' : 'Loyihani Yaratish'}</span>
            </button>
          }
          widthClass="max-w-3xl"
          persistKey="project"
        >
            <form id="project-form" onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-5">
              <div>
                <label htmlFor="project-title" className={LABEL}>Loyiha Nomi (Title) *</label>
                <input id="project-title" type="text" required placeholder="Masalan: DevPulse AI Code Reviewer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`${INPUT} h-12 font-display text-[16px] font-semibold`} />
              </div>

              <div>
                <label htmlFor="project-desc" className={LABEL}>Qisqa Izoh (Description)</label>
                <textarea id="project-desc" rows={5} placeholder="Loyiha vazifasi va asosiy afzalliklari..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${INPUT} resize-none`} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="project-gh" className={LABEL}>GitHub URL</label>
                  <div className="relative">
                    <Github className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-2" />
                    <input id="project-gh" type="url" placeholder="https://github.com/..." value={formData.githubUrl} onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })} className={`${INPUT} h-12 pl-10 font-mono text-[13px]`} />
                  </div>
                </div>

                <div>
                  <label htmlFor="project-live" className={LABEL}>Live Demo URL</label>
                  <div className="relative">
                    <ExternalLink className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-2" />
                    <input id="project-live" type="url" placeholder="https://my-app.demo.com" value={formData.liveUrl} onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })} className={`${INPUT} h-12 pl-10 font-mono text-[13px]`} />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="project-tech" className={LABEL}>Texnologiyalar (Vergul bilan ajratilgan Tech Stack)</label>
                <input id="project-tech" type="text" placeholder="Next.js 15, TypeScript, Tailwind, Gemini AI" value={formData.techStack} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} className={`${INPUT} h-12 font-mono text-[13px]`} />
                {formData.techStack.trim() && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {formData.techStack.split(',').map((t) => t.trim()).filter(Boolean).map((t, i) => (
                      <span key={`${t}-${i}`} className="rounded-sm bg-bg-3 px-2 py-0.5 font-mono text-[11px] text-text-1">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <span className={LABEL}>Loyiha Rasmlari (2 - 6 ta rasm) *</span>
                  <p className="-mt-1 text-[12px] text-text-2">Minimal 2 ta, maksimal 6 ta rasm biriktirilishi shart.</p>
                </div>

                {existingImages.length > 0 && (
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-line bg-bg-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={existingImages[selectedPreviewIdx] || existingImages[0]} alt="Selected Project Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 rounded-sm bg-black/60 px-2 py-0.5 font-mono text-[11px] text-white">
                      {selectedPreviewIdx === 0 ? '1-Rasm (Muqova Rasm)' : `${selectedPreviewIdx + 1}-Rasm`}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {existingImages.map((imgUrl, index) => (
                    <div key={index} onClick={() => setSelectedPreviewIdx(index)} className={`relative aspect-square rounded-sm overflow-hidden border-2 cursor-pointer transition-colors ${selectedPreviewIdx === index ? 'border-text-0' : 'border-transparent hover:border-line'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={`Rasm ${index + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 rounded-sm bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">#{index + 1}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }} className="absolute top-1 right-1 grid h-7 w-7 place-items-center rounded-sm bg-black/60 text-white hover:bg-danger transition-colors" title="O'chirish" aria-label="O'chirish">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {existingImages.length < 6 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-line bg-bg-1 text-text-2 hover:border-text-2 hover:text-text-0 transition-colors">
                      <input type="file" accept="image/*" multiple onChange={handleImageFileChange} className="sr-only" />
                      <ImagePlus className="h-5 w-5" />
                      <span className="font-mono text-[11px]">{existingImages.length}/6</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={handleCloseModal} className={BTN_GHOST}>Bekor qilish</button>
              </div>
            </form>
        </ExpandableModal>
      )}
    </div>
  );
};
