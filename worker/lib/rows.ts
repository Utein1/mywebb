import type {
  Message,
  Post,
  PostSummary,
  Profile,
  Project,
  SiteSettings,
  Skill,
  SocialLink,
} from "../../shared/types";

export interface ProfileRow {
  id: number;
  name: string;
  latin_name: string;
  role: string;
  greeting: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  avatar_url: string;
  availability: string;
  resume_url: string;
  current_focus: string;
  years_experience: number;
  socials: string;
  updated_at: string;
}

export interface SettingsRow {
  id: number;
  site_title: string;
  site_description: string;
  footer_text: string;
  accent_color: string;
  updated_at: string;
}

export interface SkillRow {
  id: number;
  category: string;
  name: string;
  level: number;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface ProjectRow {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  cover_url: string;
  tech: string;
  demo_url: string;
  repo_url: string;
  year: string;
  featured: number;
  published: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PostRow {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string;
  cover_url: string;
  published: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  ip_hash: string;
  is_read: number;
  created_at: string;
}

export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function parseSocials(value: unknown): SocialLink[] {
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is SocialLink =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as SocialLink).label === "string" &&
          typeof (item as SocialLink).url === "string",
      )
      .map((item) => ({ label: item.label, url: item.url }));
  } catch {
    return [];
  }
}

export function readingMinutes(content: string): number {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~[\]()!-]/g, " ")
    .replace(/\s+/g, "");
  return Math.max(1, Math.min(60, Math.ceil(plain.length / 400)));
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    name: row.name,
    latinName: row.latin_name,
    role: row.role,
    greeting: row.greeting,
    tagline: row.tagline,
    bio: row.bio,
    location: row.location,
    email: row.email,
    avatarUrl: row.avatar_url,
    availability: row.availability,
    resumeUrl: row.resume_url,
    currentFocus: row.current_focus,
    yearsExperience: row.years_experience,
    socials: parseSocials(row.socials),
  };
}

export function mapSettings(row: SettingsRow): SiteSettings {
  return {
    siteTitle: row.site_title,
    siteDescription: row.site_description,
    footerText: row.footer_text,
    accentColor: row.accent_color,
  };
}

export function mapSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    level: row.level,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    coverUrl: row.cover_url,
    tech: parseStringArray(row.tech),
    demoUrl: row.demo_url,
    repoUrl: row.repo_url,
    year: row.year,
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPostSummary(row: PostRow): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    tags: parseStringArray(row.tags),
    coverUrl: row.cover_url,
    published: Boolean(row.published),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    readingMinutes: readingMinutes(row.content),
  };
}

export function mapPost(row: PostRow): Post {
  return {
    ...mapPostSummary(row),
    content: row.content,
  };
}

export function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    body: row.body,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}
