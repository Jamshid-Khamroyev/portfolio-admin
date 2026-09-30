import axios, { AxiosInstance } from 'axios';

// Create configured Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  withCredentials: true,
});

/** Server javobi bo'lmaganda holat kodiga mos tushuntirish */
const STATUS_FALLBACK: Record<number, string> = {
  400: "Yuborilgan ma'lumotda xatolik bor.",
  401: 'Sessiya tugagan. Qaytadan kiring.',
  403: "Bu amal uchun ruxsat yo'q.",
  404: "So'ralgan ma'lumot topilmadi.",
  409: "Bunday yozuv allaqachon mavjud.",
  413: "Ma'lumot hajmi juda katta.",
  429: "So'rovlar juda tez yuborildi. Biroz kutib turing.",
  500: 'Serverda ichki xatolik yuz berdi.',
  502: "Tashqi xizmat javob bermadi. Qaytadan urinib ko'ring.",
  503: 'Server vaqtincha ishlamayapti.',
  504: 'Server javobni kutib ololmadi.',
};

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

/*
  Server xatoliklari `{ message, error, code, details }` shaklida keladi.
  Avval faqat `message` o'qilardi, backend esa `error` yuborardi —
  shuning uchun foydalanuvchi har doim umumiy matnni ko'rardi.
*/
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    const data = error.response?.data;

    const serverMessage =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || data?.details?.message;

    const offline =
      typeof navigator !== 'undefined' && navigator.onLine === false;

    const message =
      serverMessage ||
      (offline ? "Internet aloqasi yo'q." : undefined) ||
      (status ? STATUS_FALLBACK[status] : undefined) ||
      (error.code === 'ECONNABORTED'
        ? 'Server javob bermadi (vaqt tugadi).'
        : undefined) ||
      error.message ||
      'Tarmoq operatsiyasida xatolik yuz berdi';

    /*
      Backend ba'zi xatoliklarda `details.debug` bilan aniq tashxis
      matnini ham yuboradi (qarang: main/lib/api-response.ts, exposeDebug).
      Shu matnni asosiy xabarga qo'shib ko'rsatamiz — "qayerda xato
      bo'layotgani" darhol ko'rinsin uchun, har bir joyda alohida
      o'qishning hojati yo'q.
    */
    const STAGE_LABELS: Record<string, string> = {
      validation: 'Tekshiruv',
      translate: 'Tarjima',
      'slug-check': 'Manzil (slug) tekshiruvi',
      embedding: 'Qidiruv indeksi (embedding)',
      'image-upload': 'Rasm yuklash',
      transaction: 'Bazaga yozish',
    };

    const stage = data?.details?.stage as string | undefined;
    const stageLabel = stage ? STAGE_LABELS[stage] : undefined;

    const debug = data?.details?.debug;
    const withDebug = debug && debug !== message ? `${message} — ${debug}` : message;
    const fullMessage = stageLabel ? `[${stageLabel}] ${withDebug}` : withDebug;

    const apiError: ApiError = new Error(fullMessage);
    apiError.status = status;
    apiError.code = data?.code;
    apiError.details = data?.details;

    return Promise.reject(apiError);
  }
);

export default apiClient;

// Helper API methods
export const authApi = {
  login: async (email: string, pass: string) => {
    const res = await apiClient.post('/api/auth/login', { email, password: pass });
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post('/api/auth/logout');
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/api/auth/me');
    return res.data;
  },
};

export const blogApi = {
  getAll: async (lang?: string) => {
    const res = await apiClient.get("/api/blog", { params: { lang, scope: "admin" } });
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await apiClient.get(`/api/blog/${slug}`);
    return res.data;
  },
  search: async (q: string, lang?: string, limit = 10) => {
    const res = await apiClient.get("/api/blog/search", { params: { q, lang, limit } });
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post("/api/blog", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  createPrivate: async (data: any) => {
    const res = await apiClient.post("/api/blog/private", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.put(`/api/blog/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/api/blog/${id}`);
    return res.data;
  },
  getStats: async (id: string) => {
    const res = await apiClient.get(`/api/blog/${id}/stats`);
    return res.data;
  },
};

export const projectApi = {
  getAll: async (lang?: string, limit?: number) => {
    const res = await apiClient.get("/api/project", { params: { lang, limit } });
    return res.data;
  },
  getBySlug: async (slug: string) => {
    const res = await apiClient.get(`/api/project/${slug}`);
    return res.data;
  },
  search: async (q: string, lang?: string) => {
    const res = await apiClient.get("/api/project/search", { params: { q, lang } });
    return res.data;
  },
  create: async (data: FormData) => {
    const res = await apiClient.post("/api/project", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  update: async (id: string, data: FormData) => {
    const res = await apiClient.put(`/api/project/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/api/project/${id}`);
    return res.data;
  },
};

export const chatsApi = {
  getAll: async (params?: { period?: string; status?: string; limit?: number }) => {
    const res = await apiClient.get('/api/chats', { params });
    return res.data;
  },

  /** olderThan: day | week | month | year | all */
  clear: async (olderThan: string) => {
    const res = await apiClient.delete('/api/chats', {
      params: { older_than: olderThan },
    });
    return res.data;
  },
};

export const reviewApi = {
  getAnalytics: async () => {
    const res = await apiClient.get('/api/stats');
    return res.data;
  },
  sendAnalytics: async (data: any) => {
    const res = await apiClient.post('/api/review', data);
    return res.data;
  },
  getVisitors: async (page = 1, limit = 20) => {
    const res = await apiClient.get('/api/visitors', { params: { page, limit } });
    return res.data;
  },
};

export const socialsApi = {
  getSocials: async () => {
    const res = await apiClient.get('/api/socials');
    return res.data;
  },
  updateSocials: async (data: any) => {
    const res = await apiClient.put('/api/socials', data);
    return res.data;
  },
};

export const pushApi = {
  getStats: async () => {
    const res = await apiClient.get('/api/push/send');
    return res.data;
  },
  send: async (data: { title: string; body?: string; url?: string; image?: string }) => {
    const res = await apiClient.post('/api/push/send', data);
    return res.data;
  },
};

export const aiApi = {
  analyze: async (query?: string, timeRange = '1-month') => {
    const res = await apiClient.post('/api/ai', { query, timeRange });
    return res.data;
  },
};

export const uploadApi = {
  /** Blog matni ichidagi rasmni ImageKit ga yuklaydi */
  image: async (file: File): Promise<{ url: string; fileId: string }> => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await apiClient.post("/api/upload/image", fd);
    return res.data;
  },
  /** Rasmlarni ImageKit dan o'chiradi (mavjud bo'lmaganlari e'tiborsiz qoldiriladi) */
  remove: async (fileIds: string[]): Promise<void> => {
    if (!fileIds.length) return;
    await apiClient.delete('/api/upload/image', { data: { fileIds } });
  },
};
