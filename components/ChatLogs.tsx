import React, { useCallback, useEffect, useState } from 'react';
import {
  MessageSquare,
  RefreshCw,
  Bot,
  User,
  Trash2,
  Info,
  X,
  ChevronDown,
  CalendarDays,
} from 'lucide-react';
import { ChatMessage } from '@/lib/data-store';
import { useToast } from './Toast';
import { uz } from 'date-fns/locale';
import { format } from 'date-fns';
import { chatsApi } from '@/lib/api-client';
import { CARD, BTN_GHOST, FilterChip, SectionHeader } from './ui';

type Period = 'day' | 'week' | 'month' | 'year' | 'last_week' | 'last_month' | 'all';
type Status = 'all' | 'answered' | 'unanswered';
type ClearRange = 'day' | 'week' | 'month' | 'year' | 'all';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Oxirgi 24 soat' },
  { value: 'week', label: 'Oxirgi 7 kun' },
  { value: 'month', label: 'Oxirgi 30 kun' },
  { value: 'year', label: 'Oxirgi yil' },
  { value: 'last_week', label: "O'tgan to'liq hafta" },
  { value: 'last_month', label: "O'tgan to'liq oy" },
  { value: 'all', label: 'Butun tarix' },
];

const STATUSES: { value: Status; label: string }[] = [
  { value: 'all', label: 'Hammasi' },
  { value: 'answered', label: 'AI javob bergan' },
  { value: 'unanswered', label: 'Javob topilmagan' },
];

const CLEAR_RANGES: { value: ClearRange; label: string; hint: string }[] = [
  { value: 'day', label: '1 kundan eski', hint: 'Bugungilar qoladi' },
  { value: 'week', label: '1 haftadan eski', hint: "Oxirgi hafta qoladi" },
  { value: 'month', label: '1 oydan eski', hint: 'Oxirgi oy qoladi' },
  { value: 'year', label: '1 yildan eski', hint: 'Oxirgi yil qoladi' },
  { value: 'all', label: 'Butun tarix', hint: "Hamma suhbat o'chadi" },
];

