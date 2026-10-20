import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Cpu,
  ExternalLink,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import type { AuthStatus } from "../../shared/types";
import { api } from "../lib/api";
import { initials } from "../lib/format";
import { PageLoader } from "../components/Brand";
import { Starfield } from "../components/Starfield";
import { AdminContext } from "./context";
import { LoginPage, SetupPage } from "./AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfileAdminPage } from "./pages/ProfileAdminPage";
import { SkillsAdminPage } from "./pages/SkillsAdminPage";
import { ProjectsAdminPage } from "./pages/ProjectsAdminPage";
import { ProjectEditorPage } from "./pages/ProjectEditorPage";
import { PostsAdminPage } from "./pages/PostsAdminPage";
import { PostEditorPage } from "./pages/PostEditorPage";
import { MessagesAdminPage } from "./pages/MessagesAdminPage";
import { SettingsAdminPage } from "./pages/SettingsAdminPage";
import { AccountAdminPage } from "./pages/AccountAdminPage";

const primaryNav = [
  { to: "/admin", label: "总览", icon: LayoutDashboard, end: true },
  { to: "/admin/profile", label: "个人资料", icon: UserRound },
  { to: "/admin/skills", label: "技能管理", icon: Cpu },
  { to: "/admin/projects", label: "项目管理", icon: FolderKanban },
  { to: "/admin/posts", label: "博客文章", icon: FileText },
  { to: "/admin/messages", label: "留言收件箱", icon: Inbox },
];

const secondaryNav = [
  { to: "/admin/settings", label: "站点设置", icon: Settings2 },
  { to: "/admin/account", label: "账号与安全", icon: ShieldCheck },
];

function pageTitle(pathname: string): string {
  if (pathname === "/admin") return "总览";
  if (pathname === "/admin/profile") return "个人资料";
  if (pathname === "/admin/skills") return "技能管理";
  if (pathname === "/admin/projects") return "项目管理";
  if (pathname === "/admin/projects/new") return "新建项目";
  if (/^\/admin\/projects\/[^/]+$/.test(pathname)) return "编辑项目";
  if (pathname === "/admin/posts") return "博客文章";
  if (pathname === "/admin/posts/new") return "写文章";
  if (/^\/admin\/posts\/[^/]+$/.test(pathname)) return "编辑文章";
  if (pathname === "/admin/messages") return "留言收件箱";
  if (pathname === "/admin/settings") return "站点设置";
  if (pathname === "/admin/account") return "账号与安全";
  return "控制台";
}

function AdminShell() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusReloadKey, setStatusReloadKey] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setStatusError("");
    api.auth
      .status()
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatusError(
            error instanceof Error ? error.message : "无法验证登录状态。",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [statusReloadKey]);

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!status?.authenticated) return;
    let cancelled = false;
    api.admin
      .overview()
      .then((overview) => {
        if (!cancelled) setUnreadCount(overview.counts.unreadMessages);
      })
      .catch(() => {
        // The badge is non-critical; page-level errors handle real failures.
      });
    return () => {
      cancelled = true;
    };
  }, [status, location.pathname]);

  useEffect(() => {
    document.title = `${pageTitle(location.pathname)} · Orbit Admin`;
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  const contextValue = useMemo(
    () => ({
      username: status?.username ?? "Admin",
      setUsername: (username: string) =>
        setStatus((current) => (current ? { ...current, username } : current)),
      unreadCount,
      setUnreadCount,
      logout,
    }),
    [status?.username, unreadCount, logout],
  );

  if (statusError) {
    return (
      <div className="admin-gate">
        <Starfield />
        <div className="admin-gate-card">
          <p className="eyebrow">ADMIN / CONNECTION ERROR</p>
          <h1>无法连接到控制台</h1>
          <p>{statusError}</p>
          <div className="admin-gate-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStatusReloadKey((value) => value + 1)}
            >
              重试
            </button>
            <a href="/" className="btn btn-ghost">
              返回网站
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="admin-gate">
        <Starfield />
        <PageLoader label="正在进入控制台" />
      </div>
    );
  }

  if (status.setupRequired) {
    return <Navigate to="/admin/setup" replace />;
  }

  if (!status.authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="admin-app">
        <Starfield />
        <button
          type="button"
          className={`admin-sidebar-scrim ${sidebarOpen ? "is-visible" : ""}`.trim()}
          aria-label="关闭侧边栏"
          tabIndex={sidebarOpen ? 0 : -1}
          onClick={() => setSidebarOpen(false)}
        />
        <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`.trim()}>
          <div className="admin-sidebar-top">
            <NavLink to="/admin" className="admin-brand">
              <span className="admin-brand-mark">
                <span />
              </span>
              <span>
                <strong>ORBIT</strong>
                <small>CONTENT STUDIO</small>
              </span>
            </NavLink>
            <button
              type="button"
              className="admin-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="关闭侧边栏"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="admin-nav" aria-label="后台导航">
            <p className="admin-nav-label">WORKSPACE</p>
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const showBadge =
                item.to === "/admin/messages" && unreadCount > 0;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? Boolean(item.end) : false}
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? "is-active" : ""}`.trim()
                  }
                >
                  <Icon size={17} strokeWidth={1.7} />
                  <span>{item.label}</span>
                  {showBadge ? (
                    <em className="admin-nav-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </em>
                  ) : null}
                </NavLink>
              );
            })}

            <p className="admin-nav-label admin-nav-label-spaced">SETTINGS</p>
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? "is-active" : ""}`.trim()
                  }
                >
                  <Icon size={17} strokeWidth={1.7} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="admin-sidebar-foot">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-view-site"
            >
              <span>查看线上网站</span>
              <ExternalLink size={14} />
            </a>
            <div className="admin-user">
              <span className="admin-avatar">{initials(contextValue.username)}</span>
              <div>
                <strong>{contextValue.username}</strong>
                <span>Administrator</span>
              </div>
              <button
                type="button"
                className="admin-logout"
                onClick={logout}
                aria-label="退出登录"
                title="退出登录"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <div className="admin-topbar-left">
              <button
                type="button"
                className="admin-mobile-menu"
                onClick={() => setSidebarOpen(true)}
                aria-label="打开导航"
                aria-expanded={sidebarOpen}
              >
                <Menu size={19} />
              </button>
              <div>
                <span className="admin-topbar-dot" />
                <strong>{pageTitle(location.pathname)}</strong>
              </div>
            </div>
            <div className="admin-topbar-right">
              <span className="admin-live-label">
                <span />
                SITE ONLINE
              </span>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="admin-topbar-view"
              >
                预览站点
                <ExternalLink size={13} />
              </a>
            </div>
          </header>

          <div className="admin-content">
            <Outlet />
          </div>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

export function AdminApp() {
  return (
    <Routes>
      <Route path="setup" element={<SetupPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="/" element={<AdminShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<ProfileAdminPage />} />
        <Route path="skills" element={<SkillsAdminPage />} />
        <Route path="projects" element={<ProjectsAdminPage />} />
        <Route path="projects/new" element={<ProjectEditorPage />} />
        <Route path="projects/:id" element={<ProjectEditorPage />} />
        <Route path="posts" element={<PostsAdminPage />} />
        <Route path="posts/new" element={<PostEditorPage />} />
        <Route path="posts/:id" element={<PostEditorPage />} />
        <Route path="messages" element={<MessagesAdminPage />} />
        <Route path="settings" element={<SettingsAdminPage />} />
        <Route path="account" element={<AccountAdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
