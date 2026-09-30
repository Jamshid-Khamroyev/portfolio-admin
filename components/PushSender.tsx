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
  'w-full bg-bg-1 border border-line rounded-sm px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-accent-dim';

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
        className="bg-bg-1 border border-line rounded-sm p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-text-0 font-semibold">
          <Bell className="w-4 h-4 text-accent" />
          Yangi bildirishnoma
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-mono text-text-1">Sarlavha *</span>
          <input
            className={inputCls}
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yangi loyiha chiqdi!"
            required
          />
          <span className="block text-right text-[10px] font-mono text-text-2">
            {title.length}/{TITLE_MAX}
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-mono text-text-1">Matn</span>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={body}
            maxLength={BODY_MAX}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Qisqa tavsif..."
          />
          <span className="block text-right text-[10px] font-mono text-text-2">
            {body.length}/{BODY_MAX}
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-mono text-text-1">Havola</span>
          <input
            className={inputCls}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/blogs yoki https://..."
          />
          <span className="block text-[10px] font-mono text-text-2">
            Nisbiy yo&apos;l obunachi tiliga moslanadi: /blogs → /uz/blogs. Bo&apos;sh bo&apos;lsa — bosh sahifa.
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-mono text-text-1">Rasm URL (ixtiyoriy)</span>
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-accent text-on-accent text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Yuborilmoqda...' : 'Hammaga yuborish'}
        </button>
      </form>

      <div className="space-y-4">
        <div className="bg-bg-1 border border-line rounded-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-sm text-text-1">
              <Users className="w-4 h-4" /> Obunachilar
            </span>
            <button
              type="button"
              onClick={fetchStats}
              title="Yangilash"
              className="p-1 text-text-2 hover:text-accent"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-3xl font-bold text-accent font-mono">{stats?.total ?? '—'}</div>
          <div className="mt-3 flex gap-3 text-xs font-mono text-text-1">
            {['uz', 'ru', 'en'].map((l) => (
              <span key={l}>
                {l.toUpperCase()}: {stats?.byLocale?.[l] ?? 0}
              </span>
            ))}
          </div>
          {stats && !stats.configured && (
            <p className="mt-3 text-xs text-danger">
              VAPID kalitlari sozlanmagan — push yuborib bo&apos;lmaydi.
            </p>
          )}
        </div>

        {/* Ko'rinish (taxminiy) */}
        <div className="bg-bg-1 border border-line rounded-sm p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-2 mb-2">Ko&apos;rinishi</p>
          <div className="flex gap-3 items-start bg-bg-2 rounded-md p-3">
            <div className="w-9 h-9 rounded-md bg-bg-3 border border-line shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-0 truncate">{title || 'Sarlavha'}</p>
              <p className="text-xs text-text-1 line-clamp-2">{body || 'Matn'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
