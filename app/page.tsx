'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { LoginForm } from '@/components/LoginForm';

const UsageDashboard = dynamic(() => import('@/components/UsageDashboard').then((mod) => mod.UsageDashboard), {
  ssr: false,
});
const BlogManager = dynamic(() => import('@/components/BlogManager').then((mod) => mod.BlogManager), {
  ssr: false,
});
const ProjectManager = dynamic(() => import('@/components/ProjectManager').then((mod) => mod.ProjectManager), {
  ssr: false,
});
const ChatLogs = dynamic(() => import('@/components/ChatLogs').then((mod) => mod.ChatLogs), {
  ssr: false,
});

const VisitorDetail = dynamic(() => import('@/components/VisitorDetail').then((mod) => mod.VisitorDetail), {
  ssr: false,
});

const PushSender = dynamic(() => import('@/components/PushSender').then((mod) => mod.PushSender), {
  ssr: false,
});

const emptySubscribe = () => () => {};

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function DashboardInner() {
  const mounted = useMounted();
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabFromUrl && ['using', 'blog', 'projects', 'chats', 'push'].includes(tabFromUrl)
    ? tabFromUrl
    : 'using';

  const visitorId = searchParams.get('visitor');

  const [searchQuery, setSearchQuery] = useState<string>('');

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('visitor');
    params.delete('create');
    router.replace(`?${params.toString()}`);
  };

  /* Tezkor amallar: bo'limga o'tish (ixtiyoriy — "yaratish" oynasini ochish bilan) */
  const openTab = (tab: string, create = false) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('visitor');
    if (create) params.set('create', '1');
    else params.delete('create');
    router.replace(`?${params.toString()}`);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-bg-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-text-2">Admin Panel Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-bg-0 text-text-0 font-sans">
      {/* Chap panel — faqat desktop */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Asosiy kontent */}
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[260px]">
        {!(activeTab === 'using' && visitorId) && (
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <main className="flex-1 pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-12">
          {activeTab === 'using' && (visitorId ? (
            <VisitorDetail visitorId={visitorId} onBack={() => router.back()} />
          ) : (
            <UsageDashboard onNavigate={openTab} />
          ))}
          {activeTab === 'blog' && <BlogManager searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
          {activeTab === 'projects' && <ProjectManager />}
          {activeTab === 'chats' && <ChatLogs />}
          {activeTab === 'push' && <PushSender />}
        </main>
      </div>

      {/* Pastki navigatsiya — faqat mobil */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="min-h-screen bg-bg-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <DashboardInner />
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  );
}
