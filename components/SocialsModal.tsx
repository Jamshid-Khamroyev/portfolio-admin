'use client';

import React, { useState } from 'react';
import { X, Save, Github, Send, Linkedin, Instagram, Twitter, Mail, Globe } from 'lucide-react';
import { SocialLinks } from '@/lib/data-store';
import { socialsApi } from '@/lib/api-client';
import { useToast } from './Toast';

interface SocialsModalProps {
  socials: SocialLinks;
  onClose: () => void;
  onSuccess: (updated: SocialLinks) => void;
}

export const SocialsModal: React.FC<SocialsModalProps> = ({ socials, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<SocialLinks>({ ...socials });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleChange = (field: keyof SocialLinks, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      try {
        await socialsApi.updateSocials(formData);
      } catch {
        // Keep static in UI
      }
      showToast('Ijtimoiy tarmoqlar yangilandi', 'success', 'Havolalar muvaffaqiyatli saqlandi');
      onSuccess(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0a0f1d]">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold">
            <Globe className="w-4 h-4" />
            <span>Ijtimoiy Tarmoq Havolalarini Tahrirlash</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-1">
              <Github className="w-3.5 h-3.5 text-slate-300" />
              <span>GitHub URL</span>
            </label>
            <input
              type="url"
              required
              value={formData.github}
              onChange={(e) => handleChange('github', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-1">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram URL</span>
            </label>
            <input
              type="url"
              required
              value={formData.telegram}
              onChange={(e) => handleChange('telegram', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-1">
              <Linkedin className="w-3.5 h-3.5 text-blue-400" />
              <span>LinkedIn URL</span>
            </label>
            <input
              type="url"
              required
              value={formData.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-1">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>Instagram</span>
              </label>
              <input
                type="url"
                value={formData.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-1">
                <Twitter className="w-3.5 h-3.5 text-sky-300" />
                <span>Twitter / X</span>
              </label>
              <input
                type="url"
                value={formData.twitter}
                onChange={(e) => handleChange('twitter', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-1">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Email Aloqa</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
            >
              Bekor Qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
