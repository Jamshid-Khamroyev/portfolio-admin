'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bell, ChevronDown, Image as ImageIcon, Link2, RefreshCw, Send, Users } from 'lucide-react';
import { useToast } from './Toast';
import { pushApi } from '@/lib/api-client';
import { CARD, INPUT, LABEL, BTN_PRIMARY, Segmented } from './ui';

interface PushStats {
  configured: boolean;
  total: number;
  byLocale: Record<string, number>;
}

/* main/lib/webpush.ts dagi kesish chegaralari bilan bir xil */
const TITLE_MAX = 65;
const BODY_MAX = 100;


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
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/icons/icon-192.png"
    alt=""
    aria-hidden
    width={size}
    height={size}
    style={{ width: size, height: size }}
    className="shrink-0 rounded-md"
  />
);

const PreviewHeader: React.FC<{ now: string }> = ({ now }) => (
  <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-2">
    <span>jamshidxamroyev.uz</span>
    <span>·</span>
    <span>{now}</span>
    <ChevronDown className="ml-auto h-3.5 w-3.5" />
  </div>
);

type PreviewMode = 'collapsed' | 'expanded';

const PushPreview: React.FC<{
  title: string;
  body: string;
  image: string;
  url: string;
  locale: PreviewLocale;
  onLocale: (l: PreviewLocale) => void;
  mode: PreviewMode;
  onMode: (m: PreviewMode) => void;
}> = ({ title, body, image, url, locale, onLocale, mode, onMode: setMode }) => {
  const [imgOk, setImgOk] = useState(true);
  const t = PREVIEW_TEXT[locale];

  const shownTitle = clip(title, TITLE_MAX) || t.title;
  const shownBody = clip(body, BODY_MAX) || (title ? '' : t.body);
  const hasImage = Boolean(image.trim()) && imgOk;

  const target = /^https?:\/\//i.test(url.trim())
    ? url.trim()
    : `/${locale}${url.trim() ? (url.trim().startsWith('/') ? '' : '/') + url.trim() : ''}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-text-2">Foydalanuvchiga ko&apos;rinishi</p>
        <div className="flex gap-1">
          {(['uz', 'ru', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLocale(l)}
              aria-pressed={locale === l}
              className={`h-8 min-w-[36px] rounded-sm px-2 font-mono text-[11px] uppercase transition-colors ${
                locale === l ? 'bg-bg-3 text-text-0' : 'text-text-2 hover:text-text-1'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Bildirishnoma kartasi */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-start gap-3 p-4">
          <AppIcon size={40} />
          <div className="min-w-0 flex-1">
            <PreviewHeader now={t.now} />
            <p className={`mt-1 text-[15px] font-semibold leading-snug text-text-0 ${mode === 'collapsed' ? 'truncate' : 'break-words'}`}>
              {shownTitle}
            </p>
            {shownBody && (
              <p className={`mt-0.5 text-[13px] leading-snug text-text-1 ${mode === 'collapsed' ? 'truncate' : 'break-words'}`}>
                {shownBody}
              </p>
            )}
          </div>
        </div>

        {mode === 'expanded' && (
          <>
            {hasImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.trim()}
                alt=""
                onError={() => setImgOk(false)}
                className="aspect-[2/1] w-full object-cover"
              />
            )}
            <div className="border-t border-line px-4 py-3">
              <span className="text-[13px] font-semibold text-accent">{t.read}</span>
            </div>
          </>
        )}
      </div>

      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { id: 'collapsed', label: "Default (yig'iq)" },
          { id: 'expanded', label: 'Yoyiq (bosganda)' },
        ]}
      />

      <p className="break-all font-mono text-[11px] text-text-2">
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
  const [previewMode, setPreviewMode] = useState<PreviewMode>('collapsed');

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
    <div className="px-4 lg:px-8 grid gap-4 lg:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {/* Obunachilar + ko'rinish (mobilda yuqorida, desktopda o'ngda) */}
      <div className="space-y-4 lg:order-2">
        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] text-text-1">
              <Users className="w-4 h-4" /> Obunachilar
            </span>
            <button
              type="button"
              onClick={fetchStats}
              title="Yangilash"
              aria-label="Yangilash"
              className="grid h-10 w-10 place-items-center rounded-sm text-text-2 hover:bg-bg-2 hover:text-text-0 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="font-display text-[34px] leading-none font-semibold text-text-0 tabular-nums">{stats?.total ?? '—'}</div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {['uz', 'ru', 'en'].map((l) => (
              <div key={l} className="rounded-sm border border-line bg-bg-2 px-3 py-2.5">
                <div className="font-display text-[18px] font-semibold text-text-0 tabular-nums">{stats?.byLocale?.[l] ?? 0}</div>
                <div className="font-mono text-[11px] text-text-2">{l.toUpperCase()}</div>
              </div>
            ))}
          </div>
          {stats && !stats.configured && (
            <p className="mt-3 rounded-sm bg-danger/10 px-3 py-2 text-[12px] text-danger">
              VAPID kalitlari sozlanmagan — push yuborib bo&apos;lmaydi.
            </p>
          )}
        </div>

        {/* Real vaqtdagi ko'rinish: foydalanuvchi telefonida qanday chiqishi */}
        <PushPreview key={image} title={title} body={body} image={image} url={url} locale={previewLocale} onLocale={setPreviewLocale} mode={previewMode} onMode={setPreviewMode} />
      </div>

      <form
        onSubmit={handleSend}
        className="space-y-4 lg:order-1 lg:rounded-md lg:border lg:border-line lg:bg-bg-1 lg:p-6 lg:shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center gap-2 font-display text-[17px] font-semibold text-text-0">
          <Bell className="w-4 h-4 text-text-2" />
          Yangi bildirishnoma
        </div>

        <label className="block">
          <span className={LABEL}>Sarlavha *</span>
          <input
            className={`${INPUT} h-12`}
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yangi loyiha chiqdi!"
            required
          />
          <span className="mt-1 block text-right font-mono text-[11px] text-text-2">
            {title.length}/{TITLE_MAX}
          </span>
        </label>

        <label className="block">
          <span className={LABEL}>Matn</span>
          <textarea
            className={`${INPUT} resize-none`}
            rows={3}
            value={body}
            maxLength={BODY_MAX}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Qisqa tavsif..."
          />
          <span className="mt-1 block text-right font-mono text-[11px] text-text-2">
            {body.length}/{BODY_MAX}
          </span>
        </label>

        <label className="block">
          <span className={LABEL}>Havola</span>
          <span className="relative block">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-2" />
            <input
              className={`${INPUT} h-12 pl-10`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/blogs yoki https://..."
            />
          </span>
          <span className="mt-1 block font-mono text-[11px] text-text-2">
            Nisbiy yo&apos;l obunachi tiliga moslanadi: /blogs → /uz/blogs. Bo&apos;sh bo&apos;lsa — bosh sahifa.
          </span>
        </label>

        <label className="block">
          <span className={LABEL}>Rasm URL (ixtiyoriy)</span>
          <span className="relative block">
            <ImageIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-2" />
            <input
              className={`${INPUT} h-12 pl-10`}
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://.../cover.jpg"
            />
          </span>
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-text-0">Matn tili</span>
            <div className="flex gap-2">
              {(['uz', 'ru', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSourceLang(l)}
                  aria-pressed={sourceLang === l}
                  className={`h-10 min-w-[52px] rounded-sm border px-3 font-mono text-[13px] font-semibold uppercase transition-colors ${
                    sourceLang === l ? 'border-text-0 bg-text-0 text-bg-0' : 'border-line bg-bg-1 text-text-1 hover:text-text-0'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <span className="mt-2 block font-mono text-[11px] text-text-2">
            {targets.length
              ? `Obunachilar tillariga qarab avtomatik tarjima qilinadi: ${targets.map((l) => l.toUpperCase()).join(', ')}`
              : "Barcha obunachilar shu tilda — tarjima qilinmaydi."}
          </span>
        </div>

        <button
          type="submit"
          disabled={sending || !title.trim() || !stats?.configured || !stats?.total}
          className={`${BTN_PRIMARY} h-12 w-full text-[15px]`}
        >
          <Send className="w-[18px] h-[18px]" />
          {sending ? 'Yuborilmoqda...' : 'Hammaga yuborish'}
        </button>
      </form>
    </div>
  );
};
