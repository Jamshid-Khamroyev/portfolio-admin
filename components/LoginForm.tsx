'use client';

import { ThemeToggle } from './ThemeToggle';
import React, { useState } from 'react';
import { Terminal, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-bg-0 flex items-center justify-center p-4 relative overflow-hidden">
      <ThemeToggle className="absolute top-4 right-4 z-20" />
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-bg-2/90 border border-line rounded-3xl p-8 shadow-sm backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-bg-3 border border-accent/40 text-accent flex items-center justify-center mx-auto shadow-sm shadow-black/10 glow-emerald-sm">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-text-0 tracking-tight flex items-center justify-center gap-1.5">
            <span>Portfolio Admin</span>
            <span className="text-accent font-mono">{`{Auth}`}</span>
          </h1>
          <p className="text-xs text-text-1">Jamshid Xamroyev boshqaruv paneliga kirish</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-text-1 block mb-1">
              Admin Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-2 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-bg-2 border border-line rounded-xl text-xs text-text-0 placeholder-text-2 focus:outline-none focus:border-accent/60 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-text-1 block mb-1">
              Parol *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-2 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-bg-2 border border-line rounded-xl text-xs text-text-0 placeholder-text-2 focus:outline-none focus:border-accent/60 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-accent hover:opacity-90 text-on-accent font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-black/10 transition-colors disabled:opacity-50 mt-2"
          >
            {submitting ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-on-accent border-t-transparent" />
            ) : (
              <>
                <span>Tizimga Kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[10px] text-text-2 font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Xavfsiz Token Bilan Himoyalangan (POST /api/auth/login)</span>
        </div>
      </div>
    </div>
  );
};
