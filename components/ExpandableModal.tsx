'use client';

import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface ExpandableModalProps {
  title: React.ReactNode;
  icon: React.ReactNode;
  /** Sarlavha ostidagi kichik holat qatori (masalan "Qoralama saqlandi") */
  subtitle?: React.ReactNode;
  /** Ilova panelining o'ng tomonidagi amallar (masalan "Chop etish") */
  actions?: React.ReactNode;
  /** Yopish — qoralama saqlanib qoladi, ma'lumot yo'qolmaydi */
  onClose: () => void;
  /** Normal holatdagi kenglik klassi */
  widthClass?: string;
  /** Kattalashtirilgan holat sahifa yangilanganda ham saqlanishi uchun kalit */
  persistKey?: string;
  children: React.ReactNode;
}

/* Tailwind dinamik klasslarni ko'rmaydi — shuning uchun aniq ro'yxat */
const LG_WIDTH: Record<string, string> = {
  'max-w-xl': 'lg:max-w-xl',
  'max-w-2xl': 'lg:max-w-2xl',
  'max-w-3xl': 'lg:max-w-3xl',
  'max-w-4xl': 'lg:max-w-4xl',
};

/*
  Mobil: har doim to'liq ekran. Desktop: markazdagi modal, "kattalashtirish" bosilganda — to'liq ekran.
  Ichki kontent (forma) o'zi scroll bo'ladi.
*/
export const ExpandableModal: React.FC<ExpandableModalProps> = ({
  title,
  icon,
  subtitle,
  actions,
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

  /* Orqa fondagi sahifa scroll bo'lmasin */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
      className={`fixed inset-0 z-50 flex bg-bg-0 lg:bg-black/60 ${
        expanded ? 'lg:p-0' : 'lg:items-center lg:justify-center lg:p-6'
      }`}
    >
      <div
        className={`flex w-full flex-col overflow-hidden bg-bg-0 lg:bg-bg-1 ${
          expanded ? 'h-full' : `h-full lg:h-auto ${LG_WIDTH[widthClass] ?? 'lg:max-w-2xl'} lg:max-h-[92vh] lg:rounded-md lg:border lg:border-line`
        }`}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-bg-0 lg:bg-bg-1 px-2 pt-[max(8px,env(safe-area-inset-top))] pb-2 lg:px-4 lg:py-3">
          <button
            type="button"
            onClick={onClose}
            title="Yopish (qoralama saqlanadi)"
            aria-label="Yopish"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-text-0 hover:bg-bg-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="hidden lg:grid h-8 w-6 shrink-0 place-items-center text-text-2">{icon}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[17px] lg:text-[16px] font-semibold text-text-0">{title}</div>
            {subtitle && <div className="truncate font-mono text-[11px] text-text-2">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={toggleExpanded}
            title={expanded ? 'Kichraytirish' : 'To‘liq ekran'}
            className="hidden lg:grid h-10 w-10 shrink-0 place-items-center rounded-sm text-text-1 hover:text-text-0 hover:bg-bg-2 transition-colors"
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {actions && <div className="flex shrink-0 items-center gap-2 pr-1">{actions}</div>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className={expanded ? 'mx-auto w-full max-w-4xl' : ''}>{children}</div>
        </div>
      </div>
    </div>
  );
};
