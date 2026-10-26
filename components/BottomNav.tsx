'use client';

import React from 'react';
import { NAV_ITEMS } from './ui';

/* Mobil (<1024px): Material-3 uslubidagi pastki navigatsiya */
export const BottomNav: React.FC<{ activeTab: string; setActiveTab: (tab: string) => void }> = ({
  activeTab,
  setActiveTab,
}) => (
  <nav
    className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-1 pb-safe"
    aria-label="Asosiy navigatsiya"
  >
    <div className="grid h-[72px] grid-cols-5">
      {NAV_ITEMS.map(({ id, short, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            aria-current={active ? 'page' : undefined}
            className="flex flex-col items-center justify-center gap-1"
          >
            <span
              className={`grid h-8 w-[60px] place-items-center rounded-full transition-colors ${
                active ? 'bg-bg-3 text-text-0' : 'text-text-2'
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className={`text-[12px] leading-none ${active ? 'font-semibold text-text-0' : 'text-text-2'}`}>
              {short}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);
