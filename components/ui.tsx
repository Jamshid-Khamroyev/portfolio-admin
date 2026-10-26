'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, Activity, BookOpen, FolderGit2, MessageSquare, Bell } from 'lucide-react';

/* Umumiy dizayn bo'laklari — barcha bo'limlar shu yerdan oladi */

export const CARD = 'rounded-md bg-bg-1 border border-line shadow-[var(--shadow-card)]';

export const INPUT =
  'w-full px-3.5 py-2.5 bg-bg-2 border border-line rounded-sm text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-accent transition-colors';

export const LABEL = 'text-[13px] font-medium text-text-0 block mb-1.5';

export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 px-4 h-10 rounded-sm bg-accent text-on-accent text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed';

export const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 px-3.5 h-10 rounded-sm bg-bg-1 border border-line text-text-1 text-sm font-medium hover:text-text-0 hover:border-text-2 transition-colors disabled:opacity-50';

/* Navigatsiya bo'limlari — Sidebar va pastki navigatsiya bir xil ro'yxatdan foydalanadi */
export const NAV_ITEMS = [
  { id: 'using', label: 'Using (Statistika)', short: 'Statistika', icon: Activity },
  { id: 'blog', label: 'Bloglar (CRUD)', short: 'Bloglar', icon: BookOpen },
  { id: 'projects', label: 'Loyihalar (CRUD)', short: 'Loyihalar', icon: FolderGit2 },
  { id: 'chats', label: 'Chatlar & Xabarlar', short: 'Chatlar', icon: MessageSquare },
  { id: 'push', label: 'Push Bildirishnoma', short: 'Push', icon: Bell },
] as const;

/* Material-3 uslubidagi almashtirgich */
export const Switch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  label?: string;
}> = ({ checked, onChange, id, label }) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
      checked ? 'bg-accent border-accent' : 'bg-bg-3 border-line'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full transition-transform ${
        checked ? 'translate-x-[22px] bg-on-accent' : 'translate-x-[3px] bg-text-2'
      }`}
    />
  </button>
);

/* Switch qatori: ikonka + matn + almashtirgich */
export const SwitchRow: React.FC<{
  icon: React.ElementType;
  label: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  tone?: 'default' | 'danger';
}> = ({ icon: Icon, label, checked, onChange, id, tone = 'default' }) => (
  <label htmlFor={id} className="flex min-h-[52px] cursor-pointer items-center gap-3 px-4 py-2.5">
    <Icon className={`h-[18px] w-[18px] shrink-0 ${tone === 'danger' ? 'text-danger' : 'text-text-1'}`} />
    <span className="flex-1 text-sm text-text-0">{label}</span>
    <Switch id={id} checked={checked} onChange={onChange} />
  </label>
);

/* Filtr chipi (gorizontal scroll qatorida) */
export const FilterChip: React.FC<{
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
  count?: number;
}> = ({ active, onClick, label, count }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-sm border px-3.5 text-[13px] font-medium transition-colors ${
      active ? 'border-text-0 bg-text-0 text-bg-0' : 'border-line bg-bg-1 text-text-1 hover:text-text-0'
    }`}
  >
    <span>{label}</span>
    {typeof count === 'number' && (
      <span className={`font-mono text-[11px] ${active ? 'text-bg-0/60' : 'text-text-2'}`}>{count}</span>
    )}
  </button>
);

/* Segmentli boshqaruv */
export const Segmented = <T extends string>({
  value,
  onChange,
  options,
  className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon?: React.ElementType }[];
  className?: string;
}) => (
  <div className={`flex items-center gap-1 rounded-sm border border-line bg-bg-1 p-1 ${className}`}>
    {options.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        aria-pressed={value === id}
        className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm px-3 text-xs font-medium transition-colors ${
          value === id ? 'bg-bg-3 text-text-0' : 'text-text-2 hover:text-text-1'
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </button>
    ))}
  </div>
);

/* Mobil: pastki navigatsiya ustida turadigan kengaytirilgan FAB */
export const Fab: React.FC<{ onClick: () => void; icon: React.ElementType; label: string }> = ({
  onClick,
  icon: Icon,
  label,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="lg:hidden fixed right-4 z-30 inline-flex h-14 items-center gap-3 rounded-sm bg-accent px-5 text-[15px] font-semibold text-on-accent shadow-[0_2px_6px_rgba(0,0,0,0.18)] active:scale-[0.97] transition-transform"
    style={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}
  >
    <Icon className="h-5 w-5" />
    {label}
  </button>
);

/* Uch nuqtali menyu */
export const OverflowMenu: React.FC<{
  items: { label: string; icon: React.ElementType; onClick: () => void; danger?: boolean; disabled?: boolean }[];
}> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-11 w-11 place-items-center rounded-sm text-text-1 hover:bg-bg-2 hover:text-text-0 transition-colors"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 min-w-[200px] overflow-hidden rounded-md border border-line bg-bg-1 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        >
          {items.map(({ label, icon: Icon, onClick, danger, disabled }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
                danger ? 'text-danger hover:bg-danger/10' : 'text-text-0 hover:bg-bg-2'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* Bo'lim sarlavhasi (sahifa ichidagi) */
export const SectionHeader: React.FC<{
  title: React.ReactNode;
  desc?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, desc, meta, actions }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {meta && <p className="font-mono text-[11px] text-text-2">{meta}</p>}
      <h2 className="font-display text-lg font-semibold text-text-0 tracking-tight">{title}</h2>
      {desc && <p className="mt-0.5 text-[13px] text-text-1">{desc}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);
