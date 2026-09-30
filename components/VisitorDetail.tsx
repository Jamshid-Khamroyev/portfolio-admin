'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock, Globe, Send, Zap, CalendarClock, Layers } from 'lucide-react';
import {
  Visitor,
  ActionBadges,
  SessionRow,
  fetchKnownVisitors,
  fmtDate,
  fmtDuration,
  visitorName,
} from '@/components/VisitorsTable';

const CARD = 'rounded-2xl bg-bg-1 border border-line';

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

  const back = (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm text-text-1 hover:text-accent transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Foydalanuvchilar ro&apos;yxati
    </button>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-bg-2 rounded" />
        <div className="h-32 bg-bg-2 rounded-2xl border border-line" />
        <div className="h-64 bg-bg-2 rounded-2xl border border-line" />
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {back}
        <div className={`${CARD} p-12 text-center text-sm text-text-2`}>Foydalanuvchi topilmadi</div>
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {back}

      <div className={`${CARD} p-6`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent/12 text-accent flex items-center justify-center shrink-0">
            {visitor.source === 'WEB' ? <Globe className="w-6 h-6" /> : <Send className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-text-0 truncate">{visitorName(visitor)}</h2>
            <p className="text-xs text-text-2 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="px-1.5 py-0.5 rounded border border-line bg-bg-2 font-mono text-[10px] text-text-1">
                {visitor.source}
              </span>
              {visitor.username && <span>@{visitor.username}</span>}
              <span className="font-mono">ID: {visitor.id}</span>
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-3.5 rounded-xl bg-bg-2 border border-line">
              <p className="text-[11px] text-text-2 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-accent" />
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-0 tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {actionTotals.length > 0 && (
        <div className={`${CARD} p-6`}>
          <h3 className="text-base font-semibold text-text-0">Barcha harakatlar</h3>
          <p className="text-xs text-text-1 mt-0.5">Barcha sessiyalar bo&apos;yicha jami</p>
          <div className="mt-3">
            <ActionBadges actions={actionTotals} max={actionTotals.length} />
          </div>
        </div>
      )}

      <div className={`${CARD} p-6`}>
        <h3 className="text-base font-semibold text-text-0">
          Sessiyalar <span className="text-text-2 font-normal text-sm">({sessions.length})</span>
        </h3>
        <p className="text-xs text-text-1 mt-0.5 mb-3">Yangilari yuqorida</p>
        {sessions.length === 0 ? (
          <p className="text-sm text-text-2 text-center py-6">Sessiya mavjud emas</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
