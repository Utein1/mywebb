import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import type { AdminOverview } from "../../shared/types";
import type { AppEnv, AdminRow } from "../types";
import {
  hashPassword,
  requireAdmin,
  verifyPassword,
} from "../lib/auth";
import {
  errorResponse,
  excerptFromMarkdown,
  isUniqueConstraintError,
  readJsonBody,
  safeTimestamp,
  zodDetails,
} from "../lib/http";
import {
  mapMessage,
  mapPost,
  mapPostSummary,
  mapProfile,
  mapProject,
  mapSettings,
  mapSkill,
  type MessageRow,
  type PostRow,
  type ProfileRow,
  type ProjectRow,
  type SettingsRow,
  type SkillRow,
} from "../lib/rows";
import {
  accountSchema,
  idSchema,
  messageReadSchema,
  postInputSchema,
  profileUpdateSchema,
  projectInputSchema,
  settingsUpdateSchema,
  skillInputSchema,
} from "../lib/validation";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", requireAdmin);

async function validated<S extends z.ZodType>(
  c: Context<AppEnv>,
  schema: S,
): Promise<z.output<S> | Response> {
  const body = await readJsonBody(c);
  if (body === undefined) {
    return errorResponse(c, 400, "请求格式不正确。");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      c,
      400,
      "请检查提交的内容。",
      zodDetails(parsed.error.issues),
    );
  }
  return parsed.data;
}

function routeId(c: Context<AppEnv>): number | Response {
  const parsed = idSchema.safeParse(c.req.param("id"));
  if (!parsed.success) {
    return errorResponse(c, 400, "无效的内容 ID。");
  }
  return parsed.data;
}

function makeSlug(value: string, prefix: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

adminRoutes.get("/overview", async (c) => {
  const [countsResult, messagesResult, postsResult] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT
        (SELECT COUNT(*) FROM projects) AS projects,
        (SELECT COUNT(*) FROM posts) AS posts,
        (SELECT COUNT(*) FROM posts WHERE published = 1) AS published_posts,
        (SELECT COUNT(*) FROM skills) AS skills,
        (SELECT COUNT(*) FROM messages WHERE is_read = 0) AS unread_messages,
        (SELECT COUNT(*) FROM messages) AS total_messages`,
    ),
    c.env.DB.prepare(
      "SELECT * FROM messages ORDER BY created_at DESC, id DESC LIMIT 3",
    ),
    c.env.DB.prepare(
      "SELECT * FROM posts ORDER BY updated_at DESC, id DESC LIMIT 3",
    ),
  ]);

  const counts = (countsResult.results as Array<Record<string, number>>)[0] ?? {};
  const overview: AdminOverview = {
    counts: {
      projects: Number(counts.projects ?? 0),
      posts: Number(counts.posts ?? 0),
      publishedPosts: Number(counts.published_posts ?? 0),
      skills: Number(counts.skills ?? 0),
      unreadMessages: Number(counts.unread_messages ?? 0),
      totalMessages: Number(counts.total_messages ?? 0),
    },
    recentMessages: (messagesResult.results as MessageRow[]).map(mapMessage),
    recentPosts: (postsResult.results as PostRow[]).map(mapPostSummary),
  };
  return c.json(overview);
});

adminRoutes.get("/profile", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT * FROM profile WHERE id = 1 LIMIT 1",
  ).first<ProfileRow>();
  if (!row) return errorResponse(c, 404, "个人资料尚未初始化。");
  return c.json(mapProfile(row));
});

adminRoutes.put("/profile", async (c) => {
  const data = await validated(c, profileUpdateSchema);
  if (data instanceof Response) return data;

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE profile SET
      name = ?, latin_name = ?, role = ?, greeting = ?, tagline = ?, bio = ?,
      location = ?, email = ?, avatar_url = ?, availability = ?, resume_url = ?,
      current_focus = ?, years_experience = ?, socials = ?, updated_at = ?
     WHERE id = 1`,
  )
    .bind(
      data.name,
      data.latinName,
      data.role,
      data.greeting,
      data.tagline,
      data.bio,
      data.location,
      data.email,
      data.avatarUrl,
      data.availability,
      data.resumeUrl,
      data.currentFocus,
      data.yearsExperience,
      JSON.stringify(data.socials),
      now,
    )
    .run();

  const row = await c.env.DB.prepare(
    "SELECT * FROM profile WHERE id = 1 LIMIT 1",
  ).first<ProfileRow>();
  if (!row) return errorResponse(c, 500, "保存失败，请稍后重试。");
  return c.json(mapProfile(row));
});

