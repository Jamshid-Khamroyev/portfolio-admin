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
import { reviewApi } from '@/lib/api-client';

interface VisitorSession {
  id: string;
  duration: number;
  lastSeenAt: string | null;
  createdAt: string;
  actions: { type: string; count: number }[];
}

interface Visitor {
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

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}s ${m % 60}m`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ActionBadges({ actions }: { actions: { type: string; count: number }[] }) {
  if (!actions.length) return <span className="text-[#374740] text-[10px]">—</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {actions.slice(0, 5).map((a) => (
        <span key={a.type} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0d1a12] border border-[#213028] text-[9px] font-mono text-[#49f08a]">
          {a.type.replace(/_/g, ' ')}
          <span className="text-[#1f8a52]">×{a.count}</span>
        </span>
      ))}
      {actions.length > 5 && (
        <span className="text-[10px] text-[#71847a]">+{actions.length - 5}</span>
      )}
    </div>
  );
}

function SessionRow({ session }: { session: VisitorSession }) {
  const enterTime = session.createdAt;
  const exitTime = session.lastSeenAt
    ? session.lastSeenAt
    : session.duration > 0
      ? new Date(new Date(session.createdAt).getTime() + session.duration * 1000).toISOString()
      : null;

  return (
    <div className="ml-8 my-1 p-3 rounded-xl bg-[#080b09] border border-[#1a2620] grid grid-cols-3 gap-3 text-[11px]">
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1 text-[#49f08a] font-mono">
          <LogIn className="w-3 h-3" />
          Kirish
        </span>
        <span className="text-[#aab8b0]">{fmtDate(enterTime)}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1 text-[#f08a49] font-mono">
          <LogOut className="w-3 h-3" />
          Chiqish
        </span>
        <span className="text-[#aab8b0]">
          {exitTime ? fmtDate(exitTime) : <span className="text-[#374740]">—</span>}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1 text-[#49f08a] font-mono">
          <Clock className="w-3 h-3" />
          Davomiylik
        </span>
        <span className="text-[#eaf2ec] font-mono font-semibold">{fmtDuration(session.duration)}</span>
      </div>
      {session.actions.length > 0 && (
        <div className="col-span-3">
          <ActionBadges actions={session.actions} />
        </div>
      )}
    </div>
  );
}

function VisitorRow({ visitor }: { visitor: Visitor }) {
  const [expanded, setExpanded] = useState(false);

  const displayName = visitor.firstname
    ? visitor.firstname
    : visitor.username
      ? `@${visitor.username}`
      : visitor.source === 'WEB'
        ? `Web #${visitor.id.slice(0, 8)}`
        : `TG #${visitor.id}`;

  return (
    <div className="rounded-2xl border border-[#213028] overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 flex items-center gap-3 bg-[#0d1310] hover:bg-[#111a15] transition-colors text-left"
      >
        <span className="text-[#213028]">
          {expanded ? <ChevronDown className="w-4 h-4 text-[#49f08a]" /> : <ChevronRight className="w-4 h-4" />}
        </span>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#182119] border border-[#213028] flex items-center justify-center shrink-0">
          {visitor.source === 'WEB' ? (
            <Globe className="w-4 h-4 text-[#49f08a]" />
          ) : (
            <Send className="w-4 h-4 text-[#49f08a]" />
          )}
        </div>

        {/* Name & source */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#eaf2ec] truncate">{displayName}</span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
              visitor.source === 'WEB'
                ? 'text-[#49f08a] border-[#1f8a52]/40 bg-[#0d1a12]'
                : 'text-[#49a0f0] border-[#1f528a]/40 bg-[#0d1220]'
            }`}>
              {visitor.source}
            </span>
          </div>
          <div className="text-[10px] text-[#71847a] font-mono truncate">
            ID: {visitor.id.slice(0, 20)}{visitor.id.length > 20 ? '…' : ''}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center hidden sm:block">
            <div className="text-xs font-mono font-bold text-[#eaf2ec]">{visitor.visitCount}</div>
            <div className="text-[9px] text-[#71847a]">tashrif</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-xs font-mono font-bold text-[#49f08a]">{fmtDuration(visitor.totalTime)}</div>
            <div className="text-[9px] text-[#71847a]">jami vaqt</div>
          </div>
          <div className="text-center hidden lg:block">
            <div className="text-[10px] text-[#aab8b0] font-mono">{fmtDate(visitor.updatedAt)}</div>
            <div className="text-[9px] text-[#71847a]">oxirgi faollik</div>
          </div>
        </div>
      </button>

      {/* Expanded sessions */}
      {expanded && (
        <div className="border-t border-[#213028] bg-[#090e0b] p-3 space-y-1">
          {visitor.sessions.length === 0 ? (
            <p className="text-xs text-[#71847a] text-center py-2">Sessiya mavjud emas</p>
          ) : (
            visitor.sessions.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </div>
      )}
    </div>
  );
}

export const VisitorsTable: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await reviewApi.getVisitors(p, limit);
      setVisitors(data.visitors ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#eaf2ec] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#49f08a]" />
            Foydalanuvchilar Tarixi
            <span className="text-[#49f08a] font-mono text-xs">{`{${total} ta}`}</span>
          </h2>
          <p className="text-xs text-[#71847a] mt-0.5">Har bir foydalanuvchi kirish, chiqish va faollik tarixi</p>
        </div>
        <button
          onClick={() => load(page)}
          disabled={loading}
          className="p-2 rounded-lg bg-[#0d1310] border border-[#213028] text-[#71847a] hover:text-[#49f08a] hover:border-[#1f8a52]/60 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#0d1310] border border-[#213028] animate-pulse" />
          ))}
        </div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-12 text-[#71847a] text-sm">Foydalanuvchilar topilmadi</div>
      ) : (
        <div className="space-y-2">
          {visitors.map((v) => <VisitorRow key={v.id} visitor={v} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2 rounded-lg bg-[#0d1310] border border-[#213028] text-[#71847a] hover:text-[#49f08a] disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-[#aab8b0]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="p-2 rounded-lg bg-[#0d1310] border border-[#213028] text-[#71847a] hover:text-[#49f08a] disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
