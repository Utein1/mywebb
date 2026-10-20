import { Hono } from "hono";
import type { AppEnv } from "../types";
import {
  mapPost,
  mapPostSummary,
  mapProfile,
  mapProject,
  mapSettings,
  mapSkill,
  type PostRow,
  type ProfileRow,
  type ProjectRow,
  type SettingsRow,
  type SkillRow,
} from "../lib/rows";
import { hashIp } from "../lib/auth";
import {
  clientIp,
  errorResponse,
  readJsonBody,
  zodDetails,
} from "../lib/http";
import { contactSchema } from "../lib/validation";
import type { SitePayload } from "../../shared/types";

export const publicRoutes = new Hono<AppEnv>();

publicRoutes.get("/site", async (c) => {
  const [profileResult, settingsResult, skillsResult, projectsResult, postsResult] =
    await c.env.DB.batch([
      c.env.DB.prepare("SELECT * FROM profile WHERE id = 1 LIMIT 1"),
      c.env.DB.prepare("SELECT * FROM settings WHERE id = 1 LIMIT 1"),
      c.env.DB.prepare("SELECT * FROM skills ORDER BY sort_order ASC, id ASC"),
      c.env.DB.prepare(
        `SELECT * FROM projects
         WHERE published = 1
         ORDER BY featured DESC, sort_order ASC, id ASC`,
      ),
      c.env.DB.prepare(
        `SELECT * FROM posts
         WHERE published = 1
         ORDER BY COALESCE(published_at, created_at) DESC, id DESC`,
      ),
    ]);

  const profileRow = (profileResult.results as ProfileRow[])[0];
  const settingsRow = (settingsResult.results as SettingsRow[])[0];
  if (!profileRow || !settingsRow) {
    return errorResponse(c, 500, "站点内容尚未初始化，请检查数据库迁移。");
  }

  const payload: SitePayload = {
    profile: mapProfile(profileRow),
    settings: mapSettings(settingsRow),
    skills: (skillsResult.results as SkillRow[]).map(mapSkill),
    projects: (projectsResult.results as ProjectRow[]).map(mapProject),
    posts: (postsResult.results as PostRow[]).map(mapPostSummary),
  };

  c.header("Cache-Control", "no-store");
  return c.json(payload);
});

publicRoutes.get("/projects", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT * FROM projects
     WHERE published = 1
     ORDER BY featured DESC, sort_order ASC, id ASC`,
  ).all<ProjectRow>();
  c.header("Cache-Control", "no-store");
  return c.json(result.results.map(mapProject));
});

publicRoutes.get("/projects/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE slug = ? AND published = 1 LIMIT 1",
  )
    .bind(slug)
    .first<ProjectRow>();
  if (!row) return errorResponse(c, 404, "项目不存在或尚未发布。");
  c.header("Cache-Control", "no-store");
  return c.json(mapProject(row));
});

publicRoutes.get("/posts", async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT * FROM posts
     WHERE published = 1
     ORDER BY COALESCE(published_at, created_at) DESC, id DESC`,
  ).all<PostRow>();
  c.header("Cache-Control", "no-store");
  return c.json(result.results.map(mapPostSummary));
});

publicRoutes.get("/posts/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = await c.env.DB.prepare(
    "SELECT * FROM posts WHERE slug = ? AND published = 1 LIMIT 1",
  )
    .bind(slug)
    .first<PostRow>();
  if (!row) return errorResponse(c, 404, "文章不存在或尚未发布。");
  c.header("Cache-Control", "no-store");
  return c.json(mapPost(row));
});

publicRoutes.post("/contact", async (c) => {
  const contentLength = Number(c.req.header("Content-Length") ?? 0);
  if (contentLength > 64 * 1024) {
    return errorResponse(c, 413, "留言内容过大。");
  }

  const body = await readJsonBody(c);
  if (body === undefined) {
    return errorResponse(c, 400, "请求格式不正确。");
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      c,
      400,
      "请检查留言内容。",
      zodDetails(parsed.error.issues),
    );
  }

  // Honeypot field: bots fill it, humans never see it.
  if (parsed.data.website) {
    return c.json(
      { ok: true, message: "留言已送达，我会尽快回复。" },
      201,
    );
  }

  const ipHash = await hashIp(clientIp(c));
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM messages WHERE ip_hash = ? AND created_at > ?",
  )
    .bind(ipHash, cutoff)
    .first<{ count: number }>();

  if ((recent?.count ?? 0) >= 3) {
    return errorResponse(c, 429, "留言过于频繁，请稍后再试。");
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `INSERT INTO messages (name, email, subject, body, ip_hash, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
  )
    .bind(
      parsed.data.name,
      parsed.data.email,
      parsed.data.subject,
      parsed.data.message,
      ipHash,
      now,
    )
    .run();

  return c.json(
    { ok: true, message: "留言已送达，我会尽快回复。" },
    201,
  );
});