adminRoutes.get("/settings", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT * FROM settings WHERE id = 1 LIMIT 1",
  ).first<SettingsRow>();
  if (!row) return errorResponse(c, 404, "站点设置尚未初始化。");
  return c.json(mapSettings(row));
});

adminRoutes.put("/settings", async (c) => {
  const data = await validated(c, settingsUpdateSchema);
  if (data instanceof Response) return data;

  await c.env.DB.prepare(
    `UPDATE settings SET
      site_title = ?, site_description = ?, footer_text = ?, accent_color = ?, updated_at = ?
     WHERE id = 1`,
  )
    .bind(
      data.siteTitle,
      data.siteDescription,
      data.footerText,
      data.accentColor,
      new Date().toISOString(),
    )
    .run();

  const row = await c.env.DB.prepare(
    "SELECT * FROM settings WHERE id = 1 LIMIT 1",
  ).first<SettingsRow>();
  if (!row) return errorResponse(c, 500, "保存失败，请稍后重试。");
  return c.json(mapSettings(row));
});

adminRoutes.get("/skills", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM skills ORDER BY sort_order ASC, id ASC",
  ).all<SkillRow>();
  return c.json(result.results.map(mapSkill));
});

adminRoutes.post("/skills", async (c) => {
  const data = await validated(c, skillInputSchema);
  if (data instanceof Response) return data;

  let sortOrder = data.sortOrder;
  if (sortOrder === undefined) {
    const row = await c.env.DB.prepare(
      "SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM skills",
    ).first<{ max_order: number }>();
    sortOrder = Number(row?.max_order ?? 0) + 10;
  }

  const now = new Date().toISOString();
  const result = await c.env.DB.prepare(
    `INSERT INTO skills (category, name, level, description, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      data.category,
      data.name,
      data.level,
      data.description,
      sortOrder,
      now,
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM skills WHERE id = ?")
    .bind(result.meta.last_row_id)
    .first<SkillRow>();
  if (!row) return errorResponse(c, 500, "技能创建失败。");
  return c.json(mapSkill(row), 201);
});

adminRoutes.put("/skills/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const data = await validated(c, skillInputSchema);
  if (data instanceof Response) return data;

  const existing = await c.env.DB.prepare(
    "SELECT * FROM skills WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<SkillRow>();
  if (!existing) return errorResponse(c, 404, "技能不存在。");

  await c.env.DB.prepare(
    `UPDATE skills SET category = ?, name = ?, level = ?, description = ?, sort_order = ?
     WHERE id = ?`,
  )
    .bind(
      data.category,
      data.name,
      data.level,
      data.description,
      data.sortOrder ?? existing.sort_order,
      id,
    )
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM skills WHERE id = ?")
    .bind(id)
    .first<SkillRow>();
  if (!row) return errorResponse(c, 500, "技能保存失败。");
  return c.json(mapSkill(row));
});

adminRoutes.delete("/skills/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const result = await c.env.DB.prepare("DELETE FROM skills WHERE id = ?")
    .bind(id)
    .run();
  if (result.meta.changes === 0) {
    return errorResponse(c, 404, "技能不存在。");
  }
  return c.json({ ok: true, message: "技能已删除。" });
});

adminRoutes.get("/projects", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM projects ORDER BY sort_order ASC, id ASC",
  ).all<ProjectRow>();
  return c.json(result.results.map(mapProject));
});

adminRoutes.get("/projects/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const row = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<ProjectRow>();
  if (!row) return errorResponse(c, 404, "项目不存在。");
  return c.json(mapProject(row));
});

adminRoutes.post("/projects", async (c) => {
  const data = await validated(c, projectInputSchema);
  if (data instanceof Response) return data;

  const now = new Date().toISOString();
  const slug = makeSlug(data.slug || data.title, "project");

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO projects
        (slug, title, summary, description, cover_url, tech, demo_url, repo_url,
         year, featured, published, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        slug,
        data.title,
        data.summary,
        data.description,
        data.coverUrl,
        JSON.stringify(data.tech),
        data.demoUrl,
        data.repoUrl,
        data.year,
        data.featured ? 1 : 0,
        data.published ? 1 : 0,
        data.sortOrder,
        now,
        now,
      )
      .run();

    const row = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first<ProjectRow>();
    if (!row) return errorResponse(c, 500, "项目创建失败。");
    return c.json(mapProject(row), 201);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return errorResponse(c, 409, "该链接标识（slug）已被使用，请换一个。");
    }
    throw error;
  }
});

adminRoutes.put("/projects/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const data = await validated(c, projectInputSchema);
  if (data instanceof Response) return data;

  const existing = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<ProjectRow>();
  if (!existing) return errorResponse(c, 404, "项目不存在。");

  const slug = data.slug
    ? makeSlug(data.slug, "project")
    : existing.slug;

  try {
    await c.env.DB.prepare(
      `UPDATE projects SET
        slug = ?, title = ?, summary = ?, description = ?, cover_url = ?, tech = ?,
        demo_url = ?, repo_url = ?, year = ?, featured = ?, published = ?,
        sort_order = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(
        slug,
        data.title,
        data.summary,
        data.description,
        data.coverUrl,
        JSON.stringify(data.tech),
        data.demoUrl,
        data.repoUrl,
        data.year,
        data.featured ? 1 : 0,
        data.published ? 1 : 0,
        data.sortOrder,
        new Date().toISOString(),
        id,
      )
      .run();

    const row = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(id)
      .first<ProjectRow>();
    if (!row) return errorResponse(c, 500, "项目保存失败。");
    return c.json(mapProject(row));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return errorResponse(c, 409, "该链接标识（slug）已被使用，请换一个。");
    }
    throw error;
  }
});

