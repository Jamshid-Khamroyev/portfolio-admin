'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Activity,
  Calendar,
  Clock,
  Globe,
  Send,
  Github,
  Linkedin,
  Instagram,
  Mail,
  BarChart3,
  ExternalLink,
  Timer,
} from 'lucide-react';
import { VisitorsTable } from '@/components/VisitorsTable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reviewApi } from '@/lib/api-client';
import { UsageStats, SocialLinks } from '@/lib/data-store';

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
  borderRadius: '0.75rem',
  color: 'var(--text-0)',
  fontSize: '12px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
};

const CARD = 'rounded-2xl bg-bg-1 border border-line';

type Tone = 'accent' | 'info' | 'warn';
const TONES: Record<Tone, { icon: string; color: string }> = {
  accent: { icon: 'bg-accent/12 text-accent', color: 'var(--accent)' },
  info: { icon: 'bg-info/12 text-info', color: 'var(--info)' },
  warn: { icon: 'bg-warn/12 text-warn', color: 'var(--warn)' },
};

interface KpiProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  tone: Tone;
  spark: number[];
}

const KpiCard: React.FC<KpiProps> = ({ label, value, hint, icon: Icon, tone, spark }) => {
  const t = TONES[tone];
  const gid = `spark-${tone}-${label.replace(/\W/g, '')}`;
  const data = spark.map((v, i) => ({ i, v }));
  return (
    <div className={`${CARD} p-5 flex flex-col justify-between gap-4 hover:border-accent-dim/60 transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-text-1">{label}</p>
          <p className="mt-1.5 text-[1.7rem] leading-none font-bold text-text-0 tracking-tight tabular-nums">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${t.icon}`}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[11px] text-text-2 leading-snug">{hint}</p>
        {data.length > 1 && (
          <div className="h-9 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={t.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={t.color} strokeWidth={1.75} fill={`url(#${gid})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

const Segmented = <T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon?: React.ElementType }[];
}) => (
  <div className="flex items-center gap-1 p-1 bg-bg-2 rounded-xl border border-line">
    {options.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
          value === id ? 'bg-bg-1 text-accent shadow-sm border border-line' : 'text-text-1 hover:text-text-0 border border-transparent'
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </button>
    ))}
  </div>
);

