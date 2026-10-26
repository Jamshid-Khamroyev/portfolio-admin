'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Activity,
  Calendar,
  Clock,
  Send,
  Github,
  Linkedin,
  Instagram,
  Mail,
  BarChart3,
  ExternalLink,
  Timer,
  PenLine,
  FolderPlus,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { VisitorsTable } from '@/components/VisitorsTable';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reviewApi } from '@/lib/api-client';
import { UsageStats, SocialLinks } from '@/lib/data-store';
import { CARD, Segmented } from '@/components/ui';

const DEFAULT_SOCIALS: SocialLinks = {
  github: "https://github.com/Jamshid-Khamroyev",
  telegram: "https://t.me/xamroyev0811",
  linkedin: "https://www.linkedin.com/in/jamshidxamroyev",
  instagram: "https://www.instagram.com/jamsh1d0811",
  email: "xamroyevjamshid46@gmail.com",
  portfolio: "https://portfolio-wkv9.vercel.app",
};

const withProtocol = (url?: string) =>
  !url ? '#' : /^https?:\/\//i.test(url) ? url : `https://${url}`;

const tooltipStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-1)',
  border: '1px solid var(--line)',
  borderRadius: '6px',
  color: 'var(--text-0)',
  fontSize: '12px',
  boxShadow: 'none',
};

interface KpiProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
}

/* Desktop KPI kartasi: yorliq, katta raqam, ikonka, izoh (oldingi davr ma'lumoti yo'q — delta ko'rsatilmaydi) */
const KpiCard: React.FC<KpiProps> = ({ label, value, hint, icon: Icon }) => (
  <div className={`${CARD} p-5 flex flex-col gap-3`}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-[13px] text-text-1">{label}</p>
      <Icon className="w-4 h-4 shrink-0 text-text-2" />
    </div>
    <p className="font-display text-[30px] leading-none font-semibold text-text-0 tracking-tight tabular-nums">{value}</p>
    <p className="font-mono text-[11px] text-text-2">{hint}</p>
  </div>
);

/* Mobil 2×2 KPI kartasi */
const MiniKpi: React.FC<KpiProps> = ({ label, value, hint, icon: Icon }) => (
  <div className={`${CARD} p-4 flex flex-col gap-2.5`}>
    <div className="flex items-center justify-between gap-2">
      <p className="text-[12px] text-text-1 truncate">{label}</p>
      <Icon className="h-4 w-4 shrink-0 text-text-2" />
    </div>
    <div className="min-w-0">
      <p className="font-display text-[22px] leading-tight font-semibold text-text-0 tabular-nums truncate">{value}</p>
      {hint && <p className="font-mono text-[10px] text-text-2 truncate">{hint}</p>}
    </div>
  </div>
);

