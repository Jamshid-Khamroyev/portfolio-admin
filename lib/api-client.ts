import axios, { AxiosInstance } from 'axios';

// Create configured Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  withCredentials: true,
});

// Response interceptor for seamless error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Tarmoq operatsiyasida xatolik yuz berdi';
    return Promise.reject(new Error(message));
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
    const res = await apiClient.get("/api/blog", { params: { lang } });
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
  getAll: async () => {
    const res = await apiClient.get('/api/chats');
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

export const aiApi = {
  analyze: async (query?: string, timeRange = '1-month') => {
    const res = await apiClient.post('/api/ai', { query, timeRange });
    return res.data;
  },
};