export const UsageDashboard: React.FC = () => {
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
      <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-bg-2 rounded-2xl border border-line" />
          ))}
        </div>
        <div className="h-80 bg-bg-2 rounded-2xl border border-line" />
      </div>
    );
  }

  const weekSpark = stats.weeklyChart.map((d: any) => d.total);
  const monthSpark = stats.monthlyChart.map((d: any) => d.total);
  const durSpark = stats.weeklyChart.map((d: any) => d.durationHours || 0);

  const split = [
    { name: 'Web', value: stats.webUsersCount, color: 'var(--accent)', icon: Globe, hint: 'Brauzer orqali' },
    { name: 'Telegram', value: stats.tmeUsersCount, color: 'var(--info)', icon: Send, hint: 'MiniApp va bot' },
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Asosiy ko'rsatkichlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Jami kirishlar"
          value={stats.totalVisits.toLocaleString()}
          hint="Barcha vaqt davomida"
          icon={Activity}
          tone="accent"
          spark={monthSpark}
        />
        <KpiCard
          label="Haftalik kirishlar"
          value={stats.weeklyVisits.toLocaleString()}
          hint="Oxirgi 7 kun"
          icon={Calendar}
          tone="info"
          spark={weekSpark}
        />
        <KpiCard
          label="Oylik kirishlar"
          value={stats.monthlyVisits.toLocaleString()}
          hint="Oxirgi 30 kun"
          icon={BarChart3}
          tone="warn"
          spark={monthSpark}
        />
        <KpiCard
          label="Foydalanish vaqti"
          value={String(stats.totalUsageTime)}
          hint={`O'rtacha sessiya: ${stats.avgUsageTime}`}
          icon={Clock}
          tone="accent"
          spark={durSpark}
        />
      </div>

      {/* 2. Grafik + foydalanuvchilar taqsimoti */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 ${CARD} p-6 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-text-0">
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
              <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-accent" />Web</span>
              <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-info" />Telegram</span>
            </div>
          )}

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMetric === 'traffic' ? (
                <AreaChart data={activeChartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gWeb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gTme" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--info)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-2)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-2)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--line)' }} />
                  <Area type="monotone" dataKey="web" name="Web" stroke="var(--accent)" strokeWidth={2.25} fill="url(#gWeb)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="tme" name="Telegram" stroke="var(--info)" strokeWidth={2.25} fill="url(#gTme)" isAnimationActive={false} />
                </AreaChart>
              ) : (
                <BarChart data={activeChartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-2)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-2)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--bg-3)', opacity: 0.5 }}
                    formatter={(value: any) => [`${value} soat`, 'Foydalanish vaqti']}
                  />
                  <Bar dataKey="duration" name="Soat" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={38} isAnimationActive={false} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Foydalanuvchilar taqsimoti */}
        <div className={`${CARD} p-6 flex flex-col`}>
          <div>
            <h3 className="text-base font-semibold text-text-0">Foydalanuvchilar</h3>
            <p className="text-xs text-text-1 mt-0.5">Platformalar bo&apos;yicha taqsimot</p>
          </div>

          <div className="relative h-44 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={split}
                  dataKey="value"
                  innerRadius="68%"
                  outerRadius="92%"
                  paddingAngle={3}
                  stroke="none"
                  cornerRadius={6}
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
              <span className="text-2xl font-bold text-text-0 tabular-nums leading-none">
                {stats.totalUsersCount.toLocaleString()}
              </span>
              <span className="text-[11px] text-text-2 mt-1">jami</span>
            </div>
          </div>

          <div className="space-y-2.5 mt-auto">
            {split.map((s) => {
              const Icon = s.icon;
              const pct = Math.round((s.value / splitTotal) * 100);
              return (
                <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl bg-bg-2 border border-line">
                  <div className="p-2 rounded-lg bg-bg-1 border border-line" style={{ color: s.color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-0">{s.name}</p>
                    <p className="text-[11px] text-text-2">{s.hint}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-0 tabular-nums">{s.value.toLocaleString()}</p>
                    <p className="text-[11px] text-text-2 tabular-nums">{pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Eng ko'p bajarilgan ishlar */}
      {stats.topTasks.length > 0 && (
        <div className={`${CARD} p-6`}>
          <div className="mb-5">
            <h3 className="text-base font-semibold text-text-0">Eng ko&apos;p bajarilgan ishlar</h3>
            <p className="text-xs text-text-1 mt-0.5">Foydalanuvchilar faolligi bo&apos;yicha</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            {stats.topTasks.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-text-0 truncate">{item.task}</span>
                  <span className="text-text-1 tabular-nums shrink-0">
                    <b className="text-accent font-semibold">{item.percentage}%</b>
                    <span className="text-text-2 text-xs"> · {item.count.toLocaleString()}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-bg-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tashrif buyuruvchilar jadvali */}
      <div className={`${CARD} overflow-hidden`}>
        <VisitorsTable />
      </div>

      {/* 5. Ijtimoiy tarmoqlar */}
      <div className={`${CARD} p-6`}>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-text-0">Ijtimoiy tarmoqlar</h3>
          <p className="text-xs text-text-1 mt-0.5">Portfolioda ko&apos;rsatilgan rasmiy havolalar</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {socialItems.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href?.startsWith('mailto:') ? href : withProtocol(href)}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl bg-bg-2 border border-line hover:border-accent-dim/60 flex items-center justify-between text-sm group transition-colors"
            >
              <span className="flex items-center gap-2.5 text-text-1 group-hover:text-accent min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-text-2 group-hover:text-accent shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
