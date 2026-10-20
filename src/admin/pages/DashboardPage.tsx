import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  FolderKanban,
  Inbox,
  PanelsTopLeft,
  PenLine,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { AdminOverview } from "../../../shared/types";
import { api } from "../../lib/api";
import { formatDateTime, relativeTime } from "../../lib/format";
import { useAdmin } from "../context";
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  Badge,
  Card,
  EmptyState,
  formatApiError,
} from "../ui";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 12) return "上午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export function DashboardPage() {
  const { username, setUnreadCount } = useAdmin();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.admin
      .overview()
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
        setUnreadCount(data.counts.unreadMessages);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(formatApiError(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, setUnreadCount]);

  const today = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <div className="admin-page dashboard-page">
      <AdminPageHeader
        eyebrow="DASHBOARD / OVERVIEW"
        title={`${greeting()}，${username}`}
        description={`${today}。这里是你内容世界的驾驶舱。`}
        actions={
          <>
            <Link to="/admin/posts/new" className="btn btn-primary btn-sm">
              <PenLine size={15} />
              写一篇文章
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <PanelsTopLeft size={15} />
              查看网站
            </a>
          </>
        }
      />

      {loading ? (
        <AdminLoading label="正在汇总内容" />
      ) : error || !overview ? (
        <AdminError
          message={error || "无法读取控制台数据。"}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : (
        <>
          <section className="dashboard-hero">
            <div className="dashboard-hero-copy">
              <p className="eyebrow">WELCOME BACK / 2026</p>
              <h2>
                你的内容世界，
                <br />
                一切井然有序。
              </h2>
              <p>
                所有修改都会实时保存到 Cloudflare D1，并直接呈现在线上。今天想做点什么？
              </p>
              <div className="dashboard-quick-actions">
                <Link to="/admin/projects/new" className="quick-action">
                  <Plus size={14} />
                  新建项目
                </Link>
                <Link to="/admin/profile" className="quick-action">
                  <UserRound size={14} />
                  编辑个人资料
                </Link>
                <Link to="/admin/skills" className="quick-action">
                  <Sparkles size={14} />
                  调整技能
                </Link>
              </div>
            </div>
            <div className="dashboard-orbit" aria-hidden="true">
              <span className="dashboard-orbit-ring dashboard-orbit-ring-a" />
              <span className="dashboard-orbit-ring dashboard-orbit-ring-b" />
              <span className="dashboard-orbit-ring dashboard-orbit-ring-c" />
              <span className="dashboard-orbit-core" />
              <span className="dashboard-orbit-star dashboard-orbit-star-a" />
              <span className="dashboard-orbit-star dashboard-orbit-star-b" />
              <span className="dashboard-orbit-star dashboard-orbit-star-c" />
            </div>
          </section>

          <div className="dashboard-stats">
            <Link to="/admin/projects" className="stat-card">
              <span className="stat-icon">
                <FolderKanban size={18} />
              </span>
              <span className="stat-label">项目档案</span>
              <strong>{String(overview.counts.projects).padStart(2, "0")}</strong>
              <span className="stat-foot">查看全部项目</span>
              <ArrowUpRight size={15} className="stat-arrow" />
            </Link>
            <Link to="/admin/posts" className="stat-card">
              <span className="stat-icon">
                <FileText size={18} />
              </span>
              <span className="stat-label">博客文章</span>
              <strong>
                {String(overview.counts.publishedPosts).padStart(2, "0")}
                <small> / {String(overview.counts.posts).padStart(2, "0")}</small>
              </strong>
              <span className="stat-foot">已发布 / 全部</span>
              <ArrowUpRight size={15} className="stat-arrow" />
            </Link>
            <Link to="/admin/messages" className="stat-card">
              <span className="stat-icon">
                <Inbox size={18} />
              </span>
              <span className="stat-label">未读留言</span>
              <strong>
                {String(overview.counts.unreadMessages).padStart(2, "0")}
                <small> / {String(overview.counts.totalMessages).padStart(2, "0")}</small>
              </strong>
              <span className="stat-foot">查看收件箱</span>
              <ArrowUpRight size={15} className="stat-arrow" />
            </Link>
            <Link to="/admin/skills" className="stat-card">
              <span className="stat-icon">
                <Sparkles size={18} />
              </span>
              <span className="stat-label">技能条目</span>
              <strong>{String(overview.counts.skills).padStart(2, "0")}</strong>
              <span className="stat-foot">管理能力标签</span>
              <ArrowUpRight size={15} className="stat-arrow" />
            </Link>
          </div>

          <div className="dashboard-bottom">
            <Card
              title="最近的留言"
              description="别人发来的信号，记得及时回应。"
              actions={
                <Link to="/admin/messages" className="admin-text-link">
                  全部留言
                  <ArrowUpRight size={13} />
                </Link>
              }
              flush
            >
              {overview.recentMessages.length > 0 ? (
                <div className="dashboard-message-list">
                  {overview.recentMessages.map((message) => (
                    <Link
                      to="/admin/messages"
                      key={message.id}
                      className={`dashboard-message ${message.isRead ? "" : "is-unread"}`}
                    >
                      <span className="dashboard-message-avatar">
                        {message.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <div className="dashboard-message-head">
                          <strong>{message.name}</strong>
                          <span>{relativeTime(message.createdAt)}</span>
                        </div>
                        <p>{message.subject}</p>
                        <small>{message.email}</small>
                      </div>
                      {!message.isRead ? <span className="unread-dot" /> : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="收件箱还很安静"
                  description="把网站分享出去，第一条留言可能正在路上。"
                  icon={<Inbox size={20} />}
                />
              )}
            </Card>

            <Card
              title="最近编辑"
              description="继续上一次未完成的表达。"
              actions={
                <Link to="/admin/posts" className="admin-text-link">
                  全部文章
                  <ArrowUpRight size={13} />
                </Link>
              }
              flush
            >
              {overview.recentPosts.length > 0 ? (
                <div className="dashboard-post-list">
                  {overview.recentPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/admin/posts/${post.id}`}
                      className="dashboard-post"
                    >
                      <div>
                        <div className="dashboard-post-meta">
                          <Badge tone={post.published ? "success" : "warning"}>
                            {post.published ? "已发布" : "草稿"}
                          </Badge>
                          <span>{formatDateTime(post.updatedAt)}</span>
                        </div>
                        <strong>{post.title}</strong>
                      </div>
                      <ArrowUpRight size={15} />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="还没有文章"
                  description="开始记录你的第一个想法。"
                  icon={<FileText size={20} />}
                  action={
                    <Link to="/admin/posts/new" className="btn btn-secondary btn-sm">
                      开始写作
                    </Link>
                  }
                />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
