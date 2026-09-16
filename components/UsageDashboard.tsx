'use client';

import React, { useEffect, useState } from 'react';
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
  TrendingUp,
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
} from 'recharts';
import { reviewApi } from '@/lib/api-client';
import { UsageStats, SocialLinks } from '@/lib/data-store';

const DEFAULT_SOCIALS: SocialLinks = {
  github: "https://github.com/Jamshid-Khamroyev",
  telegram: "https://t.me/xamroyev0811",
  linkedin: "www.linkedin.com/in/jamshid-xamroyev-5b108a370",
  instagram: "https://www.instagram.com/jamsh1d0811",
  email: "xamroyevjamshid46@gmail.com",
  portfolio: "https://portfolio-wkv9.vercel.app",
};

export const UsageDashboard: React.FC = () => {
  const [stats, setStats] = useState<UsageStats>();
  const [socials, setSocials] = useState<SocialLinks>(DEFAULT_SOCIALS);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartMode, setChartMode] = useState<'weekly' | 'monthly'>('weekly');
  const [chartMetric, setChartMetric] = useState<'traffic' | 'duration'>('traffic');

  useEffect(() => {
    let ignore = false;
    reviewApi.getAnalytics()
      .then((reviewData) => {
        if (!ignore) {
          if (reviewData?.usage) {
            setStats(reviewData.usage);
          } else if (reviewData?.totalVisits !== undefined) {
            setStats(reviewData);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load usage stats:', err);
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);



  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#131b16] rounded-2xl border border-[#213028]"></div>
          ))}
        </div>
        <div className="h-72 bg-[#131b16] rounded-2xl border border-[#213028]"></div>
      </div>
    );
  }

  const activeChartData =
    chartMode === 'weekly'
      ? stats.weeklyChart.map((item) => ({
          label: item.day,
          web: item.web,
          tme: item.tme,
          total: item.total,
          duration: item.durationHours || 0,
        }))
      : stats.monthlyChart.map((item) => ({
          label: item.month,
          web: item.web,
          tme: item.tme,
          total: item.total,
          duration: item.durationHours || 0,
        }));

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* 1. Main Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className="p-5 rounded-2xl bg-[#0d1310] border border-[#213028] shadow-xl relative overflow-hidden group hover:border-[#1f8a52]/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-[#aab8b0] uppercase tracking-wider">Jami Kirishlar</span>
            <div className="p-2 rounded-lg bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#eaf2ec] font-mono tracking-tight">
            {stats.totalVisits.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-[#49f08a] font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% o&apos;tgan oyga nisbatan</span>
          </div>
        </div>

        {/* Weekly Visits */}
        <div className="p-5 rounded-2xl bg-[#0d1310] border border-[#213028] shadow-xl relative overflow-hidden group hover:border-[#1f8a52]/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-[#aab8b0] uppercase tracking-wider">Haftalik Kirishlar</span>
            <div className="p-2 rounded-lg bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#eaf2ec] font-mono tracking-tight">
            {stats.weeklyVisits.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-[#49f08a] font-mono flex items-center gap-1">
            <span>Oxirgi 7 kunlik faollik</span>
          </div>
        </div>

        {/* Monthly Visits */}
        <div className="p-5 rounded-2xl bg-[#0d1310] border border-[#213028] shadow-xl relative overflow-hidden group hover:border-[#1f8a52]/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-[#aab8b0] uppercase tracking-wider">Oylik Kirishlar</span>
            <div className="p-2 rounded-lg bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a]">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#eaf2ec] font-mono tracking-tight">
            {stats.monthlyVisits.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-[#49f08a] font-mono flex items-center gap-1">
            <span>Oxirgi 30 kunlik umumiy oqim</span>
          </div>
        </div>

        {/* Total & Avg Usage Time */}
        <div className="p-5 rounded-2xl bg-[#0d1310] border border-[#213028] shadow-xl relative overflow-hidden group hover:border-[#1f8a52]/60 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-[#aab8b0] uppercase tracking-wider">Foydalanish Vaqti</span>
            <div className="p-2 rounded-lg bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#49f08a] font-mono tracking-tight">
            {stats.totalUsageTime}
          </div>
          <div className="mt-2 text-[11px] text-[#aab8b0] font-mono flex items-center gap-1">
            <span>O&apos;rtacha sessiya: {stats.avgUsageTime}</span>
          </div>
        </div>
      </div>

      {/* 2. Platform Users Breakdown (Web vs t.me vs Total) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Web Users */}
        <div className="p-5 rounded-2xl bg-[#0d1310] border border-[#213028] flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#aab8b0]">Web Foydalanuvchilar</span>
            <div className="text-xl font-bold text-[#eaf2ec] font-mono mt-1">
              {stats.webUsersCount.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#71847a] mt-0.5">Brauzer orqali tashriflar</p>
          </div>
          <div className="p-3 rounded-xl bg-[#182119] border border-[#213028] text-[#49f08a]">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        {/* Telegram (t.me) Users */}
        <div className="p-5 rounded-2xl bg-[#0d1310] border border-[#213028] flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#aab8b0]">Telegram (t.me) Users</span>
            <div className="text-xl font-bold text-[#49f08a] font-mono mt-1">
              {stats.tmeUsersCount.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#71847a] mt-0.5">MiniApp &amp; Bot foydalanuvchilari</p>
          </div>
          <div className="p-3 rounded-xl bg-[#182119] border border-[#213028] text-[#49f08a]">
            <Send className="w-6 h-6" />
          </div>
        </div>

        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-[#0d1310] border border-[#213028] flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#aab8b0]">Umumiy Foydalanuvchilar</span>
            <div className="text-xl font-bold text-[#49f08a] font-mono mt-1">
              {stats.totalUsersCount.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#71847a] mt-0.5">Yagona ro&apos;yxatdan o&apos;tganlar</p>
          </div>
          <div className="p-3 rounded-xl bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a]">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Recharts Area/Bar Visualization (Kirishlar + Foydalanish Vaqti Grafigi) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interactive Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0d1310] border border-[#213028] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#eaf2ec] flex items-center gap-2">
                <span>{chartMetric === 'traffic' ? 'Kirishlar Oqimi' : 'Foydalanish Vaqti'}</span>
                <span className="text-[#49f08a] font-mono text-xs">{`{Statistikasi}`}</span>
              </h3>
              <p className="text-xs text-[#aab8b0] mt-0.5">
                {chartMetric === 'traffic'
                  ? 'Web va Telegram platformalari bo\'yicha kirishlar grafigi'
                  : 'Foydalanuvchilar umumiy foydalanish vaqti'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Metric Selector: Kirishlar vs Foydalanish Vaqti */}
              <div className="flex items-center gap-1 p-1 bg-[#080b09] rounded-lg border border-[#213028]">
                <button
                  onClick={() => setChartMetric('traffic')}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                    chartMetric === 'traffic'
                      ? 'bg-[#182119] text-[#49f08a] border border-[#1f8a52]/40 font-semibold'
                      : 'text-[#aab8b0] hover:text-[#eaf2ec]'
                  }`}
                >
                  Kirishlar
                </button>
                <button
                  onClick={() => setChartMetric('duration')}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1 transition-colors ${
                    chartMetric === 'duration'
                      ? 'bg-[#182119] text-[#49f08a] border border-[#1f8a52]/40 font-semibold'
                      : 'text-[#aab8b0] hover:text-[#eaf2ec]'
                  }`}
                >
                  <Timer className="w-3 h-3" />
                  <span>Foydalanish Vaqti</span>
                </button>
              </div>

              {/* Range Selector: Haftalik vs Oylik */}
              <div className="flex items-center gap-1 p-1 bg-[#080b09] rounded-lg border border-[#213028]">
                <button
                  onClick={() => setChartMode('weekly')}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                    chartMode === 'weekly'
                      ? 'bg-[#182119] text-[#49f08a] border border-[#1f8a52]/40 font-semibold'
                      : 'text-[#aab8b0] hover:text-[#eaf2ec]'
                  }`}
                >
                  Haftalik
                </button>
                <button
                  onClick={() => setChartMode('monthly')}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                    chartMode === 'monthly'
                      ? 'bg-[#182119] text-[#49f08a] border border-[#1f8a52]/40 font-semibold'
                      : 'text-[#aab8b0] hover:text-[#eaf2ec]'
                  }`}
                >
                  Oylik
                </button>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMetric === 'traffic' ? (
                <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#49f08a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#49f08a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTme" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1f8a52" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1f8a52" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#213028" vertical={false} />
                  <XAxis dataKey="label" stroke="#71847a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71847a" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#080b09',
                      borderColor: '#213028',
                      borderRadius: '0.75rem',
                      color: '#eaf2ec',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="web" name="Web Tashrif" stroke="#49f08a" strokeWidth={2} fillOpacity={1} fill="url(#colorWeb)" />
                  <Area type="monotone" dataKey="tme" name="Telegram (t.me)" stroke="#1f8a52" strokeWidth={2} fillOpacity={1} fill="url(#colorTme)" />
                </AreaChart>
              ) : (
                <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#213028" vertical={false} />
                  <XAxis dataKey="label" stroke="#71847a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71847a" fontSize={11} tickLine={false} unit="s" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#080b09',
                      borderColor: '#213028',
                      borderRadius: '0.75rem',
                      color: '#eaf2ec',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} soat`, 'Foydalanish Vaqti']}
                  />
                  <Bar dataKey="duration" name="Foydalanish Vaqti (soat)" fill="#49f08a" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performed Tasks */}
        <div className="p-6 rounded-2xl bg-[#0d1310] border border-[#213028] shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#eaf2ec]">Eng Ko&apos;p Bajarilgan Ishlar</h3>
            <p className="text-xs text-[#aab8b0] mt-0.5">Foydalanuvchilar faolligi bo&apos;yicha bo&apos;linma</p>
          </div>

          <div className="space-y-4 pt-2">
            {stats.topTasks.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#aab8b0] font-medium truncate">{item.task}</span>
                  <span className="text-[#49f08a] font-mono font-bold">{item.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-[#080b09] rounded-full overflow-hidden p-0.5 border border-[#213028]">
                  <div
                    className="h-full bg-[#49f08a] rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#71847a] font-mono text-right">
                  {item.count.toLocaleString()} marta
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Visitors Table */}
      <div className="rounded-2xl bg-[#0d1310] border border-[#213028] shadow-xl">
        <VisitorsTable />
      </div>

      {/* 5. Social Links Section */}
      <div className="p-6 rounded-2xl bg-[#0d1310] border border-[#213028] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#eaf2ec] flex items-center gap-2">
              <span>Mening Ijtimoiy Tarmoqlarim</span>
              <span className="text-xs text-[#49f08a] font-mono">{`{Socials}`}</span>
            </h3>
            <p className="text-xs text-[#aab8b0] mt-0.5">Portfolioda ko&apos;rsatilgan rasmiy havolalar va aloqa manbalari</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          <a
            href={socials?.github}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-[#080b09] border border-[#213028] hover:border-[#1f8a52]/60 flex items-center justify-between text-xs font-mono group transition-all"
          >
            <div className="flex items-center gap-2.5 text-[#aab8b0] group-hover:text-[#49f08a]">
              <Github className="w-4 h-4 text-[#71847a] group-hover:text-[#49f08a]" />
              <span className="truncate">GitHub Profile</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#71847a] group-hover:text-[#49f08a] shrink-0" />
          </a>

          <a
            href={socials?.telegram}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-[#080b09] border border-[#213028] hover:border-[#1f8a52]/60 flex items-center justify-between text-xs font-mono group transition-all"
          >
            <div className="flex items-center gap-2.5 text-[#aab8b0] group-hover:text-[#49f08a]">
              <Send className="w-4 h-4 text-[#49f08a]" />
              <span className="truncate">Telegram Channel</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#71847a] group-hover:text-[#49f08a] shrink-0" />
          </a>

          <a
            href={socials?.linkedin}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-[#080b09] border border-[#213028] hover:border-[#1f8a52]/60 flex items-center justify-between text-xs font-mono group transition-all"
          >
            <div className="flex items-center gap-2.5 text-[#aab8b0] group-hover:text-[#49f08a]">
              <Linkedin className="w-4 h-4 text-[#49f08a]" />
              <span className="truncate">LinkedIn Profile</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#71847a] group-hover:text-[#49f08a] shrink-0" />
          </a>

          <a
            href={socials?.instagram}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-[#080b09] border border-[#213028] hover:border-[#1f8a52]/60 flex items-center justify-between text-xs font-mono group transition-all"
          >
            <div className="flex items-center gap-2.5 text-[#aab8b0] group-hover:text-[#49f08a]">
              <Instagram className="w-4 h-4 text-[#49f08a]" />
              <span className="truncate">Instagram</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#71847a] group-hover:text-[#49f08a] shrink-0" />
          </a>

          <a
            href={`mailto:${socials?.email || "xamroyevjamshid46@gmail.com"}`}
            className="p-3.5 rounded-xl bg-[#080b09] border border-[#213028] hover:border-[#1f8a52]/60 flex items-center justify-between text-xs font-mono group transition-all"
          >
            <div className="flex items-center gap-2.5 text-[#aab8b0] group-hover:text-[#49f08a]">
              <Mail className="w-4 h-4 text-[#49f08a]" />
              <span className="truncate">{socials?.email || "xamroyevjamshid46@gmail.com"}</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#71847a] group-hover:text-[#49f08a] shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
