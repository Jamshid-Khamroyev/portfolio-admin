import React, { useCallback, useEffect, useState } from 'react';
import {
  MessageSquare,
  RefreshCw,
  Bot,
  User,
  Trash2,
  Info,
  X,
} from 'lucide-react';
import { ChatMessage } from '@/lib/data-store';
import { useToast } from './Toast';
import { uz } from 'date-fns/locale';
import { format } from 'date-fns';
import { chatsApi } from '@/lib/api-client';

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

  const [clearOpen, setClearOpen] = useState(false);
  const [clearRange, setClearRange] = useState<ClearRange>('month');
  const [clearing, setClearing] = useState(false);

  const { showToast } = useToast();

  const fetchChats = useCallback(async () => {
    setLoading(true);

    try {
      const data = await chatsApi.getAll({ period, status, limit: 100 });

      setChats(data.items ?? []);
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

  const selectClass =
    'bg-bg-3 border border-accent-dim/40 text-accent py-1.5 px-2 text-xs rounded-sm';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-bg-1 p-5 rounded-sm border border-line shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-sm bg-bg-3 border border-accent-dim/40 text-accent">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-0 flex items-center gap-2 flex-wrap">
              <span>Chat &amp; Muloqot Tarixi</span>
              <span className="text-xs text-accent font-mono">
                {chats.length} ta ko&apos;rsatilmoqda
              </span>
            </h2>
            <p className="text-xs text-text-1">
              Davrda jami {stats.total} ta · javob berilgan {stats.answered} ·
              topilmagan {stats.unanswered}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className={selectClass}
            aria-label="Davr"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className={selectClass}
            aria-label="Holat"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => void fetchChats()}
            className="px-3.5 py-1.5 rounded-sm bg-bg-3 border border-accent-dim/40 text-accent hover:bg-accent-dim hover:text-text-0 text-xs font-mono font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yangilash</span>
          </button>

          <button
            onClick={() => setClearOpen(true)}
            className="px-3.5 py-1.5 rounded-sm bg-bg-2 border border-danger/40 text-danger hover:bg-danger/15 text-xs font-mono font-semibold transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tarixni tozalash</span>
          </button>
        </div>
      </div>

      {/* Tozalash oynasi */}
      {clearOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-sm border border-line bg-bg-1 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-0">Tarixni tozalash</h3>
                <p className="mt-1 text-xs text-text-1">
                  Qaysi muddatdan eski suhbatlar o&apos;chirilsin?
                </p>
              </div>

              <button
                onClick={() => setClearOpen(false)}
                className="text-text-2 hover:text-text-0"
                aria-label="Yopish"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {CLEAR_RANGES.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-sm border px-3 py-2 text-xs transition-colors ${
                    clearRange === r.value
                      ? 'border-accent-dim bg-bg-3 text-accent'
                      : 'border-line text-text-1 hover:border-accent-dim/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="clear-range"
                      value={r.value}
                      checked={clearRange === r.value}
                      onChange={() => setClearRange(r.value)}
                      className="accent-accent"
                    />
                    {r.label}
                  </span>
                  <span className="text-[10px] text-text-2">{r.hint}</span>
                </label>
              ))}
            </div>

            {clearRange === 'all' && (
              <p className="mt-3 rounded-sm border border-danger/40 bg-bg-2 px-3 py-2 text-[11px] text-danger">
                Diqqat: butun suhbat tarixi o&apos;chiriladi va qaytarib
                bo&apos;lmaydi.
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setClearOpen(false)}
                className="px-3 py-1.5 text-xs text-text-1 hover:text-text-0"
              >
                Bekor qilish
              </button>

              <button
                onClick={() => void handleClear()}
                disabled={clearing}
                className="px-4 py-1.5 rounded-sm bg-danger/15 text-warn text-xs font-bold hover:bg-danger/15 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {clearing ? "O'chirilmoqda..." : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages & AI Responses */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-bg-2 rounded-2xl border border-line"></div>
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="p-12 text-center bg-bg-1 rounded-2xl border border-line">
          <MessageSquare className="w-12 h-12 text-text-2 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-text-1">Xabarlar topilmadi</h3>
          <p className="text-xs text-text-2 mt-1">
            Tanlangan davr va filtr uchun muloqot xabarlari mavjud emas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {chats.map((chat) => {
            const isUnanswered = Boolean(
              notFoundAnswer && chat.answer === notFoundAnswer
            );

            const createdAt = format(new Date(chat.createdAt), 'd MMMM yyyy, HH:mm', {
              locale: uz,
            });

            return (
              <div
                key={chat.id}
                className={`rounded-sm border p-4 ${
                  isUnanswered
                    ? 'border-line bg-bg-2'
                    : 'border-line bg-bg-2'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User question */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-accent" />
                      <span className="text-xs font-medium text-text-1">Foydalanuvchi</span>
                    </div>

                    <p className="text-sm leading-6 text-text-0">{chat.content}</p>
                  </div>

                  {/* AI answer */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      {isUnanswered ? (
                        <>
                          <Info className="h-4 w-4 text-text-2" />
                          <span className="text-xs font-medium text-text-1">
                            Javob topilmadi
                          </span>
                        </>
                      ) : (
                        <>
                          <Bot className="h-4 w-4 text-accent" />
                          <span className="text-xs font-medium text-accent">AI yordamchi</span>
                        </>
                      )}
                    </div>

                    {isUnanswered ? (
                      <p className="text-sm leading-6 text-text-2 italic">
                        Bilim bazasidan mos ma&apos;lumot topilmadi — bu savol
                        uchun material qo&apos;shish kerak bo&apos;lishi mumkin.
                      </p>
                    ) : (
                      <p className="text-sm leading-6 text-text-0">{chat.answer}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-line p-1 m-1 text-right">
                  <span className="text-[11px] text-text-2">{createdAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
