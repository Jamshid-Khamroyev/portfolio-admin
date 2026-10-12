'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bell, ChevronDown, RefreshCw, Send, Users } from 'lucide-react';
import { useToast } from './Toast';
import { pushApi } from '@/lib/api-client';

interface PushStats {
  configured: boolean;
  total: number;
  byLocale: Record<string, number>;
}

/* main/lib/webpush.ts dagi kesish chegaralari bilan bir xil */
const TITLE_MAX = 65;
const BODY_MAX = 100;

const inputCls =
  'w-full bg-bg-1 border border-line rounded-sm px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-accent-dim';


type PreviewLocale = 'uz' | 'ru' | 'en';

const PREVIEW_TEXT: Record<PreviewLocale, { read: string; now: string; title: string; body: string }> = {
  uz: { read: "O'qish", now: 'hozir', title: 'Sarlavha', body: 'Bildirishnoma matni shu yerda ko\'rinadi' },
  ru: { read: 'Читать', now: 'сейчас', title: 'Заголовок', body: 'Текст уведомления появится здесь' },
  en: { read: 'Read', now: 'now', title: 'Title', body: 'Notification text will appear here' },
};

/* Server (main/lib/webpush.ts) bilan bir xil: so'z o'rtasidan kesmaydi */
function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

const AppIcon = ({ size }: { size: number }) => (
  <span
    aria-hidden
    style={{ width: size, height: size }}
    className="grid shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-on-accent"
  >
    JX
  </span>
);

const PushPreview: React.FC<{
  title: string;
  body: string;
  image: string;
  url: string;
  locale: PreviewLocale;
  onLocale: (l: PreviewLocale) => void;
}> = ({ title, body, image, url, locale, onLocale }) => {
  const [imgOk, setImgOk] = useState(true);
  const t = PREVIEW_TEXT[locale];

  const shownTitle = clip(title, TITLE_MAX) || t.title;
  const shownBody = clip(body, BODY_MAX) || (title ? '' : t.body);
  const hasImage = Boolean(image.trim()) && imgOk;

  const target = /^https?:\/\//i.test(url.trim())
    ? url.trim()
    : `/${locale}${url.trim() ? (url.trim().startsWith('/') ? '' : '/') + url.trim() : ''}`;

  const Header = () => (
    <div className="flex items-center gap-1.5 text-[10px] text-text-2">
      <AppIcon size={14} />
      <span>jamshidxamroyev.uz</span>
      <span>·</span>
      <span>{t.now}</span>
      <ChevronDown className="ml-auto h-3 w-3" />
    </div>
  );

  return (
    <div className="bg-bg-1 border border-line rounded-sm p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-2">Foydalanuvchiga ko&apos;rinishi</p>
        <div className="flex gap-1">
          {(['uz', 'ru', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLocale(l)}
              className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono uppercase border ${
                locale === l ? 'border-accent text-accent' : 'border-line text-text-2 hover:text-text-1'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Telefon ekrani foni */}
      <div className="rounded-xl bg-[#1c1f24] p-3 space-y-4">
        {/* Default (yig'iq) */}
        <div>
          <p className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-white/40">Default (yig&apos;iq)</p>
          <div className="rounded-2xl bg-[#2b2f36] p-3 text-white">
            <Header />
            <div className="mt-1.5 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-snug">{shownTitle}</p>
                {shownBody && <p className="truncate text-[12px] leading-snug text-white/70">{shownBody}</p>}
              </div>
              <AppIcon size={36} />
            </div>
          </div>
        </div>

        {/* Yoyiq */}
        <div>
          <p className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-white/40">Yoyiq (bosganda)</p>
          <div className="overflow-hidden rounded-2xl bg-[#2b2f36] text-white">
            <div className="p-3">
              <Header />
              <div className="mt-1.5 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[13px] font-semibold leading-snug">{shownTitle}</p>
                  {shownBody && <p className="mt-0.5 break-words text-[12px] leading-snug text-white/70">{shownBody}</p>}
                </div>
                <AppIcon size={36} />
              </div>
            </div>

            {hasImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.trim()}
                alt=""
                onError={() => setImgOk(false)}
                className="aspect-[2/1] w-full object-cover"
              />
            )}

            <div className="flex items-center gap-4 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-accent">{t.read}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="break-all text-[10px] font-mono text-text-2">
        Bosilganda ochiladi: <span className="text-text-1">{target}</span>
      </p>
    </div>
  );
};

export const PushSender: React.FC = () => {
  const { showToast } = useToast();

  const [stats, setStats] = useState<PushStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState('');
  const [previewLocale, setPreviewLocale] = useState<PreviewLocale>('uz');
  const [sourceLang, setSourceLang] = useState<PreviewLocale>('uz');

  /* Obunachilar bor, lekin matn tilidan boshqa tillar — faqat shularga tarjima qilinadi */
  const targets = ['uz', 'ru', 'en'].filter((l) => l !== sourceLang && (stats?.byLocale?.[l] ?? 0) > 0);

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
        sourceLang,
      });
      showToast(
        'Bildirishnoma yuborildi',
        'success',
        `${res.sent}/${res.total} yetkazildi · ${res.failed} xato · ${res.removed} eskirgan obuna o'chirildi` +
          (res.translatedTo?.length ? ` · tarjima: ${res.translatedTo.join(', ').toUpperCase()}` : ' · tarjima kerak bo\'lmadi')
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

        <div className="space-y-1.5">
          <span className="text-xs font-mono text-text-1">Matn tili</span>
          <div className="flex gap-1.5">
            {(['uz', 'ru', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setSourceLang(l)}
                className={`px-3 py-1 rounded-sm text-xs font-mono uppercase border ${
                  sourceLang === l ? 'border-accent text-accent' : 'border-line text-text-2 hover:text-text-1'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="block text-[10px] font-mono text-text-2">
            {targets.length
              ? `Obunachilar tillariga qarab avtomatik tarjima qilinadi: ${targets.map((l) => l.toUpperCase()).join(', ')}`
              : "Barcha obunachilar shu tilda — tarjima qilinmaydi."}
          </span>
        </div>

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

        {/* Real vaqtdagi ko'rinish: foydalanuvchi telefonida qanday chiqishi */}
        <PushPreview key={image} title={title} body={body} image={image} url={url} locale={previewLocale} onLocale={setPreviewLocale} />
      </div>
    </div>
  );
};
