import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import type { AuthStatus } from "../../shared/types";
import { api } from "../lib/api";
import { usePageMeta } from "../lib/usePageMeta";
import { PageLoader } from "../components/Brand";
import { Starfield } from "../components/Starfield";
import { useToast } from "../components/Toast";

function AuthBrand() {
  return (
    <Link to="/" className="auth-brand" aria-label="返回网站首页">
      <span className="auth-brand-mark">
        <span />
      </span>
      <span>
        <strong>ORBIT</strong>
        <small>CONTENT STUDIO</small>
      </span>
    </Link>
  );
}

function AuthShell({
  mode,
  children,
}: {
  mode: "login" | "setup";
  children: React.ReactNode;
}) {
  return (
    <div className={`auth-page auth-${mode}`}>
      <Starfield />
      <div className="auth-shell">
        <header className="auth-topbar">
          <AuthBrand />
          <Link to="/" className="auth-back">
            <ArrowLeft size={14} />
            返回网站
          </Link>
        </header>

        <div className="auth-grid">
          <section className="auth-story">
            <p className="eyebrow">
              {mode === "login" ? "WELCOME BACK" : "FIRST LIGHT"}
            </p>
            <h1>
              {mode === "login" ? (
                <>
                  内容在等你，
                  <br />
                  <span className="accent-text">继续书写。</span>
                </>
              ) : (
                <>
                  为你的角落，
                  <br />
                  <span className="accent-text">点亮第一颗星。</span>
                </>
              )}
            </h1>
            <p className="auth-story-copy">
              {mode === "login"
                ? "这里是网站的内容控制台。所有改动会实时呈现在线上，无需重新部署。"
                : "完成初始化后，你就可以在这里编辑个人资料、项目、文章与站点视觉。"}
            </p>
            <div className="auth-orbit" aria-hidden="true">
              <span className="auth-orbit-ring auth-orbit-ring-a" />
              <span className="auth-orbit-ring auth-orbit-ring-b" />
              <span className="auth-orbit-ring auth-orbit-ring-c" />
              <span className="auth-orbit-core" />
              <span className="auth-orbit-dot auth-orbit-dot-a" />
              <span className="auth-orbit-dot auth-orbit-dot-b" />
            </div>
            <ul className="auth-features">
              <li>
                <ShieldCheck size={15} />
                管理员账号与公开内容完全隔离
              </li>
              <li>
                <span className="auth-feature-dot" />
                密码加盐哈希存储，不保存明文
              </li>
              <li>
                <span className="auth-feature-dot" />
                基于 Cloudflare Workers + D1
              </li>
            </ul>
          </section>

          <section className="auth-card">{children}</section>
        </div>

        <footer className="auth-footer">
          <span>ORBIT PORTFOLIO / ADMIN</span>
          <span>SECURED BY CLOUDFLARE</span>
        </footer>
      </div>
    </div>
  );
}

function useAuthStatus() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError("");
    api.auth
      .status()
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "无法验证站点状态。",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    status,
    error,
    reload: () => setReloadKey((value) => value + 1),
  };
}

