import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../types";

export function errorResponse(
  c: Context<AppEnv>,
  status: ContentfulStatusCode,
  message: string,
  details?: Record<string, string[]>,
) {
  return c.json(
    {
      error: message,
      ...(details && Object.keys(details).length > 0 ? { details } : {}),
    },
    status,
  );
}

export function zodDetails(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!details[key]) details[key] = [];
    details[key].push(issue.message);
  }
  return details;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /UNIQUE constraint failed/i.test(error.message)
  );
}

export function safeTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return null;
  return timestamp.toISOString();
}

export async function readJsonBody(c: Context<AppEnv>): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return undefined;
  }
}

export function excerptFromMarkdown(content: string, maxLength = 150): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>~-]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trim()}…`;
}

export function clientIp(c: Context<AppEnv>): string {
  const connectingIp = c.req.header("CF-Connecting-IP");
  if (connectingIp) return connectingIp.trim().slice(0, 80);
  const forwarded = c.req.header("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 80);
  return "unknown";
}
