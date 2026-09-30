'use client';

import React, { useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface ExpandableModalProps {
  title: React.ReactNode;
  icon: React.ReactNode;
  /** Yopish — qoralama saqlanib qoladi, ma'lumot yo'qolmaydi */
  onClose: () => void;
  /** Normal holatdagi kenglik klassi */
  widthClass?: string;
  /** Kattalashtirilgan holat sahifa yangilanganda ham saqlanishi uchun kalit */
  persistKey?: string;
  children: React.ReactNode;
}

/*
  Oddiy holatda markazdagi modal, "kattalashtirish" bosilganda — to'liq ekran.
  Ichki kontent (forma) o'zi scroll bo'ladi.
*/
export const ExpandableModal: React.FC<ExpandableModalProps> = ({
  title,
  icon,
  onClose,
  widthClass = 'max-w-2xl',
  persistKey,
  children,
}) => {
  const storageKey = persistKey ? `admin-modal-expanded:${persistKey}` : null;
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (!storageKey) return false;
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, next ? '1' : '0');
        } catch {}
      }
      return next;
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex ${
        expanded ? 'p-0' : 'items-center justify-center p-4'
      }`}
    >
      <div
        className={`bg-bg-1 border border-line flex flex-col overflow-hidden shadow-xl ${
          expanded
            ? 'w-full h-full rounded-none border-0'
            : `w-full ${widthClass} max-h-[92vh] rounded-2xl`
        }`}
      >
        <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-bg-0 shrink-0">
          <div className="flex items-center gap-2 text-accent font-mono text-sm font-bold">
            {icon}
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleExpanded}
              title={expanded ? 'Kichraytirish' : 'To‘liq ekran'}
              className="p-1.5 rounded-lg text-text-1 hover:text-accent hover:bg-bg-3 transition-colors"
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Yopish (qoralama saqlanadi)"
              className="p-1.5 rounded-lg text-text-1 hover:text-text-0 hover:bg-bg-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className={expanded ? 'max-w-4xl mx-auto w-full' : ''}>{children}</div>
        </div>
      </div>
    </div>
  );
};
