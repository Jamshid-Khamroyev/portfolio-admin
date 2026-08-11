'use client';

import React from 'react';
import { Search } from 'lucide-react';

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
  };

  const currentInfo = titleMap[activeTab] || {
    title: 'Admin Dashboard',
    desc: 'Portfolio Boshqaruv Paneli',
  };

  return (
    <header className="bg-[#0d1310]/95 border-b border-[#213028] sticky top-0 z-40 backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#eaf2ec] flex items-center gap-2 tracking-tight">
            <span>{currentInfo.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a] font-mono">
              Live
            </span>
          </h1>
          <p className="text-xs text-[#aab8b0] mt-0.5">{currentInfo.desc}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Search */}
          {setSearchQuery && (
            <div className="relative w-64 sm:w-80">
              <Search className="w-4 h-4 text-[#71847a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Qidiruv..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#131b16] border border-[#213028] rounded-lg text-xs text-[#eaf2ec] placeholder-[#71847a] focus:outline-none focus:border-[#49f08a]/60 transition-colors font-mono"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
