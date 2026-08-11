'use client';

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
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0f172a]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50 glow-emerald-sm">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center justify-center gap-1.5">
            <span>Portfolio Admin</span>
            <span className="text-emerald-400 font-mono">{`{Auth}`}</span>
          </h1>
          <p className="text-xs text-slate-400">Jamshid Xamroyev boshqaruv paneliga kirish</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Admin Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Parol *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-colors disabled:opacity-50 mt-2"
          >
            {submitting ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <span>Tizimga Kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Xavfsiz Token Bilan Himoyalangan (POST /api/auth/login)</span>
        </div>
      </div>
    </div>
  );
};
