'use client';

import React from 'react';
import { ExternalLink, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const titleMap: Record<string, { title: string; desc: string }> = {
  using: {
    title: 'Using & Analytics Statistics',
    desc: 'Foydalanish vaqti, haftalik/oylik kirishlar va ijtimoiy tarmoqlar statistikasi',
  },
  blog: {
    title: 'Blog Management (CRUD)',
    desc: 'Portfoliodagi maqola va qiziqarli texnik kontentlarni boshqarish',
  },
  projects: {
    title: 'Projects Management (CRUD)',
    desc: 'Barcha bajarilgan va jonli loyihalarni qo‘shish, yangilash hamda o‘chirish',
  },
  chats: {
    title: 'Chat Logs & User Messages',
    desc: 'Tashrif buyuruvchilar xabarlari va AI yordamchisining javoblari',
  },
  push: {
    title: 'Push Notifications',
    desc: "Barcha obunachilarga qo'lda bildirishnoma yuborish",
  },
};

/*
  Desktop: sahifa sarlavhasi + tavsif + amallar (yopishqoq emas, kontent bilan birga).
  Mobil: yuqori ilova paneli — kichik mono tavsif, 26px sarlavha va amal ikonkalari.
*/
export const Navbar: React.FC<NavbarProps> = ({ activeTab }) => {
  const { logout } = useAuth();
  const { showToast } = useToast();

  const currentInfo = titleMap[activeTab] || {
    title: 'Admin Dashboard',
    desc: 'Portfolio Boshqaruv Paneli',
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Tizimdan chiqildi', 'info', 'POST /api/auth/logout orqali sessiya yakunlandi');
    } catch (e: any) {
      showToast('Xatolik', 'error', e?.message || 'Tizimdan chiqishda xatolik yuz berdi');
    }
  };

  const mobileIconBtn =
    'grid h-11 w-11 place-items-center rounded-sm border border-line bg-bg-1 text-text-1 hover:text-text-0 transition-colors';

  return (
    <header className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 lg:px-8 lg:pt-8 lg:pb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-text-2 line-clamp-1 lg:hidden">{currentInfo.desc}</p>
          <h1 className="font-display text-2xl lg:text-[26px] font-semibold leading-tight tracking-tight text-text-0 flex items-center gap-2.5">
            <span className="truncate">{currentInfo.title}</span>
            <span className="hidden lg:inline-flex items-center rounded-sm border border-line px-1.5 py-0.5 font-mono text-[11px] font-medium text-text-2">
              Live
            </span>
          </h1>
          <p className="hidden lg:block mt-1 text-sm text-text-1">{currentInfo.desc}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle className="max-lg:h-11 max-lg:w-11" />
          <a
            href={process.env.NEXT_PUBLIC_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Asosiy Saytni Ochish"
            aria-label="Asosiy Saytni Ochish"
            className={`${mobileIconBtn} lg:hidden`}
          >
            <ExternalLink className="h-[18px] w-[18px]" />
          </a>
          <button
            type="button"
            onClick={handleLogout}
            title="Tizimdan chiqish"
            aria-label="Tizimdan chiqish"
            className={`${mobileIconBtn} lg:hidden hover:!text-danger`}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
};
