'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Globe,
  Send,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Clock,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns';
import { uz } from 'date-fns/locale';
import { reviewApi } from '@/lib/api-client';

/* Faqat ismi yoki username'i ma'lum foydalanuvchilar (anonim sessiyalar emas) */
export const isKnownVisitor = (v: Visitor) => Boolean(v.firstname?.trim() || v.username?.trim());

export const visitorName = (v: Visitor) =>
  v.firstname?.trim() || (v.username ? `@${v.username}` : `#${v.id.slice(0, 8)}`);

let visitorsCache: Visitor[] | null = null;

/* Barcha sahifalarni yig'ib, faqat ma'lum foydalanuvchilarni qaytaradi */
export async function fetchKnownVisitors(force = false): Promise<Visitor[]> {
  if (visitorsCache && !force) return visitorsCache;
  const all: Visitor[] = [];
  const size = 100;
  for (let page = 1; page <= 50; page++) {
    const data = await reviewApi.getVisitors(page, size);
    const batch: Visitor[] = data.visitors ?? [];
    all.push(...batch);
    if (all.length >= (data.total ?? 0) || batch.length < size) break;
  }
  visitorsCache = all.filter(isKnownVisitor);
  return visitorsCache;
}

export interface VisitorSession {
  id: string;
  duration: number;
  lastSeenAt: string | null;
  createdAt: string;
  actions: { type: string; count: number }[];
}

export interface Visitor {
  id: string;
  firstname: string | null;
  username: string | null;
  source: 'WEB' | 'TELEGRAM';
  visitCount: number;
  totalTime: number;
  createdAt: string;
  updatedAt: string;
  sessions: VisitorSession[];
}

export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}s ${m % 60}m`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* Nisbiy vaqt (masalan "5 daqiqa") — mavjud sanadan hisoblanadi */
export function fmtAgo(iso: string): string {
  try {
    return formatDistanceToNowStrict(new Date(iso), { locale: uz });
  } catch {
    return fmtDate(iso);
  }
}

export function ActionBadges({ actions, max = 5 }: { actions: { type: string; count: number }[]; max?: number }) {
  if (!actions.length) return <span className="text-text-2 text-[10px]">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {actions.slice(0, max).map((a) => (
        <span key={a.type} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-bg-3 font-mono text-[10px] text-text-1">
          {a.type.replace(/_/g, ' ')}
          <span className="text-text-2">×{a.count}</span>
        </span>
      ))}
      {actions.length > max && (
        <span className="font-mono text-[10px] text-text-2">+{actions.length - max}</span>
      )}
    </div>
  );
}

export function SessionRow({ session }: { session: VisitorSession }) {
  const enterTime = session.createdAt;
  const exitTime = session.lastSeenAt
    ? session.lastSeenAt
    : session.duration > 0
      ? new Date(new Date(session.createdAt).getTime() + session.duration * 1000).toISOString()
      : null;

  return (
    <div className="p-3.5 rounded-md bg-bg-1 border border-line shadow-[var(--shadow-card)] grid grid-cols-3 gap-3 text-[11px]">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="flex items-center gap-1 text-text-2 font-mono">
          <LogIn className="w-3 h-3" />
          Kirish
        </span>
        <span className="text-text-0 truncate">{fmtDate(enterTime)}</span>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="flex items-center gap-1 text-text-2 font-mono">
          <LogOut className="w-3 h-3" />
          Chiqish
        </span>
        <span className="text-text-0 truncate">
          {exitTime ? fmtDate(exitTime) : <span className="text-text-2">—</span>}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="flex items-center gap-1 text-text-2 font-mono">
          <Clock className="w-3 h-3" />
          Davomiylik
        </span>
        <span className="text-text-0 font-mono font-semibold">{fmtDuration(session.duration)}</span>
      </div>
      {session.actions.length > 0 && (
        <div className="col-span-3">
          <ActionBadges actions={session.actions} />
        </div>
      )}
    </div>
  );
}

/* Manba belgisi (mamlakat kodi API'da yo'q — manba ikonkasi ko'rsatiladi) */
export function SourceTile({ source, size = 'md' }: { source: Visitor['source']; size?: 'md' | 'lg' }) {
  const Icon = source === 'WEB' ? Globe : Send;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-md border border-line bg-bg-2 text-text-2 ${
        size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
      }`}
    >
      <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
    </span>
  );
}

