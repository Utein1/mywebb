export interface SocialLink {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  latinName: string;
  role: string;
  greeting: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  avatarUrl: string;
  availability: string;
  resumeUrl: string;
  currentFocus: string;
  yearsExperience: number;
  socials: SocialLink[];
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  footerText: string;
  accentColor: string;
}

export interface Skill {
  id: number;
  category: string;
  name: string;
  level: number;
  description: string;
  sortOrder: number;
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  coverUrl: string;
  tech: string[];
  demoUrl: string;
  repoUrl: string;
  year: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostSummary {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  coverUrl: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  readingMinutes: number;
}

export interface Post extends PostSummary {
  content: string;
}

export interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface SitePayload {
  profile: Profile;
  settings: SiteSettings;
  skills: Skill[];
  projects: Project[];
  posts: PostSummary[];
}

export interface AuthStatus {
  setupRequired: boolean;
  authenticated: boolean;
  username: string | null;
}

export interface AdminOverview {
  counts: {
    projects: number;
    posts: number;
    publishedPosts: number;
    skills: number;
    unreadMessages: number;
    totalMessages: number;
  };
  recentMessages: Message[];
  recentPosts: PostSummary[];
}

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

export interface ApiErrorBody {
  error: string;
  details?: Record<string, string[]>;
}

export interface ApiMessage {
  ok: boolean;
  message: string;
}
