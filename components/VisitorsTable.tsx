'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Globe,
  Send,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Clock,
  LogIn,
  LogOut,
  Zap,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export function ActionBadges({ actions, max = 5 }: { actions: { type: string; count: number }[]; max?: number }) {
  if (!actions.length) return <span className="text-text-2 text-[10px]">—</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {actions.slice(0, max).map((a) => (
        <span key={a.type} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-bg-2 border border-line text-[9px] font-mono text-accent">
          {a.type.replace(/_/g, ' ')}
          <span className="text-accent-dim">×{a.count}</span>
        </span>
      ))}
      {actions.length > max && (
        <span className="text-[10px] text-text-2">+{actions.length - max}</span>
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
    <div className="my-1 p-3 rounded-xl bg-bg-0 border border-line grid grid-cols-3 gap-3 text-[11px]">
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1 text-accent font-mono">
          <LogIn className="w-3 h-3" />
          Kirish
        </span>
        <span className="text-text-1">{fmtDate(enterTime)}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1 text-danger font-mono">
          <LogOut className="w-3 h-3" />
          Chiqish
        </span>
        <span className="text-text-1">
          {exitTime ? fmtDate(exitTime) : <span className="text-text-2">—</span>}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1 text-accent font-mono">
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

function VisitorRow({ visitor, onOpen }: { visitor: Visitor; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl border border-line p-4 flex items-center gap-3 bg-bg-1 hover:bg-bg-2 hover:border-accent-dim/50 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-full bg-bg-3 border border-line flex items-center justify-center shrink-0">
        {visitor.source === 'WEB' ? (
          <Globe className="w-4 h-4 text-accent" />
        ) : (
          <Send className="w-4 h-4 text-accent" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-0 truncate">{visitorName(visitor)}</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-text-1 border-line bg-bg-2">
            {visitor.source}
          </span>
        </div>
        {visitor.username && visitor.firstname && (
          <div className="text-[11px] text-text-2 truncate">@{visitor.username}</div>
        )}
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <div className="text-center hidden sm:block">
          <div className="text-xs font-mono font-bold text-text-0">{visitor.sessions.length || visitor.visitCount}</div>
          <div className="text-[9px] text-text-2">sessiya</div>
        </div>
        <div className="text-center hidden md:block">
          <div className="text-xs font-mono font-bold text-accent">{fmtDuration(visitor.totalTime)}</div>
          <div className="text-[9px] text-text-2">jami vaqt</div>
        </div>
        <div className="text-center hidden lg:block">
          <div className="text-[10px] text-text-1 font-mono">{fmtDate(visitor.updatedAt)}</div>
          <div className="text-[9px] text-text-2">oxirgi faollik</div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-2" />
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

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-0 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Foydalanuvchilar Tarixi
            <span className="text-accent font-mono text-xs">{`{${total} ta}`}</span>
          </h2>
          <p className="text-xs text-text-2 mt-0.5">Ismi ma'lum foydalanuvchilar — batafsil ma'lumot uchun bosing</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="p-2 rounded-lg bg-bg-1 border border-line text-text-2 hover:text-accent hover:border-accent-dim/60 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-bg-1 border border-line animate-pulse" />
          ))}
        </div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-12 text-text-2 text-sm">Foydalanuvchilar topilmadi</div>
      ) : (
        <div className="space-y-2">
          {pageItems.map((v) => <VisitorRow key={v.id} visitor={v} onOpen={() => openVisitor(v.id)} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2 rounded-lg bg-bg-1 border border-line text-text-2 hover:text-accent disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-text-1">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="p-2 rounded-lg bg-bg-1 border border-line text-text-2 hover:text-accent disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
