import { Hono } from "hono";
import type { AppEnv, AdminRow } from "../types";
import {
  createSession,
  destroyCurrentSession,
  fakePasswordCheck,
  findSessionAdmin,
  hashIp,
  hashPassword,
  verifyPassword,
} from "../lib/auth";
import {
  clientIp,
  errorResponse,
  readJsonBody,
  zodDetails,
} from "../lib/http";
import { loginSchema, setupSchema } from "../lib/validation";

export const authRoutes = new Hono<AppEnv>();

const LOGIN_IP_WINDOW_MINUTES = 15;
const LOGIN_IP_LIMIT = 20;
const ACCOUNT_LOCK_THRESHOLD = 8;
const ACCOUNT_LOCK_MINUTES = 15;

authRoutes.get("/status", async (c) => {
  const countRow = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM admins",
  ).first<{ count: number }>();
  const admin = await findSessionAdmin(c);
  c.header("Cache-Control", "no-store");
  return c.json({
    setupRequired: (countRow?.count ?? 0) === 0,
    authenticated: Boolean(admin),
    username: admin?.username ?? null,
  });
});

authRoutes.post("/setup", async (c) => {
  const countRow = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM admins",
  ).first<{ count: number }>();
  if ((countRow?.count ?? 0) > 0) {
    return errorResponse(c, 409, "管理员已初始化，请直接登录。");
  }

  const body = await readJsonBody(c);
  if (body === undefined) {
    return errorResponse(c, 400, "请求格式不正确。");
  }
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      c,
      400,
      "请检查账号信息。",
      zodDetails(parsed.error.issues),
    );
  }

  const password = await hashPassword(parsed.data.password);
  const now = new Date().toISOString();

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO admins
        (username, password_hash, salt, failed_attempts, locked_until, created_at, updated_at)
       VALUES (?, ?, ?, 0, NULL, ?, ?)`,
    )
      .bind(
        parsed.data.username,
        password.hash,
        password.salt,
        now,
        now,
      )
      .run();

    const adminId = result.meta.last_row_id;
    if (!adminId) {
      return errorResponse(c, 500, "管理员创建失败，请重试。");
    }
    await createSession(c, adminId);
    return c.json(
      { ok: true, username: parsed.data.username },
      201,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      /UNIQUE constraint failed/i.test(error.message)
    ) {
      return errorResponse(c, 409, "管理员已初始化，请直接登录。");
    }
    throw error;
  }
});

authRoutes.post("/login", async (c) => {
  const body = await readJsonBody(c);
  if (body === undefined) {
    return errorResponse(c, 400, "请求格式不正确。");
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      c,
      400,
      "请输入用户名和密码。",
      zodDetails(parsed.error.issues),
    );
  }

  const ipHash = await hashIp(clientIp(c));
  const ipCutoff = new Date(
    Date.now() - LOGIN_IP_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();
  const attemptRow = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM login_attempts WHERE ip = ? AND created_at > ?",
  )
    .bind(ipHash, ipCutoff)
    .first<{ count: number }>();

  if ((attemptRow?.count ?? 0) >= LOGIN_IP_LIMIT) {
    c.header("Retry-After", String(LOGIN_IP_WINDOW_MINUTES * 60));
    return errorResponse(
      c,
      429,
      "登录尝试过于频繁，请稍后再试。",
    );
  }

  const admin = await c.env.DB.prepare(
    "SELECT * FROM admins WHERE username = ? LIMIT 1",
  )
    .bind(parsed.data.username)
    .first<AdminRow>();

  if (!admin) {
    await fakePasswordCheck(parsed.data.password);
    await recordFailedLogin(c.env.DB, ipHash);
    return errorResponse(c, 401, "用户名或密码不正确。");
  }

  if (
    admin.locked_until &&
    new Date(admin.locked_until).getTime() > Date.now()
  ) {
    c.header("Retry-After", String(ACCOUNT_LOCK_MINUTES * 60));
    return errorResponse(
      c,
      429,
      "尝试次数过多，账号已暂时锁定，请稍后再试。",
    );
  }

  const valid = await verifyPassword(
    parsed.data.password,
    admin.salt,
    admin.password_hash,
  );

  if (!valid) {
    const nextAttempts = admin.failed_attempts + 1;
    const lockedUntil =
      nextAttempts >= ACCOUNT_LOCK_THRESHOLD
        ? new Date(
            Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000,
          ).toISOString()
        : null;
    const now = new Date().toISOString();
    await c.env.DB.batch([
      c.env.DB.prepare(
        "UPDATE admins SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?",
      ).bind(nextAttempts, lockedUntil, now, admin.id),
      c.env.DB.prepare(
        "INSERT INTO login_attempts (ip, created_at) VALUES (?, ?)",
      ).bind(ipHash, now),
      c.env.DB.prepare(
        "DELETE FROM login_attempts WHERE created_at <= ?",
      ).bind(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    if (lockedUntil) {
      c.header("Retry-After", String(ACCOUNT_LOCK_MINUTES * 60));
      return errorResponse(
        c,
        429,
        "尝试次数过多，账号已暂时锁定，请稍后再试。",
      );
    }
    return errorResponse(c, 401, "用户名或密码不正确。");
  }

  const now = new Date().toISOString();
  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE admins SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?",
    ).bind(now, admin.id),
    c.env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ipHash),
  ]);
  await createSession(c, admin.id);
  return c.json({ ok: true, username: admin.username });
});

authRoutes.post("/logout", async (c) => {
  await destroyCurrentSession(c);
  return c.json({ ok: true });
});

async function recordFailedLogin(db: D1Database, ipHash: string) {
  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare("INSERT INTO login_attempts (ip, created_at) VALUES (?, ?)")
      .bind(ipHash, now),
    db
      .prepare("DELETE FROM login_attempts WHERE created_at <= ?")
      .bind(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);
}
