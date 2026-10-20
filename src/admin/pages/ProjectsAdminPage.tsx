import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ExternalLink,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Project } from "../../../shared/types";
import { api } from "../../lib/api";
import { isSafeLink } from "../../lib/format";
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

export function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.admin
      .getProjects()
      .then((items) => {
        if (!cancelled) setProjects(items);
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
    return projects.filter((project) => {
      if (filter === "published" && !project.published) return false;
      if (filter === "draft" && project.published) return false;
      if (!normalized) return true;
      return [project.title, project.slug, project.summary, ...project.tech]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [projects, filter, query]);

  const publishedCount = projects.filter((project) => project.published).length;
  const draftCount = projects.length - publishedCount;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.admin.deleteProject(deleteTarget.id);
      setProjects((current) =>
        current.filter((project) => project.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      showToast("项目已删除");
    } catch (caught) {
      showToast(formatApiError(caught), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page projects-admin-page">
      <AdminPageHeader
        eyebrow="WORK / PROJECTS"
        title="项目管理"
        description="记录你构建过的产品、实验与开源项目。"
        actions={
          <Link to="/admin/projects/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            新建项目
          </Link>
        }
      />

      {loading ? (
        <AdminLoading label="正在读取项目列表" />
      ) : error ? (
        <AdminError
          message={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : (
        <>
          <div className="admin-list-toolbar">
            <div className="admin-tabs" role="tablist" aria-label="筛选项目">
              <button
                type="button"
                className={filter === "all" ? "is-active" : ""}
                onClick={() => setFilter("all")}
                role="tab"
                aria-selected={filter === "all"}
              >
                全部 <span>{projects.length}</span>
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
              <span className="sr-only">搜索项目</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索项目名称、slug 或技术"
              />
            </label>
          </div>

          {filtered.length > 0 ? (
            <div className="admin-project-list">
              {filtered.map((project) => (
                <article className="admin-project-row" key={project.id}>
                  <Link
                    to={`/admin/projects/${project.id}`}
                    className="admin-project-cover"
                    aria-label={`编辑 ${project.title}`}
                  >
                    <span>{project.title.slice(0, 1).toUpperCase()}</span>
                    {project.coverUrl && isSafeLink(project.coverUrl) ? (
                      <img src={project.coverUrl} alt="" loading="lazy" />
                    ) : null}
                  </Link>
                  <div className="admin-project-main">
                    <div className="admin-project-title">
                      <Link to={`/admin/projects/${project.id}`}>
                        <h2>{project.title}</h2>
                      </Link>
                      <Badge tone={project.published ? "success" : "warning"}>
                        {project.published ? "已发布" : "草稿"}
                      </Badge>
                      {project.featured ? <Badge tone="accent">精选</Badge> : null}
                    </div>
                    <p>{project.summary}</p>
                    <div className="admin-project-meta">
                      <span>/{project.slug}</span>
                      <span>{project.year || "未填写年份"}</span>
                      <span>{project.tech.slice(0, 4).join(" · ")}</span>
                    </div>
                  </div>
                  <div className="admin-row-actions">
                    {project.published ? (
                      <a
                        href={`/projects/${project.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-icon-button"
                        aria-label={`预览 ${project.title}`}
                        title="预览线上页面"
                      >
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className="admin-icon-button"
                      aria-label={`编辑 ${project.title}`}
                      title="编辑"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      type="button"
                      className="admin-icon-button danger"
                      onClick={() => setDeleteTarget(project)}
                      aria-label={`删除 ${project.title}`}
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="还没有项目"
              description="添加第一个作品，让它成为你能力最直接的证明。"
              icon={<FolderKanban size={20} />}
              action={
                <Link
                  to="/admin/projects/new"
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} />
                  新建项目
                </Link>
              }
            />
          ) : (
            <EmptyState
              title="没有匹配的项目"
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
              共 {projects.length} 个项目 · {publishedCount} 个已发布
            </span>
            <Link to="/admin/projects/new" className="admin-text-link">
              添加新项目
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除这个项目？"
        description={`「${deleteTarget?.title ?? ""}」及其详情页将被永久删除，此操作无法撤销。`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
