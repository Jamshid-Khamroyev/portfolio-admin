'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Zap,
  CalendarClock,
  Layers,
  BookOpen,
  Bot,
  Download,
  FolderGit2,
  Home,
  MousePointerClick,
} from 'lucide-react';
import {
  Visitor,
  SessionRow,
  SourceTile,
  fetchKnownVisitors,
  fmtDate,
  fmtDuration,
  visitorName,
} from '@/components/VisitorsTable';
import { CARD } from '@/components/ui';

/* Harakat turiga mos ikonka (faqat ko'rinish uchun — nomlar API'dan keladi) */
function actionVisual(type: string): { icon: React.ElementType } {
  const t = type.toLowerCase();
  if (t.includes('blog') || t.includes('read')) return { icon: BookOpen };
  if (t.includes('chat') || t.includes('ai')) return { icon: Bot };
  if (t.includes('cv') || t.includes('download') || t.includes('resume')) return { icon: Download };
  if (t.includes('project')) return { icon: FolderGit2 };
  if (t.includes('home') || t.includes('visit') || t.includes('page')) return { icon: Home };
  return { icon: MousePointerClick };
}

export const VisitorDetail: React.FC<{ visitorId: string; onBack: () => void }> = ({ visitorId, onBack }) => {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetchKnownVisitors()
      .then((list) => {
        if (!ignore) setVisitor(list.find((v) => v.id === visitorId) ?? null);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [visitorId]);

  const sessions = useMemo(
    () => [...(visitor?.sessions ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [visitor]
  );

  const actionTotals = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => s.actions.forEach((a) => map.set(a.type, (map.get(a.type) ?? 0) + a.count)));
    return [...map.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }, [sessions]);

  /* Orqaga qaytish ilova paneli */
  const appBar = (title: React.ReactNode, sub?: React.ReactNode, leading?: React.ReactNode) => (
    <div className="flex items-center gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-4 lg:px-8 lg:pt-8">
      <button
        onClick={onBack}
        aria-label="Foydalanuvchilar ro'yxati"
        title="Foydalanuvchilar ro'yxati"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-text-0 hover:bg-bg-2 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      {leading}
      <div className="min-w-0">
        <h1 className="font-display text-[22px] lg:text-[26px] font-semibold leading-tight text-text-0 truncate">{title}</h1>
        {sub && <div className="font-mono text-[11px] text-text-2 truncate">{sub}</div>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        {appBar(<span className="inline-block h-6 w-40 rounded bg-bg-2 animate-pulse" />)}
        <div className="px-4 lg:px-8 max-w-5xl space-y-3 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-bg-1 rounded-md border border-line" />)}
          </div>
          <div className="h-64 bg-bg-1 rounded-md border border-line" />
        </div>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div>
        {appBar("Foydalanuvchilar ro'yxati")}
        <div className="px-4 lg:px-8 max-w-5xl">
          <div className={`${CARD} p-12 text-center text-sm text-text-2`}>Foydalanuvchi topilmadi</div>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Layers, label: 'Sessiyalar', value: String(sessions.length || visitor.visitCount) },
    { icon: Clock, label: 'Jami vaqt', value: fmtDuration(visitor.totalTime) },
    { icon: CalendarClock, label: 'Birinchi kirish', value: fmtDate(visitor.createdAt) },
    { icon: Zap, label: 'Oxirgi faollik', value: fmtDate(visitor.updatedAt) },
  ];

  return (
    <div>
      {appBar(
        visitorName(visitor),
        <>
          {visitor.source}
          {visitor.username ? ` · @${visitor.username}` : ''} · ID: {visitor.id}
        </>,
        <SourceTile source={visitor.source} />
      )}

      <div className="px-4 lg:px-8 max-w-5xl space-y-4 lg:space-y-6">
        {/* 2×2 statistika */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className={`${CARD} p-4 flex flex-col gap-3`}>
              <Icon className="h-4 w-4 text-text-2" />
              <div className="min-w-0">
                <p className="font-display text-[17px] lg:text-[19px] font-semibold text-text-0 tabular-nums leading-tight break-words">
                  {value}
                </p>
                <p className="text-[12px] text-text-2 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Barcha harakatlar — vaqt chizig'i ro'yxati */}
        {actionTotals.length > 0 && (
          <section>
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <h3 className="font-display text-[17px] font-semibold text-text-0">Barcha harakatlar</h3>
              <p className="font-mono text-[11px] text-text-2">Barcha sessiyalar bo&apos;yicha jami</p>
            </div>
            <div className={`${CARD} divide-y divide-line overflow-hidden`}>
              {actionTotals.map((a) => {
                const { icon: Icon } = actionVisual(a.type);
                return (
                  <div key={a.type} className="flex min-h-[52px] items-center gap-3 px-4 py-3">
                    <Icon className="h-4 w-4 shrink-0 text-text-2" />
                    <span className="flex-1 min-w-0 truncate text-[14px] font-medium text-text-0">
                      {a.type.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[12px] text-text-1">×{a.count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Sessiyalar */}
        <section>
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <h3 className="font-display text-[17px] font-semibold text-text-0">
              Sessiyalar <span className="font-mono text-[13px] font-normal text-text-2">({sessions.length})</span>
            </h3>
            <p className="font-mono text-[11px] text-text-2">Yangilari yuqorida</p>
          </div>
          {sessions.length === 0 ? (
            <div className={`${CARD} p-8 text-center text-sm text-text-2`}>Sessiya mavjud emas</div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
