'use client';

import React, { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getTheme = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'dark' as Theme);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('admin-theme', next);
    } catch {}
    listeners.forEach((cb) => cb());
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Kun rejimiga o‘tish' : 'Tun rejimiga o‘tish'}
      title={theme === 'dark' ? 'Kun rejimi' : 'Tun rejimi'}
      className={`grid h-9 w-9 place-items-center rounded-lg border border-line bg-bg-2 text-text-1 hover:text-accent hover:border-accent-dim/50 transition-colors ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
