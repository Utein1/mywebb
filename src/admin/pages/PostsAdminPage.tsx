import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  FileText,
  PenLine,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { PostSummary } from "../../../shared/types";
import { api } from "../../lib/api";
import { formatDateTime, formatShortDate, isSafeLink } from "../../lib/format";
import { useToast } from "../../components/Toast";
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  Badge,
  ConfirmDialog,
  EmptyState,
  formatApiError,
} from "../ui";

type Filter = "all" | "published" | "draft";

export function PostsAdminPage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PostSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.admin
      .getPosts()
      .then((items) => {
        if (!cancelled) setPosts(items);
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
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (filter === "published" && !post.published) return false;
      if (filter === "draft" && post.published) return false;
      if (!normalized) return true;
      return [post.title, post.slug, post.excerpt, ...post.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [posts, filter, query]);

  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = posts.length - publishedCount;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.admin.deletePost(deleteTarget.id);
      setPosts((current) =>
        current.filter((post) => post.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      showToast("文章已删除");
    } catch (caught) {
      showToast(formatApiError(caught), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page posts-admin-page">
      <AdminPageHeader
        eyebrow="WRITING / NOTES"
        title="博客文章"
        description="写作是另一种整理思绪的方式。草稿只有你能看到。"
        actions={
          <Link to="/admin/posts/new" className="btn btn-primary btn-sm">
            <PenLine size={15} />
            写新文章
          </Link>
        }
      />

      {loading ? (
        <AdminLoading label="正在读取文章" />
      ) : error ? (
        <AdminError
          message={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : (
        <>
          <div className="admin-list-toolbar">
            <div className="admin-tabs" role="tablist" aria-label="筛选文章">
              <button
                type="button"
                className={filter === "all" ? "is-active" : ""}
                onClick={() => setFilter("all")}
                role="tab"
                aria-selected={filter === "all"}
              >
                全部 <span>{posts.length}</span>
              </button>
              <button
                type="button"
                className={filter === "published" ? "is-active" : ""}
                onClick={() => setFilter("published")}
                role="tab"
                aria-selected={filter === "published"}
              >
                已发布 <span>{publishedCount}</span>
              </button>
              <button
                type="button"
                className={filter === "draft" ? "is-active" : ""}
                onClick={() => setFilter("draft")}
                role="tab"
                aria-selected={filter === "draft"}
              >
                草稿 <span>{draftCount}</span>
              </button>
            </div>
            <label className="admin-search">
              <Search size={15} />
              <span className="sr-only">搜索文章</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、摘要或标签"
              />
            </label>
          </div>

          {filtered.length > 0 ? (
            <div className="admin-post-list">
              <div className="admin-post-list-head">
                <span>文章</span>
                <span>状态</span>
                <span>发布 / 更新</span>
                <span>操作</span>
              </div>
              {filtered.map((post) => (
                <article className="admin-post-row" key={post.id}>
                  <div className="admin-post-main">
                    <div className="admin-post-thumb">
                      {post.coverUrl && isSafeLink(post.coverUrl) ? (
                        <img src={post.coverUrl} alt="" loading="lazy" />
                      ) : (
                        <FileText size={16} />
                      )}
                    </div>
                    <div>
                      <Link to={`/admin/posts/${post.id}`}>
                        <h2>{post.title}</h2>
                      </Link>
                      <p>{post.excerpt}</p>
                      <div className="admin-post-tags">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                        <span>{post.readingMinutes} 分钟阅读</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Badge tone={post.published ? "success" : "warning"}>
                      {post.published ? "已发布" : "草稿"}
                    </Badge>
                  </div>
                  <div className="admin-post-dates">
                    <span>
                      {post.publishedAt
                        ? formatShortDate(post.publishedAt)
                        : "未发布"}
                    </span>
                    <small>
                      更新于 {formatDateTime(post.updatedAt)}
                    </small>
                  </div>
                  <div className="admin-row-actions">
                    {post.published ? (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-icon-button"
                        aria-label={`预览 ${post.title}`}
                        title="预览文章"
                      >
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                    <Link
                      to={`/admin/posts/${post.id}`}
                      className="admin-icon-button"
                      aria-label={`编辑 ${post.title}`}
                      title="编辑"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      type="button"
                      className="admin-icon-button danger"
                      onClick={() => setDeleteTarget(post)}
                      aria-label={`删除 ${post.title}`}
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              title="还没有文章"
              description="写点什么吧。哪怕只是一段还没有结论的思考。"
              icon={<FileText size={20} />}
              action={
                <Link to="/admin/posts/new" className="btn btn-primary btn-sm">
                  <Plus size={15} />
                  写第一篇文章
                </Link>
              }
            />
          ) : (
            <EmptyState
              title="没有匹配的文章"
              description="试试清除筛选条件，或换一个关键词。"
              action={
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                >
                  清除筛选
                </button>
              }
            />
          )}

          <div className="admin-list-foot">
            <span>
              共 {posts.length} 篇 · {publishedCount} 篇已发布 · {draftCount} 篇草稿
            </span>
            <Link to="/admin/posts/new" className="admin-text-link">
              开始写作
              <PenLine size={13} />
            </Link>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除这篇文章？"
        description={`「${deleteTarget?.title ?? ""}」将被永久删除，此操作无法撤销。`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
