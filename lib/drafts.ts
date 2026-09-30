'use client';

import { useCallback, useEffect, useState } from 'react';

/*
  Yopib qo'yilgan (yoki tugallanmagan) formalar localStorage'da qoralama sifatida
  saqlanadi va foydalanuvchi o'zi o'chirmaguncha turadi.
*/

export interface Draft<T = unknown> {
  id: string;
  title: string;
  updatedAt: number;
  data: T;
}

const storageKey = (kind: string) => `admin-drafts:${kind}`;
const EVENT = 'admin-drafts-changed';

function read<T>(kind: string): Draft<T>[] {
  try {
    const raw = localStorage.getItem(storageKey(kind));
    const list = raw ? (JSON.parse(raw) as Draft<T>[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write<T>(kind: string, list: Draft<T>[]) {
  try {
    localStorage.setItem(storageKey(kind), JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: kind }));
  } catch (e) {
    console.error('Qoralamani saqlab bo‘lmadi:', e);
  }
}

export const readDrafts = <T = unknown>(kind: string): Draft<T>[] => read<T>(kind);

export const newDraftId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function useDrafts<T>(kind: string) {
  const [drafts, setDrafts] = useState<Draft<T>[]>([]);

  useEffect(() => {
    const sync = () => setDrafts(read<T>(kind).sort((a, b) => b.updatedAt - a.updatedAt));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [kind]);

  const save = useCallback(
    (id: string, title: string, data: T) => {
      const list = read<T>(kind).filter((d) => d.id !== id);
      list.push({ id, title, updatedAt: Date.now(), data });
      write(kind, list);
    },
    [kind]
  );

  const remove = useCallback(
    (id: string) => {
      write(
        kind,
        read<T>(kind).filter((d) => d.id !== id)
      );
    },
    [kind]
  );

  return { drafts, save, remove };
}
