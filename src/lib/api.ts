import type {
  AdminOverview,
  ApiErrorBody,
  AuthStatus,
  ContactInput,
  Message,
  Post,
  PostSummary,
  Profile,
  Project,
  SitePayload,
  SiteSettings,
  Skill,
} from "../../shared/types";

export class ApiError extends Error {
  status: number;
  details: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    details: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      credentials: "same-origin",
      headers:
        options.body === undefined
          ? { Accept: "application/json" }
          : {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("网络连接失败，请检查网络后重试。", 0);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const body = data as Partial<ApiErrorBody> | null;
    throw new ApiError(
      body?.error || `请求失败（${response.status}）`,
      response.status,
      body?.details ?? {},
    );
  }

  return data as T;
}

export const api = {
  getSite: () => request<SitePayload>("/api/site"),
  getPost: (slug: string) =>
    request<Post>(`/api/posts/${encodeURIComponent(slug)}`),
  sendContact: (input: ContactInput) =>
    request<{ ok: boolean; message: string }>("/api/contact", {
      method: "POST",
      body: input,
    }),

  auth: {
    status: () => request<AuthStatus>("/api/auth/status"),
    setup: (username: string, password: string) =>
      request<{ ok: boolean; username: string }>("/api/auth/setup", {
        method: "POST",
        body: { username, password },
      }),
    login: (username: string, password: string) =>
      request<{ ok: boolean; username: string }>("/api/auth/login", {
        method: "POST",
        body: { username, password },
      }),
    logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    updateAccount: (input: {
      username: string;
      currentPassword: string;
      newPassword?: string;
    }) =>
      request<{ ok: boolean; username: string; message: string }>(
        "/api/admin/account",
        { method: "PUT", body: input },
      ),
  },

  admin: {
    overview: () => request<AdminOverview>("/api/admin/overview"),
    getProfile: () => request<Profile>("/api/admin/profile"),
    updateProfile: (input: Profile) =>
      request<Profile>("/api/admin/profile", { method: "PUT", body: input }),
    getSettings: () => request<SiteSettings>("/api/admin/settings"),
    updateSettings: (input: SiteSettings) =>
      request<SiteSettings>("/api/admin/settings", {
        method: "PUT",
        body: input,
      }),

    getSkills: () => request<Skill[]>("/api/admin/skills"),
    createSkill: (input: Omit<Skill, "id">) =>
      request<Skill>("/api/admin/skills", { method: "POST", body: input }),
    updateSkill: (id: number, input: Omit<Skill, "id">) =>
      request<Skill>(`/api/admin/skills/${id}`, {
        method: "PUT",
        body: input,
      }),
    deleteSkill: (id: number) =>
      request<{ ok: boolean; message: string }>(`/api/admin/skills/${id}`, {
        method: "DELETE",
      }),

    getProjects: () => request<Project[]>("/api/admin/projects"),
    getProject: (id: number) =>
      request<Project>(`/api/admin/projects/${id}`),
    createProject: (input: ProjectPayload) =>
      request<Project>("/api/admin/projects", {
        method: "POST",
        body: input,
      }),
    updateProject: (id: number, input: ProjectPayload) =>
      request<Project>(`/api/admin/projects/${id}`, {
        method: "PUT",
        body: input,
      }),
    deleteProject: (id: number) =>
      request<{ ok: boolean; message: string }>(`/api/admin/projects/${id}`, {
        method: "DELETE",
      }),

    getPosts: () => request<PostSummary[]>("/api/admin/posts"),
    getPost: (id: number) => request<Post>(`/api/admin/posts/${id}`),
    createPost: (input: PostPayload) =>
      request<Post>("/api/admin/posts", { method: "POST", body: input }),
    updatePost: (id: number, input: PostPayload) =>
      request<Post>(`/api/admin/posts/${id}`, {
        method: "PUT",
        body: input,
      }),
    deletePost: (id: number) =>
      request<{ ok: boolean; message: string }>(`/api/admin/posts/${id}`, {
        method: "DELETE",
      }),

    getMessages: () => request<Message[]>("/api/admin/messages"),
    markAllMessagesRead: () =>
      request<{ ok: boolean; message: string; updated: number }>(
        "/api/admin/messages/read-all",
        { method: "PUT", body: {} },
      ),
    updateMessage: (id: number, isRead: boolean) =>
      request<Message>(`/api/admin/messages/${id}`, {
        method: "PUT",
        body: { isRead },
      }),
    deleteMessage: (id: number) =>
      request<{ ok: boolean; message: string }>(`/api/admin/messages/${id}`, {
        method: "DELETE",
      }),
  },
};

export interface ProjectPayload {
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
}

export interface PostPayload {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  coverUrl: string;
  published: boolean;
  publishedAt?: string | null;
}