adminRoutes.delete("/projects/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const result = await c.env.DB.prepare("DELETE FROM projects WHERE id = ?")
    .bind(id)
    .run();
  if (result.meta.changes === 0) {
    return errorResponse(c, 404, "项目不存在。");
  }
  return c.json({ ok: true, message: "项目已删除。" });
});

adminRoutes.get("/posts", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM posts ORDER BY updated_at DESC, id DESC",
  ).all<PostRow>();
  return c.json(result.results.map(mapPostSummary));
});

adminRoutes.get("/posts/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const row = await c.env.DB.prepare(
    "SELECT * FROM posts WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<PostRow>();
  if (!row) return errorResponse(c, 404, "文章不存在。");
  return c.json(mapPost(row));
});

adminRoutes.post("/posts", async (c) => {
  const data = await validated(c, postInputSchema);
  if (data instanceof Response) return data;

  const now = new Date().toISOString();
  const slug = makeSlug(data.slug || data.title, "post");
  const rawPublishedAt = data.publishedAt?.trim() ?? "";
  let publishedAt = rawPublishedAt ? safeTimestamp(rawPublishedAt) : null;
  if (rawPublishedAt && !publishedAt) {
    return errorResponse(c, 400, "发布时间格式无效。");
  }
  if (data.published && !publishedAt) publishedAt = now;
  const excerpt = data.excerpt || excerptFromMarkdown(data.content);

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO posts
        (slug, title, excerpt, content, tags, cover_url, published, published_at,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        slug,
        data.title,
        excerpt,
        data.content,
        JSON.stringify(data.tags),
        data.coverUrl,
        data.published ? 1 : 0,
        publishedAt,
        now,
        now,
      )
      .run();

    const row = await c.env.DB.prepare("SELECT * FROM posts WHERE id = ?")
      .bind(result.meta.last_row_id)
      .first<PostRow>();
    if (!row) return errorResponse(c, 500, "文章创建失败。");
    return c.json(mapPost(row), 201);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return errorResponse(c, 409, "该文章链接标识（slug）已被使用，请换一个。");
    }
    throw error;
  }
});

