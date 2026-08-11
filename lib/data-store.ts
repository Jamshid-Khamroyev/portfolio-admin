export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  visible: "PUBLIC" | "PRIVATE";
  lang: 'uz' | 'en' | 'ru';
  coverImage: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title_uz: string;
  title_en: string;
  title_ru: string;
  slug: string;
  description_uz: string;
  description_en?: string;
  description_ru?: string;
  technologies: string[];
  githubUrl: string;
  liveUrl: string;
  visible: "PUBLIC" | "PRIVATE";
  images: ProjectImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectImage {
  id: string;
  imageUrl: string;
  fileId: string;
  projectId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  answer: string;
  createdAt: string;
}

export interface ReviewAnalytics {
  id: string;
  timestamp: string;
  source: 'web' | 't.me' | 'linkedin' | 'github';
  duration: number; // in seconds
  actions: string[];
  userIp?: string;
}

export interface UsageStats {
  totalVisits: number;
  weeklyVisits: number;
  monthlyVisits: number;
  avgUsageTime: string; // e.g., "4m 32s"
  webUsersCount: number;
  tmeUsersCount: number;
  totalUsersCount: number;
  topTasks: { task: string; count: number; percentage: number }[];
  weeklyChart: { day: string; web: number; tme: number; total: number; durationHours?: number }[];
  monthlyChart: { month: string; web: number; tme: number; total: number; durationHours?: number }[];
}

export interface SocialLinks {
  github: string;
  telegram: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  email: string;
  portfolio: string;
}