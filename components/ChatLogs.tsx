'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Bot, User, Send, Globe, Linkedin, Calendar, Mail } from 'lucide-react';
import { ChatMessage } from '@/lib/data-store';
import { chatsApi } from '@/lib/api-client';
import { useToast } from './Toast';

export const ChatLogs: React.FC = () => {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchChats = async () => {
    setLoading(true);
    try {
      const data = await chatsApi.getAll();
      setChats(data);
    } catch (err: any) {
      showToast('Chatlarni yuklashda xatolik', 'error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    chatsApi.getAll()
      .then((data) => {
        if (!ignore) {
          setChats(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!ignore) {
          showToast('Chatlarni yuklashda xatolik', 'error', err.message);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [showToast]);


  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1310] p-5 rounded-sm border border-[#213028] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-sm bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#eaf2ec] flex items-center gap-2">
              <span>Chat &amp; Muloqot Tarixi</span>
              <span className="text-xs text-[#49f08a] font-mono">{`(${chats.length} ta suhbat)`}</span>
            </h2>
            <p className="text-xs text-[#aab8b0]">Foydalanuvchi xabarlari hamda AI yordamchisining javoblari</p>
          </div>
        </div>

        <button
          onClick={fetchChats}
          className="px-3.5 py-1.5 rounded-sm bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a] hover:bg-[#1f8a52] hover:text-[#eaf2ec] text-xs font-mono font-semibold transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Messages & AI Responses */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-[#131b16] rounded-2xl border border-[#213028]"></div>
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="p-12 text-center bg-[#0d1310] rounded-2xl border border-[#213028]">
          <MessageSquare className="w-12 h-12 text-[#71847a] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#aab8b0]">Xabarlar topilmadi</h3>
          <p className="text-xs text-[#71847a] mt-1">Hozircha tizimda muloqot xabarlari mavjud emas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {chats.map((chat) => {
            const answer =
              chat.answer ||
              "AI yordamchisi tomonidan xabar qabul qilindi va tahlil qilindi.";

            const createdAt = new Date(chat.createdAt).toLocaleString("uz-UZ");

            return (
              <div key={chat.id} className="space-y-3 pt-1">
                {/* User message */}
                <div className="space-y-1.5 border border-[#213028] bg-[#131b16] p-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#eaf2ec]">
                    <User className="h-3.5 w-3.5 text-[#49f08a]" />
                    <span>Foydalanuvchi xabari:</span>
                  </div>

                  <p className="text-xs font-sans leading-relaxed text-[#aab8b0]">
                    {chat.content}
                  </p>
                </div>

                {/* AI response */}
                <div className="space-y-1.5 border border-[#1f8a52]/40 bg-[#182119]/80 p-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#49f08a]">
                    <Bot className="h-3.5 w-3.5" />
                    <span>AI javobi (Google Gemini):</span>
                  </div>

                  <p className="text-xs font-sans leading-relaxed text-[#eaf2ec]">
                    {answer}
                  </p>
                </div>

                {/* Timestamp */}
                <p className="text-end text-xs text-[#71847a]">
                  {createdAt}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