adminRoutes.put("/posts/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const data = await validated(c, postInputSchema);
  if (data instanceof Response) return data;

  const existing = await c.env.DB.prepare(
    "SELECT * FROM posts WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<PostRow>();
  if (!existing) return errorResponse(c, 404, "文章不存在。");

  const slug = data.slug ? makeSlug(data.slug, "post") : existing.slug;
  let publishedAt =
    data.publishedAt === undefined ? existing.published_at : null;
  if (data.publishedAt !== undefined && data.publishedAt !== null) {
    const raw = data.publishedAt.trim();
    if (raw) {
      publishedAt = safeTimestamp(raw);
      if (!publishedAt) {
        return errorResponse(c, 400, "发布时间格式无效。");
      }
    }
  }
  if (data.published && !publishedAt) {
    publishedAt = new Date().toISOString();
  }
  const excerpt = data.excerpt || excerptFromMarkdown(data.content);

  try {
    await c.env.DB.prepare(
      `UPDATE posts SET
        slug = ?, title = ?, excerpt = ?, content = ?, tags = ?, cover_url = ?,
        published = ?, published_at = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(
        slug,
        data.title,
        excerpt,
        data.content,
        JSON.stringify(data.tags),
        data.coverUrl,
        data.published ? 1 : 0,
        publishedAt,
        new Date().toISOString(),
        id,
      )
      .run();

    const row = await c.env.DB.prepare("SELECT * FROM posts WHERE id = ?")
      .bind(id)
      .first<PostRow>();
    if (!row) return errorResponse(c, 500, "文章保存失败。");
    return c.json(mapPost(row));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return errorResponse(c, 409, "该文章链接标识（slug）已被使用，请换一个。");
    }
    throw error;
  }
});

adminRoutes.delete("/posts/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const result = await c.env.DB.prepare("DELETE FROM posts WHERE id = ?")
    .bind(id)
    .run();
  if (result.meta.changes === 0) {
    return errorResponse(c, 404, "文章不存在。");
  }
  return c.json({ ok: true, message: "文章已删除。" });
});

adminRoutes.get("/messages", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM messages ORDER BY created_at DESC, id DESC LIMIT 200",
  ).all<MessageRow>();
  return c.json(result.results.map(mapMessage));
});

adminRoutes.put("/messages/read-all", async (c) => {
  const result = await c.env.DB.prepare(
    "UPDATE messages SET is_read = 1 WHERE is_read = 0",
  ).run();
  return c.json({
    ok: true,
    message: "所有留言已标记为已读。",
    updated: result.meta.changes,
  });
});

adminRoutes.put("/messages/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const data = await validated(c, messageReadSchema);
  if (data instanceof Response) return data;

  const result = await c.env.DB.prepare(
    "UPDATE messages SET is_read = ? WHERE id = ?",
  )
    .bind(data.isRead ? 1 : 0, id)
    .run();
  if (result.meta.changes === 0) {
    return errorResponse(c, 404, "留言不存在。");
  }
  const row = await c.env.DB.prepare("SELECT * FROM messages WHERE id = ?")
    .bind(id)
    .first<MessageRow>();
  if (!row) return errorResponse(c, 404, "留言不存在。");
  return c.json(mapMessage(row));
});

adminRoutes.delete("/messages/:id", async (c) => {
  const id = routeId(c);
  if (id instanceof Response) return id;
  const result = await c.env.DB.prepare("DELETE FROM messages WHERE id = ?")
    .bind(id)
    .run();
  if (result.meta.changes === 0) {
    return errorResponse(c, 404, "留言不存在。");
  }
  return c.json({ ok: true, message: "留言已删除。" });
});

adminRoutes.put("/account", async (c) => {
  const admin = c.get("admin");
  const data = await validated(c, accountSchema);
  if (data instanceof Response) return data;

  const valid = await verifyPassword(
    data.currentPassword,
    admin.salt,
    admin.password_hash,
  );
  if (!valid) {
    return errorResponse(c, 400, "当前密码不正确。");
  }

  const now = new Date().toISOString();

  try {
    if (data.newPassword) {
      const password = await hashPassword(data.newPassword);
      await c.env.DB.batch([
        c.env.DB.prepare(
          `UPDATE admins SET username = ?, password_hash = ?, salt = ?,
            failed_attempts = 0, locked_until = NULL, updated_at = ?
           WHERE id = ?`,
        ).bind(
          data.username,
          password.hash,
          password.salt,
          now,
          admin.id,
        ),
        c.env.DB.prepare(
          "DELETE FROM sessions WHERE admin_id = ? AND token_hash != ?",
        ).bind(admin.id, admin.session_token_hash),
      ]);
    } else {
      await c.env.DB.prepare(
        `UPDATE admins SET username = ?, failed_attempts = 0,
          locked_until = NULL, updated_at = ? WHERE id = ?`,
      )
        .bind(data.username, now, admin.id)
        .run();
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return errorResponse(c, 409, "该用户名已被使用。");
    }
    throw error;
  }

  const refreshed = await c.env.DB.prepare(
    "SELECT id, username FROM admins WHERE id = ?",
  )
    .bind(admin.id)
    .first<Pick<AdminRow, "id" | "username">>();

  return c.json({
    ok: true,
    username: refreshed?.username ?? data.username,
    message: data.newPassword
      ? "账号信息已更新，其他设备上的登录已退出。"
      : "账号信息已更新。",
  });
});
