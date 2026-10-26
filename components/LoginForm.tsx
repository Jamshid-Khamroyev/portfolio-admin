'use client';

import { ThemeToggle } from './ThemeToggle';
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Xatolik', 'error', 'Email va parol kiritilishi shart');
      return;
    }

    setSubmitting(true);
    try {
      const success = await login(email, password);
      if (success) {
        showToast('Xush kelibsiz!', 'success', 'Tizimga muvaffaqiyatli kirildi');
      } else {
        showToast('Xatolik', 'error', 'Email yoki parol noto‘g‘ri');
      }
    } catch (err: any) {
      showToast('Kirishda xatolik', 'error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-0 flex items-center justify-center px-6 py-10 relative overflow-hidden">
      <ThemeToggle className="absolute top-[max(16px,env(safe-area-inset-top))] right-4 z-20" />

      <div className="relative z-10 w-full max-w-[400px] space-y-8">
        {/* Brend sarlavhasi */}
        <div className="text-center space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Jamshid Xamroyev" width={72} height={72} className="mx-auto h-14 w-14 rounded-md" />
          <h1 className="pt-2 font-display text-2xl font-semibold text-text-0 tracking-tight">
            Portfolio Admin
          </h1>
          <p className="text-sm text-text-1">Jamshid Xamroyev boshqaruv paneliga kirish</p>
        </div>

        {/* Forma */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="text-[13px] font-medium text-text-0 block mb-2">
              Admin Email *
            </label>
            <div className="group relative">
              <Mail className="w-[18px] h-[18px] text-text-2 group-focus-within:text-text-0 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="username"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-sm border border-line bg-bg-1 pl-11 pr-4 text-[15px] text-text-0 placeholder:text-text-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="text-[13px] font-medium text-text-0 block mb-2">
              Parol *
            </label>
            <div className="group relative">
              <Lock className="w-[18px] h-[18px] text-text-2 group-focus-within:text-text-0 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-sm border border-line bg-bg-1 pl-11 pr-4 text-[15px] text-text-0 placeholder:text-text-2 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-sm bg-accent hover:opacity-90 text-on-accent text-[15px] font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 !mt-7"
          >
            {submitting ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-on-accent border-t-transparent" />
            ) : (
              <>
                <span>Tizimga Kirish</span>
                <ArrowRight className="w-[18px] h-[18px]" />
              </>
            )}
          </button>
        </form>

        <div className="text-center font-mono text-[11px] text-text-2 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Xavfsiz Token Bilan Himoyalangan (POST /api/auth/login)</span>
        </div>
      </div>
    </div>
  );
};