export const ChatLogs: React.FC = () => {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<Period>('week');
  const [status, setStatus] = useState<Status>('all');
  const [stats, setStats] = useState({ total: 0, answered: 0, unanswered: 0 });
  const [notFoundAnswer, setNotFoundAnswer] = useState<string>('');

  /* Ochilgan suhbat kartalari (yuklanganda birinchisi ochiq) */
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const [clearOpen, setClearOpen] = useState(false);
  const [clearRange, setClearRange] = useState<ClearRange>('month');
  const [clearing, setClearing] = useState(false);

  const { showToast } = useToast();

  const fetchChats = useCallback(async () => {
    setLoading(true);

    try {
      const data = await chatsApi.getAll({ period, status, limit: 100 });

      setChats(data.items ?? []);
      setOpenIds(new Set(data.items?.[0]?.id ? [data.items[0].id] : []));
      setStats({
        total: data.total ?? 0,
        answered: data.answered ?? 0,
        unanswered: data.unanswered ?? 0,
      });
      setNotFoundAnswer(data.notFoundAnswer ?? '');
    } catch (err) {
      showToast('Chatlarni yuklashda xatolik', 'error', (err as Error).message);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [period, status, showToast]);

  useEffect(() => {
    void fetchChats();
  }, [fetchChats]);

  const handleClear = async () => {
    setClearing(true);

    try {
      const res = await chatsApi.clear(clearRange);

      showToast('Tarix tozalandi', 'success', res?.message);
      setClearOpen(false);
      await fetchChats();
    } catch (err) {
      showToast('Tozalashda xatolik', 'error', (err as Error).message);
    } finally {
      setClearing(false);
    }
  };

  const toggleOpen = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const statusCount: Record<Status, number> = {
    all: stats.total,
    answered: stats.answered,
    unanswered: stats.unanswered,
  };

  return (
    <div className="px-4 lg:px-8 space-y-4 lg:space-y-5">
      <SectionHeader
        meta={`${chats.length} ta ko'rsatilmoqda`}
        title="Chat & Muloqot Tarixi"
        desc={`Davrda jami ${stats.total} ta · javob berilgan ${stats.answered} · topilmagan ${stats.unanswered}`}
        actions={
          <>
            <button
              onClick={() => void fetchChats()}
              title="Yangilash"
              aria-label="Yangilash"
              className="grid h-11 w-11 place-items-center rounded-sm border border-line bg-bg-1 text-text-1 hover:text-text-0 hover:border-text-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setClearOpen(true)}
              title="Tarixni tozalash"
              aria-label="Tarixni tozalash"
              className="grid h-11 w-11 place-items-center rounded-sm border border-line bg-bg-1 text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        }
      />

      {/* Holat filtrlari + davr */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="group" aria-label="Holat">
          {STATUSES.map((s) => (
            <FilterChip
              key={s.value}
              active={status === s.value}
              onClick={() => setStatus(s.value)}
              label={s.label}
              count={loading ? undefined : statusCount[s.value]}
            />
          ))}
        </div>

        <div className="relative lg:w-64">
          <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-2" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="h-11 w-full appearance-none rounded-sm border border-line bg-bg-1 pl-11 pr-10 text-[14px] text-text-0 focus:border-accent focus:outline-none"
            aria-label="Davr"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-2" />
        </div>
      </div>

      {/* Tozalash oynasi */}
      {clearOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4" onClick={() => setClearOpen(false)}>
          <div
            className="w-full sm:max-w-md rounded-t-md sm:rounded-md border border-line bg-bg-1 p-5 pb-[max(20px,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-[17px] font-semibold text-text-0">Tarixni tozalash</h3>
                <p className="mt-1 text-[13px] text-text-1">
                  Qaysi muddatdan eski suhbatlar o&apos;chirilsin?
                </p>
              </div>

              <button
                onClick={() => setClearOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-sm text-text-2 hover:bg-bg-2 hover:text-text-0"
                aria-label="Yopish"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {CLEAR_RANGES.map((r) => (
                <label
                  key={r.value}
                  className={`flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-sm border px-3.5 py-2.5 text-[13px] transition-colors ${
                    clearRange === r.value
                      ? 'border-text-1 bg-bg-2 text-text-0'
                      : 'border-line text-text-1 hover:border-text-2'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="clear-range"
                      value={r.value}
                      checked={clearRange === r.value}
                      onChange={() => setClearRange(r.value)}
                      className="accent-accent h-4 w-4"
                    />
                    {r.label}
                  </span>
                  <span className="font-mono text-[11px] text-text-2">{r.hint}</span>
                </label>
              ))}
            </div>

            {clearRange === 'all' && (
              <p className="mt-3 rounded-sm border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[12px] text-danger">
                Diqqat: butun suhbat tarixi o&apos;chiriladi va qaytarib
                bo&apos;lmaydi.
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setClearOpen(false)} className={BTN_GHOST}>
                Bekor qilish
              </button>

              <button
                onClick={() => void handleClear()}
                disabled={clearing}
                className="inline-flex h-10 items-center gap-2 rounded-sm bg-danger px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suhbatlar */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] bg-bg-1 rounded-md border border-line"></div>
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <MessageSquare className="w-10 h-10 text-text-2 mx-auto mb-3" />
          <h3 className="font-display text-base font-semibold text-text-0">Xabarlar topilmadi</h3>
          <p className="text-[13px] text-text-2 mt-1">
            Tanlangan davr va filtr uchun muloqot xabarlari mavjud emas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => {
            const isUnanswered = Boolean(
              notFoundAnswer && chat.answer === notFoundAnswer
            );
            const isOpen = openIds.has(chat.id);

            const createdAt = format(new Date(chat.createdAt), 'd MMMM yyyy, HH:mm', {
              locale: uz,
            });

            return (
              <div
                key={chat.id}
                className={`rounded-md border bg-bg-1 shadow-[var(--shadow-card)] transition-colors ${isOpen ? 'border-text-2' : 'border-line'}`}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(chat.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bg-3 text-text-2">
                    <User className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[14px] font-medium text-text-0 ${isOpen ? 'line-clamp-2' : 'truncate'}`}>
                      {chat.content}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-text-2">{createdAt}</span>
                  </span>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${isUnanswered ? 'bg-warn' : 'bg-accent'}`}
                    title={isUnanswered ? 'Javob topilmadi' : 'AI yordamchi'}
                  />
                  <ChevronDown className={`h-4 w-4 shrink-0 text-text-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="space-y-3 px-4 pb-4">
                    {/* Foydalanuvchi — o'ng tomonda */}
                    <div className="flex flex-col items-end">
                      <span className="mb-1 font-mono text-[10px] text-text-2">Foydalanuvchi</span>
                      <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-md bg-bg-3 px-3.5 py-2.5 text-[14px] leading-6 text-text-0">
                        {chat.content}
                      </p>
                    </div>

                    {/* AI — chap tomonda */}
                    {isUnanswered ? (
                      <div className="flex flex-col items-start gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-sm bg-warn/10 px-2 py-0.5 text-[12px] font-medium text-warn">
                          <Info className="h-3.5 w-3.5" />
                          Javob topilmadi
                        </span>
                        <p className="max-w-[85%] text-[13px] leading-6 text-text-2 italic">
                          Bilim bazasidan mos ma&apos;lumot topilmadi — bu savol
                          uchun material qo&apos;shish kerak bo&apos;lishi mumkin.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start">
                        <span className="mb-1 inline-flex items-center gap-1 font-mono text-[10px] text-text-2">
                          <Bot className="h-3 w-3" />
                          AI yordamchi
                        </span>
                        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-md border border-line bg-bg-2 px-3.5 py-2.5 text-[14px] leading-6 text-text-0">
                          {chat.answer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
