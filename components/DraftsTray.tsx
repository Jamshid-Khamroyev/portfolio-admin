'use client';

import React from 'react';
import { FileEdit, Trash2 } from 'lucide-react';
import type { Draft } from '@/lib/drafts';

interface DraftsTrayProps {
  drafts: Draft<any>[];
  onResume: (draft: Draft<any>) => void;
  onDelete: (draft: Draft<any>) => void;
}

const fmt = (ts: number) =>
  new Date(ts).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/* Yopib qo'yilgan qoralamalar — foydalanuvchi o'zi o'chirmaguncha saqlanadi */
export const DraftsTray: React.FC<DraftsTrayProps> = ({ drafts, onResume, onDelete }) => {
  if (!drafts.length) return null;

  return (
    <div className="rounded-md border border-line bg-bg-1 p-1.5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
        <FileEdit className="w-4 h-4 text-warn" />
        <h3 className="text-[13px] font-semibold text-text-0">Saqlangan qoralamalar</h3>
        <span className="font-mono text-[11px] text-text-2">({drafts.length})</span>
      </div>
      <ul className="space-y-1">
        {drafts.map((d) => (
          <li key={d.id} className="flex items-center gap-2 rounded-sm bg-bg-2 pl-3">
            <button
              type="button"
              onClick={() => onResume(d)}
              className="flex-1 min-w-0 py-2.5 text-left group"
              title="Davom ettirish"
            >
              <p className="text-sm font-medium text-text-0 truncate group-hover:text-text-1 transition-colors">
                {d.title || 'Nomsiz qoralama'}
              </p>
              <p className="font-mono text-[11px] text-text-2 truncate">
                Oxirgi o&apos;zgarish: {fmt(d.updatedAt)} · davom ettirish uchun bosing
              </p>
            </button>
            <button
              type="button"
              onClick={() => onDelete(d)}
              title="Qoralamani o'chirish"
              aria-label="Qoralamani o'chirish"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-text-2 hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