const fmtCompact = (n: number) =>
  n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}k` : n.toLocaleString();

interface UsageDashboardProps {
  /** Tezkor amallar uchun: bo'limga o'tish (create=true — yaratish oynasi ochiladi) */
  onNavigate?: (tab: string, create?: boolean) => void;
}

export const UsageDashboard: React.FC<UsageDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<UsageStats>();
  const [socials] = useState<SocialLinks>(DEFAULT_SOCIALS);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartMode, setChartMode] = useState<'weekly' | 'monthly'>('weekly');
  const [chartMetric, setChartMetric] = useState<'traffic' | 'duration'>('traffic');

  useEffect(() => {
    let ignore = false;
    reviewApi.getAnalytics()
      .then((reviewData) => {
        if (ignore) return;
        if (reviewData?.usage) setStats(reviewData.usage);
        else if (reviewData?.totalVisits !== undefined) setStats(reviewData);
      })
      .catch((err) => console.error('Failed to load usage stats:', err))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const activeChartData = useMemo(() => {
    if (!stats) return [];
    const src = chartMode === 'weekly' ? stats.weeklyChart : stats.monthlyChart;
    return src.map((item: any) => ({
      label: item.day ?? item.month,
      web: item.web,
      tme: item.tme,
      total: item.total,
      duration: item.durationHours || 0,
    }));
  }, [stats, chartMode]);

  if (loading || !stats) {
    return (
      <div className="px-4 lg:px-8 space-y-4 lg:space-y-6 animate-pulse">
        <div className="h-44 lg:hidden bg-bg-1 rounded-md border border-line" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-bg-1 rounded-md border border-line" />
          ))}
        </div>
        <div className="h-80 bg-bg-1 rounded-md border border-line" />
      </div>
    );
  }

  const monthSpark = stats.monthlyChart.map((d: any) => Number(d.total) || 0);
  const sparkMax = Math.max(1, ...monthSpark);

  const kpis: KpiProps[] = [
    { label: 'Jami kirishlar', value: stats.totalVisits.toLocaleString(), hint: 'Barcha vaqt davomida', icon: Activity },
    { label: 'Haftalik kirishlar', value: stats.weeklyVisits.toLocaleString(), hint: 'Oxirgi 7 kun', icon: Calendar },
    { label: 'Oylik kirishlar', value: stats.monthlyVisits.toLocaleString(), hint: 'Oxirgi 30 kun', icon: BarChart3 },
    { label: 'Foydalanish vaqti', value: String(stats.totalUsageTime), hint: `O'rtacha sessiya: ${stats.avgUsageTime}`, icon: Clock },
  ];

  /* Mobil 2×2: hero'dan tashqari uchta KPI + o'rtacha sessiya (mavjud ma'lumot) */
  const mobileKpis: KpiProps[] = [
    kpis[1],
    kpis[2],
    { ...kpis[3], hint: '' },
    { label: "O'rtacha sessiya", value: String(stats.avgUsageTime), hint: '', icon: Timer },
  ];

  const quickActions = [
    { label: 'Maqola', icon: PenLine, onClick: () => onNavigate?.('blog', true) },
    { label: 'Loyiha', icon: FolderPlus, onClick: () => onNavigate?.('projects', true) },
    { label: 'Push', icon: Bell, onClick: () => onNavigate?.('push') },
    { label: 'Chatlar', icon: MessageSquare, onClick: () => onNavigate?.('chats') },
  ];

  const split = [
    { name: 'Web', value: stats.webUsersCount, color: 'var(--accent)', hint: 'Brauzer orqali' },
    { name: 'Telegram', value: stats.tmeUsersCount, color: 'var(--info)', hint: 'MiniApp va bot' },
  ];
  const splitTotal = split.reduce((a, b) => a + b.value, 0) || 1;

  const socialItems = [
    { icon: Github, label: 'GitHub', href: socials?.github },
    { icon: Send, label: 'Telegram', href: socials?.telegram },
    { icon: Linkedin, label: 'LinkedIn', href: socials?.linkedin },
    { icon: Instagram, label: 'Instagram', href: socials?.instagram },
    { icon: Mail, label: socials?.email || 'xamroyevjamshid46@gmail.com', href: `mailto:${socials?.email || 'xamroyevjamshid46@gmail.com'}` },
  ];

  return (
    <div className="px-4 lg:px-8 space-y-4 lg:space-y-6">
      {/* ── Mobil: asosiy KPI (hero) ── */}
      <div className={`lg:hidden ${CARD} p-5`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[14px] text-text-1">{kpis[0].label}</p>
          <span className="font-mono text-[11px] text-text-2">{kpis[0].hint}</span>
        </div>
        <p className="mt-3 font-display text-[40px] leading-none font-semibold tracking-tight text-text-0 tabular-nums">
          {kpis[0].value}
        </p>
        {monthSpark.length > 1 && (
          <div className="mt-5 flex h-14 items-end gap-1.5" aria-hidden>
            {monthSpark.map((v, i) => (
              <span
                key={i}
                className={`flex-1 rounded-[2px] ${i === monthSpark.length - 1 ? 'bg-accent' : 'bg-text-2/30'}`}
                style={{ height: `${Math.max(8, (v / sparkMax) * 100)}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Mobil: 2×2 KPI ── */}
      <div className="lg:hidden grid grid-cols-2 gap-3">
        {mobileKpis.map((k) => (
          <MiniKpi key={k.label} {...k} />
        ))}
      </div>

      {/* ── Mobil: tezkor amallar ── */}
      {onNavigate && (
        <div className="lg:hidden grid grid-cols-4 gap-2 pt-1">
          {quickActions.map(({ label, icon: Icon, onClick }) => (
            <button key={label} type="button" onClick={onClick} className="flex flex-col items-center gap-2 py-1">
              <span className="grid h-14 w-14 place-items-center rounded-sm border border-line bg-bg-1 text-text-1 shadow-[var(--shadow-card)] active:scale-95 transition-transform">
                <Icon className="h-[22px] w-[22px]" />
              </span>
              <span className="text-[12px] text-text-1">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Desktop: KPI qatori ── */}
      <div className="hidden lg:grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Grafik + foydalanuvchilar taqsimoti */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className={`lg:col-span-2 ${CARD} p-4 lg:p-6 space-y-4`}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-[17px] font-semibold text-text-0">
                {chartMetric === 'traffic' ? 'Kirishlar oqimi' : 'Foydalanish vaqti'}
              </h3>
              <p className="text-xs text-text-1 mt-0.5">
                {chartMetric === 'traffic'
                  ? 'Web va Telegram bo\'yicha kirishlar'
                  : 'Foydalanuvchilarning umumiy vaqti (soat)'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                value={chartMetric}
                onChange={setChartMetric}
                options={[
                  { id: 'traffic', label: 'Kirishlar' },
                  { id: 'duration', label: 'Vaqt', icon: Timer },
                ]}
              />
              <Segmented
                value={chartMode}
                onChange={setChartMode}
                options={[
                  { id: 'weekly', label: 'Haftalik' },
                  { id: 'monthly', label: 'Oylik' },
                ]}
              />
            </div>
          </div>

          {chartMetric === 'traffic' && (
            <div className="flex items-center gap-4 text-xs text-text-1">
              <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-[2px] bg-accent" />Web</span>
              <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-[2px] bg-info" />Telegram</span>
            </div>
          )}

          <div className="h-60 lg:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMetric === 'traffic' ? (
                <BarChart data={activeChartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
                  <XAxis dataKey="label" stroke="var(--text-2)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--bg-3)', opacity: 0.5 }} />
                  <Bar dataKey="web" name="Web" stackId="v" fill="var(--accent)" radius={[0, 0, 2, 2]} maxBarSize={40} isAnimationActive={false} />
                  <Bar dataKey="tme" name="Telegram" stackId="v" fill="var(--info)" radius={[2, 2, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                </BarChart>
              ) : (
                <BarChart data={activeChartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
                  <XAxis dataKey="label" stroke="var(--text-2)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--bg-3)', opacity: 0.5 }}
                    formatter={(value: any) => [`${value} soat`, 'Foydalanish vaqti']}
                  />
                  <Bar dataKey="duration" name="Soat" fill="var(--accent)" radius={[2, 2, 2, 2]} maxBarSize={40} isAnimationActive={false} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Foydalanuvchilar taqsimoti (platformalar) */}
        <div className={`${CARD} p-4 lg:p-6 flex flex-col`}>
          <div>
            <h3 className="font-display text-[17px] font-semibold text-text-0">Foydalanuvchilar</h3>
            <p className="text-xs text-text-1 mt-0.5">Platformalar bo&apos;yicha taqsimot</p>
          </div>

          <div className="relative h-48 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={split}
                  dataKey="value"
                  innerRadius="72%"
                  outerRadius="96%"
                  paddingAngle={2}
                  stroke="none"
                  cornerRadius={2}
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {split.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Users className="w-4 h-4 text-text-2 mb-1" />
              <span className="font-display text-[28px] font-semibold text-text-0 tabular-nums leading-none">
                {fmtCompact(stats.totalUsersCount)}
              </span>
              <span className="font-mono text-[11px] text-text-2 mt-1">jami</span>
            </div>
          </div>

          <div className="mt-auto divide-y divide-line">
            {split.map((s) => {
              const pct = Math.round((s.value / splitTotal) * 100);
              return (
                <div key={s.name} className="flex items-center gap-3 py-2.5">
                  <i className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: s.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-0">{s.name}</p>
                    <p className="text-[11px] text-text-2">{s.hint}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-0 tabular-nums">{s.value.toLocaleString()}</p>
                    <p className="font-mono text-[11px] text-text-2 tabular-nums">{pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tashrif buyuruvchilar + eng ko'p bajarilgan ishlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        <div className={`${CARD} overflow-hidden ${stats.topTasks.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <VisitorsTable />
        </div>

        {stats.topTasks.length > 0 && (
          <div className={`${CARD} p-4 lg:p-6`}>
            <div className="mb-4">
              <h3 className="font-display text-[17px] font-semibold text-text-0">Eng ko&apos;p bajarilgan ishlar</h3>
              <p className="text-xs text-text-1 mt-0.5">Foydalanuvchilar faolligi bo&apos;yicha</p>
            </div>
            <div className="space-y-4">
              {stats.topTasks.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-text-0 truncate">{item.task}</span>
                    <span className="font-mono text-[12px] text-text-1 tabular-nums shrink-0">
                      {item.count.toLocaleString()}
                      <span className="text-text-2"> · {item.percentage}%</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-3 rounded-[2px] overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-[2px]"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ijtimoiy tarmoqlar */}
      <div className={`${CARD} p-4 lg:p-6`}>
        <div className="mb-4">
          <h3 className="font-display text-[17px] font-semibold text-text-0">Ijtimoiy tarmoqlar</h3>
          <p className="text-xs text-text-1 mt-0.5">Portfolioda ko&apos;rsatilgan rasmiy havolalar</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {socialItems.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href?.startsWith('mailto:') ? href : withProtocol(href)}
              target="_blank"
              rel="noreferrer"
              className="min-h-[48px] px-3.5 rounded-sm bg-bg-2 border border-line hover:border-text-2 flex items-center gap-3 text-sm group transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0 text-text-2 group-hover:text-text-0 transition-colors" />
              <span className="flex-1 truncate text-text-0">{label}</span>
              <ExternalLink className="w-3.5 h-3.5 text-text-2 group-hover:text-text-0 shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
