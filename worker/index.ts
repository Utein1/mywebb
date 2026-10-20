import { Hono } from "hono";
import type { AppEnv, Env } from "./types";
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { publicRoutes } from "./routes/public";

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("Cache-Control", "no-store");
});

app.use("/api/*", async (c, next) => {
  const method = c.req.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const origin = c.req.header("Origin");
    if (origin) {
      try {
        const requestUrl = new URL(c.req.url);
        const originUrl = new URL(origin);
        const sameHost = originUrl.host === requestUrl.host;
        const localPreview =
          originUrl.hostname === "localhost" ||
          originUrl.hostname === "127.0.0.1";
        if (!sameHost && !localPreview) {
          return c.json({ error: "请求来源不被允许。" }, 403);
        }
      } catch {
        return c.json({ error: "请求来源不被允许。" }, 403);
      }
    }

    const contentLength = Number(c.req.header("Content-Length") ?? 0);
    if (contentLength > 512 * 1024) {
      return c.json({ error: "请求内容过大。" }, 413);
    }
    const contentType = c.req.header("Content-Type") ?? "";
    if (
      contentLength > 0 &&
      !contentType.toLowerCase().includes("application/json")
    ) {
      return c.json({ error: "请求需使用 application/json 格式。" }, 415);
    }
  }
  await next();
});

app.get("/api/health", (c) =>
  c.json({ ok: true, service: "orbit-portfolio", time: new Date().toISOString() }),
);

app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api", publicRoutes);

app.notFound((c) =>
  c.json({ error: "接口不存在。" }, 404),
);

app.onError((error, c) => {
  console.error("Unhandled API error:", error);
  return c.json(
    { error: "服务器暂时无法处理该请求，请稍后重试。" },
    500,
  );
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return app.fetch(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
