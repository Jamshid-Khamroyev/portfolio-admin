import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Bot, User } from 'lucide-react';
import { ChatMessage } from '@/lib/data-store';
import { useToast } from './Toast';
import { uz } from 'date-fns/locale';
import { format } from 'date-fns';
import apiClient from '@/lib/api-client';

export const ChatLogs: React.FC = () => {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<
    'day' | 'week' | 'month' | 'year' | 'last_week' | 'last_month'
  >('week');
  const { showToast } = useToast();

  const fetchChats = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/chats?period=${encodeURIComponent(period)}`);
      setChats(data.reverse());
    } catch (err: any) {
      showToast('Chatlarni yuklashda xatolik', 'error', err?.message ?? String(err));
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChats(controller.signal);
    return () => controller.abort();
  }, [period, showToast]);

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

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#aab8b0] mr-2">Period:</label>
          <select
            value={period}
            onChange={(e) =>
              setPeriod(
                e.target.value as 'day' | 'week' | 'month' | 'year' | 'last_week' | 'last_month'
              )
            }
            className="bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a] py-1 px-2 text-xs rounded-sm"
          >
            <option value="day">Oxirgi 24 soat (day)</option>
            <option value="week">Oxirgi 7 kun (week)</option>
            <option value="month">Oxirgi 30 kun (month)</option>
            <option value="year">Oxirgi yil (year)</option>
            <option value="last_week">O&apos;tgan to&apos;liq hafta (last_week)</option>
            <option value="last_month">O&apos;tgan to&apos;liq oy (last_month)</option>
          </select>

          <button
            onClick={() => fetchChats()}
            className="px-3.5 py-1.5 rounded-sm bg-[#182119] border border-[#1f8a52]/40 text-[#49f08a] hover:bg-[#1f8a52] hover:text-[#eaf2ec] text-xs font-mono font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yangilash</span>
          </button>
        </div>
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
          <p className="text-xs text-[#71847a] mt-1">Tanlangan period uchun muloqot xabarlari mavjud emas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {chats.map((chat) => {
            const answer = chat.answer || 'AI yordamchisi tomonidan xabar qabul qilindi va tahlil qilindi.';

            // Ensure we don't mutate the original date by creating a new Date instance
            const createdAt = format(new Date(chat.createdAt), 'd MMMM yyyy, HH:mm', { locale: uz });

            return (
              <div key={chat.id} className="rounded-sm border border-[#26352c] bg-[#151d18] p-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* User question */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-[#49f08a]" />
                      <span className="text-xs font-medium text-[#8fa99a]">Foydalanuvchi</span>
                    </div>

                    <p className="text-sm leading-6 text-[#eaf2ec]">{chat.content}</p>
                  </div>

                  {/* AI answer */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Bot className="h-4 w-4 text-[#49f08a]" />
                      <span className="text-xs font-medium text-[#49f08a]">AI yordamchi</span>
                    </div>

                    <p className="text-sm leading-6 text-[#d8e3dc]">{answer}</p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="border-t border-[#26352c] p-1 m-1 text-right">
                  <span className="text-[11px] text-[#71847a]">{createdAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};