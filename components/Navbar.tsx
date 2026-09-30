'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
}) => {
  const titleMap: Record<string, { title: string; desc: string }> = {
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

  const currentInfo = titleMap[activeTab] || {
    title: 'Admin Dashboard',
    desc: 'Portfolio Boshqaruv Paneli',
  };

  return (
    <header className="bg-bg-1/95 border-b border-line sticky top-0 z-40 backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-0 flex items-center gap-2 tracking-tight">
            <span>{currentInfo.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-bg-3 border border-accent-dim/40 text-accent font-mono">
              Live
            </span>
          </h1>
          <p className="text-xs text-text-1 mt-0.5">{currentInfo.desc}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Search */}
          {setSearchQuery && (
            <div className="relative w-64 sm:w-80">
              <Search className="w-4 h-4 text-text-2 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode={activeTab === 'blog' ? 'numeric' : 'text'}
                maxLength={activeTab === 'blog' ? 4 : undefined}
                placeholder={activeTab === 'blog' ? 'Blog ID (masalan 1047)...' : 'Qidiruv...'}
                value={searchQuery || ''}
                onChange={(e) =>
                  setSearchQuery(
                    activeTab === 'blog' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value
                  )
                }
                className="w-full pl-9 pr-3 py-1.5 bg-bg-2 border border-line rounded-lg text-xs text-text-0 placeholder-text-2 focus:outline-none focus:border-accent/60 transition-colors font-mono"
              />
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