function AuthStatusScreen({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="admin-gate">
      <Starfield />
      <div className="admin-gate-card">
        <p className="eyebrow">ADMIN / CONNECTION ERROR</p>
        <h1>暂时无法连接</h1>
        <p>{error}</p>
        <div className="admin-gate-actions">
          <button type="button" className="btn btn-secondary" onClick={onRetry}>
            重试
          </button>
          <Link to="/" className="btn btn-ghost">
            返回网站
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { status, error: statusError, reload } = useAuthStatus();
  const navigate = useNavigate();
  const { showToast } = useToast();

  usePageMeta({
    title: "登录 · Orbit Admin",
    description: "网站内容控制台登录。",
  });

  if (statusError) {
    return <AuthStatusScreen error={statusError} onRetry={reload} />;
  }

  if (!status) {
    return (
      <div className="admin-gate">
        <Starfield />
        <PageLoader label="正在验证站点" />
      </div>
    );
  }

  if (status.setupRequired) {
    return <Navigate to="/admin/setup" replace />;
  }

  if (status.authenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.auth.login(username, password);
      showToast("欢迎回来");
      navigate("/admin", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "登录失败，请重试。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell mode="login">
      <div className="auth-card-head">
        <p className="eyebrow">SIGN IN</p>
        <h2>进入控制台</h2>
        <p>使用部署时创建的管理员账号登录。</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>用户名</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="你的管理员用户名"
            autoFocus
            required
            maxLength={32}
          />
        </label>
        <label className="field">
          <span>密码</span>
          <span className="password-input">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="输入密码"
              required
              maxLength={128}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary btn-block auth-submit"
          disabled={submitting}
        >
          {submitting ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <ArrowUpRight size={16} />
          )}
          {submitting ? "正在登录" : "登录控制台"}
        </button>
      </form>

      <div className="auth-card-foot">
        <span>忘记密码？请通过部署环境重置管理员账号。</span>
      </div>
    </AuthShell>
  );
}

export function SetupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { status, error: statusError, reload } = useAuthStatus();
  const navigate = useNavigate();
  const { showToast } = useToast();

  usePageMeta({
    title: "初始化管理员 · Orbit Admin",
    description: "第一次设置网站管理员账号。",
  });

  if (statusError) {
    return <AuthStatusScreen error={statusError} onRetry={reload} />;
  }

  if (!status) {
    return (
      <div className="admin-gate">
        <Starfield />
        <PageLoader label="正在准备初始化" />
      </div>
    );
  }

  if (!status.setupRequired) {
    return status.authenticated ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/admin/login" replace />
    );
  }

  const passwordLongEnough = password.length >= 12;
  const passwordsMatch =
    password.length > 0 && password === confirmPassword;
  const usernameValid = /^[a-zA-Z0-9_-]{3,32}$/.test(username);
  const canSubmit =
    usernameValid && passwordLongEnough && passwordsMatch && !submitting;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      await api.auth.setup(username, password);
      showToast("管理员已创建，欢迎来到控制台");
      navigate("/admin", { replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "初始化失败，请重试。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell mode="setup">
      <div className="auth-card-head">
        <p className="eyebrow">INITIALIZE</p>
        <h2>创建管理员</h2>
        <p>这是网站的第一次设置。完成后即可开始编辑内容。</p>
      </div>

      <div className="setup-warning">
        <span className="setup-warning-dot" />
        这是唯一一次初始化机会。请使用一个足够长且唯一的密码。
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>管理员用户名</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="3–32 位字母、数字或连字符"
            autoFocus
            required
            minLength={3}
            maxLength={32}
          />
        </label>

        <label className="field">
          <span>设置密码</span>
          <span className="password-input">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="至少 12 个字符"
              required
              minLength={12}
              maxLength={128}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        <label className="field">
          <span>确认密码</span>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="再次输入密码"
            required
            maxLength={128}
          />
        </label>

        <ul className="password-rules">
          <li className={usernameValid ? "is-met" : ""}>
            {usernameValid ? <Check size={12} /> : <X size={12} />}
            用户名格式正确
          </li>
          <li className={passwordLongEnough ? "is-met" : ""}>
            {passwordLongEnough ? <Check size={12} /> : <X size={12} />}
            密码至少 12 个字符
          </li>
          <li className={passwordsMatch ? "is-met" : ""}>
            {passwordsMatch ? <Check size={12} /> : <X size={12} />}
            两次输入一致
          </li>
        </ul>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary btn-block auth-submit"
          disabled={!canSubmit}
        >
          {submitting ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <ShieldCheck size={16} />
          )}
          {submitting ? "正在创建" : "创建管理员并进入"}
        </button>
      </form>

      <div className="auth-card-foot">
        <span>密码只会以 PBKDF2 加盐哈希的形式保存在数据库中。</span>
      </div>
    </AuthShell>
  );
}
