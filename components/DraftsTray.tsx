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
    <div className="rounded-2xl bg-bg-1 border border-line p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileEdit className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-text-0">Saqlangan qoralamalar</h3>
        <span className="text-xs text-text-2">({drafts.length})</span>
      </div>
      <ul className="space-y-2">
        {drafts.map((d) => (
          <li key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-2 border border-line">
            <button
              type="button"
              onClick={() => onResume(d)}
              className="flex-1 min-w-0 text-left group"
              title="Davom ettirish"
            >
              <p className="text-sm font-medium text-text-0 truncate group-hover:text-accent transition-colors">
                {d.title || 'Nomsiz qoralama'}
              </p>
              <p className="text-[11px] text-text-2">Oxirgi o&apos;zgarish: {fmt(d.updatedAt)} · davom ettirish uchun bosing</p>
            </button>
            <button
              type="button"
              onClick={() => onDelete(d)}
              title="Qoralamani o'chirish"
              className="p-2 rounded-lg text-text-2 hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