/* Mobil ro'yxat qatori */
function VisitorRow({ visitor, onOpen }: { visitor: Visitor; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full min-h-[64px] px-4 py-3 flex items-center gap-3 hover:bg-bg-2 transition-colors text-left"
    >
      <SourceTile source={visitor.source} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-text-0 truncate">{visitorName(visitor)}</div>
        <div className="font-mono text-[11px] text-text-2 truncate">
          {visitor.source} · {visitor.sessions.length || visitor.visitCount} sessiya
          {visitor.username && visitor.firstname ? ` · @${visitor.username}` : ''}
        </div>
      </div>
      <div className="shrink-0 text-right" title={fmtDate(visitor.updatedAt)}>
        <div className="font-mono text-[11px] text-text-2">{fmtAgo(visitor.updatedAt)}</div>
        <div className="font-mono text-[11px] text-text-1">{fmtDuration(visitor.totalTime)}</div>
      </div>
    </button>
  );
}

export const VisitorsTable: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async (force = false) => {
    setLoading(true);
    try {
      setVisitors(await fetchKnownVisitors(force));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const total = visitors.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageItems = visitors.slice((page - 1) * limit, page * limit);

  const openVisitor = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'using');
    params.set('visitor', id);
    router.push(`?${params.toString()}`);
    window.scrollTo({ top: 0 });
  };

  const th = 'px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-text-2';

  return (
    <div>
      {/* Sarlavha */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 lg:px-5 lg:pt-5">
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-semibold text-text-0 flex items-center gap-2">
            Foydalanuvchilar Tarixi
            <span className="font-mono text-[12px] font-normal text-text-2">{total} ta</span>
          </h2>
          <p className="text-xs text-text-2 mt-0.5">Ismi ma&apos;lum foydalanuvchilar — batafsil ma&apos;lumot uchun bosing</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          aria-label="Yangilash"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-line text-text-2 hover:text-text-0 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 px-4 pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-sm bg-bg-2 animate-pulse" />
          ))}
        </div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-12 text-text-2 text-sm">Foydalanuvchilar topilmadi</div>
      ) : (
        <>
          {/* Desktop jadval */}
          <table className="hidden md:table w-full border-t border-line">
            <thead className="bg-bg-2">
              <tr>
                <th className={th}>Foydalanuvchi</th>
                <th className={th}>sessiya</th>
                <th className={th}>jami vaqt</th>
                <th className={th}>oxirgi faollik</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => openVisitor(v.id)}
                  className="cursor-pointer hover:bg-bg-2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 rounded-sm bg-bg-3 px-1.5 py-0.5 font-mono text-[10px] text-text-1">
                        {v.source}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-text-0">{visitorName(v)}</div>
                        {v.username && v.firstname && (
                          <div className="truncate text-[11px] text-text-2">@{v.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-text-0">{v.sessions.length || v.visitCount}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-text-0">{fmtDuration(v.totalTime)}</td>
                  <td className="px-4 py-3 text-[13px] text-text-1" title={fmtDate(v.updatedAt)}>{fmtAgo(v.updatedAt)}</td>
                  <td className="pr-3">
                    <ChevronRight className="w-4 h-4 text-text-2" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobil ro'yxat */}
          <div className="md:hidden divide-y divide-line border-t border-line">
            {pageItems.map((v) => (
              <VisitorRow key={v.id} visitor={v} onOpen={() => openVisitor(v.id)} />
            ))}
          </div>
        </>
      )}

      {/* Sahifalash */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-line py-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            aria-label="Oldingi"
            className="grid h-10 w-10 place-items-center rounded-sm border border-line text-text-2 hover:text-text-0 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-text-1">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            aria-label="Keyingi"
            className="grid h-10 w-10 place-items-center rounded-sm border border-line text-text-2 hover:text-text-0 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
