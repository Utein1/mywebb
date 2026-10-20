import { createMiddleware } from "hono/factory";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import type { AppEnv, SessionAdmin } from "../types";

export const SESSION_COOKIE = "orbit_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const PASSWORD_ITERATIONS = 50_000;
const PBKDF2_HASH = "SHA-256";
const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function derivePassword(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: PBKDF2_HASH,
      salt,
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<{
  hash: string;
  salt: string;
}> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePassword(password, salt);
  return {
    hash: bytesToBase64(derived),
    salt: bytesToBase64(salt),
  };
}

export async function verifyPassword(
  password: string,
  saltBase64: string,
  hashBase64: string,
): Promise<boolean> {
  try {
    const salt = base64ToBytes(saltBase64);
    const expected = base64ToBytes(hashBase64);
    const actual = await derivePassword(password, salt);
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let i = 0; i < actual.length; i += 1) {
      difference |= actual[i] ^ expected[i];
    }
    return difference === 0;
  } catch {
    return false;
  }
}

/**
 * Perform the same expensive derivation for unknown usernames so login timing
 * does not reveal whether an account exists.
 */
export async function fakePasswordCheck(password: string): Promise<void> {
  await verifyPassword(
    password,
    "AAAAAAAAAAAAAAAAAAAAAA==",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  );
}

async function sha256Text(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function hashIp(value: string): Promise<string> {
  return (await sha256Text(`orbit-ip:${value}`)).slice(0, 32);
}

export async function createSession(
  c: Context<AppEnv>,
  adminId: number,
): Promise<void> {
  const rawToken = bytesToBase64Url(
    crypto.getRandomValues(new Uint8Array(32)),
  );
  const tokenHash = await sha256Text(rawToken);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_TTL_SECONDS * 1000,
  ).toISOString();

  await c.env.DB.batch([
    c.env.DB.prepare(
      "DELETE FROM sessions WHERE expires_at <= ? OR admin_id = ?",
    ).bind(now.toISOString(), adminId),
    c.env.DB.prepare(
      "INSERT INTO sessions (token_hash, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    ).bind(tokenHash, adminId, expiresAt, now.toISOString()),
  ]);

  setCookie(c, SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyCurrentSession(
  c: Context<AppEnv>,
): Promise<void> {
  const rawToken = getCookie(c, SESSION_COOKIE);
  if (rawToken) {
    const tokenHash = await sha256Text(rawToken);
    await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }
  deleteCookie(c, SESSION_COOKIE, {
    path: "/",
    secure: new URL(c.req.url).protocol === "https:",
  });
}

export async function findSessionAdmin(
  c: Context<AppEnv>,
): Promise<SessionAdmin | null> {
  const rawToken = getCookie(c, SESSION_COOKIE);
  if (!rawToken || rawToken.length < 32 || rawToken.length > 100) return null;
  const tokenHash = await sha256Text(rawToken);
  const row = await c.env.DB.prepare(
    `SELECT a.*, s.token_hash AS session_token_hash, s.expires_at AS session_expires_at
     FROM sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = ? AND s.expires_at > ?
     LIMIT 1`,
  )
    .bind(tokenHash, new Date().toISOString())
    .first<SessionAdmin>();
  return row ?? null;
}

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const admin = await findSessionAdmin(c);
  if (!admin) {
    return c.json({ error: "登录状态已失效，请重新登录。" }, 401);
  }
  c.set("admin", admin);
  await next();
});
