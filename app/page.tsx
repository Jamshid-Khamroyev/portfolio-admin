'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
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
  const activeTab = tabFromUrl && ['using', 'blog', 'projects', 'chats'].includes(tabFromUrl)
    ? tabFromUrl
    : 'using';

  const [searchQuery, setSearchQuery] = useState<string>('');

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`?${params.toString()}`);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-emerald-400">Admin Panel Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="flex min-h-screen text-slate-100 font-sans">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto pl-64">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 pb-12">
          {activeTab === 'using' && <UsageDashboard />}
          {activeTab === 'blog' && <BlogManager />}
          {activeTab === 'projects' && <ProjectManager />}
          {activeTab === 'chats' && <ChatLogs />}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <DashboardInner />
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  );
}
