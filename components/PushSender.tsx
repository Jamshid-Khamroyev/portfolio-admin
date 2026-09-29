'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bell, RefreshCw, Send, Users } from 'lucide-react';
import { useToast } from './Toast';
import { pushApi } from '@/lib/api-client';

interface PushStats {
  configured: boolean;
  total: number;
  byLocale: Record<string, number>;
}

const TITLE_MAX = 70;
const BODY_MAX = 110;

const inputCls =
  'w-full bg-[#0d1310] border border-[#213028] rounded-sm px-3 py-2 text-sm text-[#eaf2ec] placeholder:text-[#71847a] focus:outline-none focus:border-[#1f8a52]';

export const PushSender: React.FC = () => {
  const { showToast } = useToast();

  const [stats, setStats] = useState<PushStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await pushApi.getStats());
    } catch (err) {
      showToast("Obunachilarni yuklab bo'lmadi", 'error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!confirm(`${stats?.total ?? 0} ta obunachiga yuborilsinmi?`)) return;

    setSending(true);
    try {
      const res = await pushApi.send({
        title: title.trim(),
        body: body.trim() || undefined,
        url: url.trim() || undefined,
        image: image.trim() || undefined,
      });
      showToast(
        'Bildirishnoma yuborildi',
        'success',
        `${res.sent}/${res.total} yetkazildi · ${res.failed} xato · ${res.removed} eskirgan obuna o'chirildi`
      );
      setTitle('');
      setBody('');
      setUrl('');
      setImage('');
      fetchStats();
    } catch (err) {
      showToast('Yuborishda xatolik', 'error', (err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <form
        onSubmit={handleSend}
        className="bg-[#0d1310] border border-[#213028] rounded-sm p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-[#eaf2ec] font-semibold">
          <Bell className="w-4 h-4 text-[#49f08a]" />
          Yangi bildirishnoma
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-mono text-[#aab8b0]">Sarlavha *</span>
          <input
            className={inputCls}
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yangi loyiha chiqdi!"
            required
          />
          <span className="block text-right text-[10px] font-mono text-[#71847a]">
            {title.length}/{TITLE_MAX}
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-mono text-[#aab8b0]">Matn</span>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={body}
            maxLength={BODY_MAX}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Qisqa tavsif..."
          />
          <span className="block text-right text-[10px] font-mono text-[#71847a]">
            {body.length}/{BODY_MAX}
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-mono text-[#aab8b0]">Havola</span>
          <input
            className={inputCls}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/blogs yoki https://..."
          />
          <span className="block text-[10px] font-mono text-[#71847a]">
            Nisbiy yo&apos;l obunachi tiliga moslanadi: /blogs → /uz/blogs. Bo&apos;sh bo&apos;lsa — bosh sahifa.
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-mono text-[#aab8b0]">Rasm URL (ixtiyoriy)</span>
          <input
            className={inputCls}
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://.../cover.jpg"
          />
        </label>

        <button
          type="submit"
          disabled={sending || !title.trim() || !stats?.configured || !stats?.total}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#1f8a52] text-white text-sm font-semibold hover:bg-[#23a060] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Yuborilmoqda...' : 'Hammaga yuborish'}
        </button>
      </form>

      <div className="space-y-4">
        <div className="bg-[#0d1310] border border-[#213028] rounded-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-sm text-[#aab8b0]">
              <Users className="w-4 h-4" /> Obunachilar
            </span>
            <button
              type="button"
              onClick={fetchStats}
              title="Yangilash"
              className="p-1 text-[#71847a] hover:text-[#49f08a]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-3xl font-bold text-[#49f08a] font-mono">{stats?.total ?? '—'}</div>
          <div className="mt-3 flex gap-3 text-xs font-mono text-[#aab8b0]">
            {['uz', 'ru', 'en'].map((l) => (
              <span key={l}>
                {l.toUpperCase()}: {stats?.byLocale?.[l] ?? 0}
              </span>
            ))}
          </div>
          {stats && !stats.configured && (
            <p className="mt-3 text-xs text-[#ff6b6b]">
              VAPID kalitlari sozlanmagan — push yuborib bo&apos;lmaydi.
            </p>
          )}
        </div>

        {/* Ko'rinish (taxminiy) */}
        <div className="bg-[#0d1310] border border-[#213028] rounded-sm p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#71847a] mb-2">Ko&apos;rinishi</p>
          <div className="flex gap-3 items-start bg-[#131b16] rounded-md p-3">
            <div className="w-9 h-9 rounded-md bg-[#182119] border border-[#213028] shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#eaf2ec] truncate">{title || 'Sarlavha'}</p>
              <p className="text-xs text-[#aab8b0] line-clamp-2">{body || 'Matn'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
