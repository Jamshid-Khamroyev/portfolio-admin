'use client';

import React, { useEffect, useRef } from 'react';
import { LogOut, ExternalLink, Search } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import { useBlogStore } from '@/hooks/useBlogStore';
import { NAV_ITEMS } from './ui';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

/* Faqat desktop (≥1024px) — mobil qurilmada pastki navigatsiya ishlatiladi */
export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, searchQuery, setSearchQuery }) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const blogStore = useBlogStore();
  const searchRef = useRef<HTMLInputElement>(null);

  /* Ctrl/⌘ + K — qidiruv maydoniga o'tish */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Tizimdan chiqildi', 'info', 'POST /api/auth/logout orqali sessiya yakunlandi');
    } catch (e: any) {
      showToast('Xatolik', 'error', e?.message || 'Tizimdan chiqishda xatolik yuz berdi');
    }
  };

  /* Faqat allaqachon yuklangan ma'lumotdan olinadigan sonlar */
  const counts: Record<string, number | undefined> = {
    blog: blogStore.loaded ? blogStore.blogs.length : undefined,
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-[260px] bg-bg-1 border-r border-line flex-col justify-between h-screen overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Logo */}
        <div className="flex items-center gap-3 px-1 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Jamshid Xamroyev" width={40} height={40} className="h-9 w-9 rounded-md" />
          <span className="font-mono text-[12px] text-text-1">admin console</span>
        </div>

        {/* Qidiruv */}
        {setSearchQuery && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-2" />
            <input
              ref={searchRef}
              type="text"
              inputMode={activeTab === 'blog' ? 'numeric' : 'text'}
              maxLength={activeTab === 'blog' ? 4 : undefined}
              placeholder={activeTab === 'blog' ? 'Blog ID (masalan 1047)...' : 'Qidiruv...'}
              value={searchQuery || ''}
              onChange={(e) =>
                setSearchQuery(activeTab === 'blog' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value)
              }
              className="h-10 w-full rounded-sm border border-line bg-bg-0 pl-9 pr-16 text-[13px] text-text-0 placeholder:text-text-2 focus:border-accent focus:outline-none transition-colors"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm border border-line px-1.5 py-0.5 font-mono text-[10px] text-text-2">
              Ctrl K
            </kbd>
          </div>
        )}

        {/* Navigatsiya */}
        <nav className="space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-2">Boshqaruv Bo&apos;limlari</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count = counts[item.id];
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 h-10 px-3 rounded-sm text-sm transition-colors ${
                  isActive ? 'bg-bg-3 text-text-0 font-medium' : 'text-text-1 hover:text-text-0 hover:bg-bg-2'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-text-0' : 'text-text-2'}`} />
                <span className="flex-1 truncate text-left">{item.label}</span>
                {typeof count === 'number' && (
                  <span className="font-mono text-[11px] text-text-2">{count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pastki qism */}
      <div className="p-4 space-y-3">
        <a
          href={process.env.NEXT_PUBLIC_SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center gap-2.5 rounded-sm border border-line px-3 text-[13px] text-text-1 hover:text-text-0 hover:border-text-2 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Asosiy Saytni Ochish</span>
        </a>

        <div className="flex items-center gap-3 px-1">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bg-3 font-display text-sm font-semibold text-text-1">
            JX
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-text-0">{'Jamshid Xamroyev'}</p>
            <p className="truncate font-mono text-[11px] text-text-2">{'admin@portfolio.uz'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Tizimdan chiqish"
            aria-label="Tizimdan chiqish"
            className="grid h-10 w-10 place-items-center rounded-sm text-text-2 hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
};
