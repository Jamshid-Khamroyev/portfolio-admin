'use client';

import React from 'react';
import { Activity, BookOpen, FolderGit2, MessageSquare, LogOut, Terminal, ExternalLink } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Tizimdan chiqildi', 'info', 'POST /api/auth/logout orqali sessiya yakunlandi');
    } catch (e: any) {
      showToast('Xatolik', 'error', e?.message || 'Tizimdan chiqishda xatolik yuz berdi');
    }
  };

  const navItems = [
    { id: 'using', label: 'Using (Statistika)', icon: Activity },
    { id: 'blog', label: 'Bloglar (CRUD)', icon: BookOpen },
    { id: 'projects', label: 'Loyihalar (CRUD)', icon: FolderGit2 },
    { id: 'chats', label: 'Chatlar & Xabarlar', icon: MessageSquare },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-64 bg-[#0d1310] border-r border-[#213028] flex flex-col justify-between shrink-0 h-screen overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#213028] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#182119] border border-[#1f8a52]/40 flex items-center justify-center text-[#49f08a] glow-emerald-sm">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-[#eaf2ec] flex items-center gap-1 tracking-tight">
              <span>Jamshid</span>
              <span className="text-[#49f08a] font-mono">{`{Dev}`}</span>
            </div>
            <p className="text-[11px] text-[#aab8b0] font-mono uppercase tracking-wider">Admin Control</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          <div className="px-3 py-2 text-[10px] font-mono text-[#71847a] uppercase tracking-widest">
            Boshqaruv Bo&apos;limlari
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#182119] border border-[#1f8a52]/50 text-[#49f08a] shadow-sm'
                    : 'text-[#aab8b0] hover:text-[#eaf2ec] hover:bg-[#131b16] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#49f08a]' : 'text-[#71847a] group-hover:text-[#aab8b0]'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#49f08a] glow-emerald-sm"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Footer Actions */}
      <div className="p-4 border-t border-[#213028] bg-[#080b09]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={'https://unsplash.com/photos/black-and-silver-laptop-computer-FJ5e_2f96h4'}
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-[#1f8a52]/50 object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#eaf2ec] truncate">{'Jamshid Xamroyev'}</p>
              <p className="text-[10px] text-[#49f08a]/90 font-mono truncate">{'admin@portfolio.uz'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Tizimdan chiqish"
            className="p-1.5 rounded-md text-[#aab8b0] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 border border-transparent hover:border-[#ff6b6b]/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <a
          href={process.env.NEXT_PUBLIC_SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-lg bg-[#131b16] border border-[#213028] text-[#aab8b0] hover:text-[#49f08a] hover:border-[#1f8a52]/50 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
        >
          <span>Asosiy Saytni Ochish</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
};
