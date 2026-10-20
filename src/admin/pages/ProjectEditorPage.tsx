import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import type { Project } from "../../../shared/types";
import { api } from "../../lib/api";
import {
  isSafeLink,
  slugifyTitle,
  splitCommaList,
} from "../../lib/format";
import { useToast } from "../../components/Toast";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  Card,
  ConfirmDialog,
  FormField,
  Toggle,
  formatApiError,
} from "../ui";

interface ProjectDraft {
  title: string;
  slug: string;
  summary: string;
  description: string;
  coverUrl: string;
  techText: string;
  demoUrl: string;
  repoUrl: string;
  year: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
}

const createDraft = (): ProjectDraft => ({
  title: "",
  slug: "",
  summary: "",
  description: "",
  coverUrl: "",
  techText: "",
  demoUrl: "",
  repoUrl: "",
  year: String(new Date().getFullYear()),
  featured: false,
  published: true,
  sortOrder: 10,
});

const fromProject = (project: Project): ProjectDraft => ({
  title: project.title,
  slug: project.slug,
  summary: project.summary,
  description: project.description,
  coverUrl: project.coverUrl,
  techText: project.tech.join(", "),
  demoUrl: project.demoUrl,
  repoUrl: project.repoUrl,
  year: project.year,
  featured: project.featured,
  published: project.published,
  sortOrder: project.sortOrder,
});

export function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isNew = !id;
  const [draft, setDraft] = useState<ProjectDraft>(createDraft);
  const [savedProject, setSavedProject] = useState<Project | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [detailTab, setDetailTab] = useState<"edit" | "preview">("edit");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isNew) {
      setDraft(createDraft());
      setSavedProject(null);
      setSlugTouched(false);
      setLoading(false);
      setError("");
      return;
    }
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setError("无效的项目 ID。");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    api.admin
      .getProject(numericId)
      .then((project) => {
        if (cancelled) return;
        setDraft(fromProject(project));
        setSavedProject(project);
        setSlugTouched(true);
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
  }, [id, isNew, reloadKey]);

  const update = <K extends keyof ProjectDraft>(
    key: K,
    value: ProjectDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (value: string) => {
    setDraft((current) => ({
      ...current,
      title: value,
      slug:
        !slugTouched && isNew ? slugifyTitle(value) : current.slug,
    }));
  };

  const buildPayload = () => ({
    title: draft.title,
    slug: draft.slug,
    summary: draft.summary,
    description: draft.description,
    coverUrl: draft.coverUrl,
    tech: splitCommaList(draft.techText),
    demoUrl: draft.demoUrl,
    repoUrl: draft.repoUrl,
    year: draft.year,
    featured: draft.featured,
    published: draft.published,
    sortOrder: Number(draft.sortOrder) || 0,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isNew) {
        const created = await api.admin.createProject(buildPayload());
        showToast("项目已创建");
        navigate(`/admin/projects/${created.id}`, { replace: true });
      } else {
        const updated = await api.admin.updateProject(
          Number(id),
          buildPayload(),
        );
        setSavedProject(updated);
        setDraft(fromProject(updated));
        setSlugTouched(true);
        showToast("项目已保存，线上内容已同步");
      }
    } catch (caught) {
      setError(formatApiError(caught));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!savedProject) return;
    setDeleting(true);
    try {
      await api.admin.deleteProject(savedProject.id);
      showToast("项目已删除");
      navigate("/admin/projects", { replace: true });
    } catch (caught) {
      showToast(formatApiError(caught), "error");
      setDeleting(false);
    }
  };

  if (loading) return <AdminLoading label="正在读取项目" />;
  if (error && !isNew && !savedProject) {
    return (
      <AdminError
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
    );
  }

  const coverSafe = draft.coverUrl && isSafeLink(draft.coverUrl);

  return (
    <div className="admin-page project-editor-page">
      <AdminPageHeader
        eyebrow={isNew ? "NEW PROJECT" : "EDIT PROJECT"}
        title={isNew ? "新建项目" : draft.title || "编辑项目"}
        description={
          isNew
            ? "讲述一个问题，以及你如何用产品回答它。"
            : "修改会实时保存到数据库，并同步到线上。"
        }
        back={{ to: "/admin/projects", label: "返回项目列表" }}
        actions={
          <>
            {!isNew && savedProject?.published ? (
              <a
                href={`/projects/${savedProject.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={14} />
                预览
              </a>
            ) : null}
            <button
              type="submit"
              form="project-form"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? "保存中" : "保存项目"}
            </button>
          </>
        }
      />

      {error ? <p className="form-error admin-form-error">{error}</p> : null}

      <form id="project-form" onSubmit={handleSubmit} className="admin-two-col">
        <div className="admin-col-main">
          <Card title="项目信息" description="先让人在一屏之内理解它是什么。">
            <div className="admin-form-grid">
              <FormField label="项目名称" htmlFor="project-title" required full>
                <input
                  id="project-title"
                  className="input admin-title-input"
                  value={draft.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder="例如：Aeon Notes"
                  maxLength={80}
                  required
                />
              </FormField>
              <FormField
                label="链接标识 (slug)"
                htmlFor="project-slug"
                hint="小写字母、数字与连字符，例如 aeon-notes。留空则自动生成。"
              >
                <input
                  id="project-slug"
                  className="input"
                  value={draft.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    update(
                      "slug",
                      event.target.value.toLowerCase().replace(/\s+/g, "-"),
                    );
                  }}
                  placeholder="留空自动生成"
                  maxLength={80}
                />
              </FormField>
              <FormField label="年份" htmlFor="project-year">
                <input
                  id="project-year"
                  className="input"
                  value={draft.year}
                  onChange={(event) => update("year", event.target.value)}
                  placeholder="2026"
                  maxLength={10}
                />
              </FormField>
              <FormField
                label="项目摘要"
                htmlFor="project-summary"
                hint="显示在项目卡片与详情页引言，建议 40–100 字。"
                required
                full
              >
                <textarea
                  id="project-summary"
                  className="input"
                  rows={3}
                  value={draft.summary}
                  onChange={(event) => update("summary", event.target.value)}
                  placeholder="用一句话说清楚它为谁解决了什么问题。"
                  maxLength={300}
                  required
                />
              </FormField>
              <FormField
                label="技术栈"
                htmlFor="project-tech"
                hint="使用逗号分隔，最多 16 个。"
                full
              >
                <input
                  id="project-tech"
                  className="input"
                  value={draft.techText}
                  onChange={(event) => update("techText", event.target.value)}
                  placeholder="React, TypeScript, Cloudflare Workers"
                />
                {splitCommaList(draft.techText).length > 0 ? (
                  <div className="tag-preview">
                    {splitCommaList(draft.techText).map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                ) : null}
              </FormField>
            </div>
          </Card>

          <Card
            title="项目详情"
            description="支持 Markdown。写清楚背景、你的角色和最终结果。"
            actions={
              <div className="editor-tabs">
                <button
                  type="button"
                  className={detailTab === "edit" ? "is-active" : ""}
                  onClick={() => setDetailTab("edit")}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className={detailTab === "preview" ? "is-active" : ""}
                  onClick={() => setDetailTab("preview")}
                >
                  预览
                </button>
              </div>
            }
          >
            {detailTab === "edit" ? (
              <textarea
                className="input markdown-textarea"
                rows={18}
                value={draft.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder={"## 项目背景\n\n描述项目的问题与目标。\n\n## 我做了什么\n\n- 负责…\n- 设计…\n\n## 结果\n\n写下可量化的影响。"}
              />
            ) : (
              <div className="markdown-preview">
                {draft.description ? (
                  <MarkdownRenderer content={draft.description} compact />
                ) : (
                  <p className="admin-muted">还没有内容可以预览。</p>
                )}
              </div>
            )}
          </Card>

          <Card title="项目链接" description="留空即可。仅接受 http(s) 链接。">
            <div className="admin-form-grid">
              <FormField
                label="线上演示地址"
                htmlFor="project-demo"
                hint="用户可直接访问的产品或案例。"
              >
                <input
                  id="project-demo"
                  className="input"
                  value={draft.demoUrl}
                  onChange={(event) => update("demoUrl", event.target.value)}
                  placeholder="https://…"
                  maxLength={800}
                />
              </FormField>
              <FormField
                label="源码仓库"
                htmlFor="project-repo"
                hint="GitHub 或其他代码托管地址。"
              >
                <input
                  id="project-repo"
                  className="input"
                  value={draft.repoUrl}
                  onChange={(event) => update("repoUrl", event.target.value)}
                  placeholder="https://github.com/…"
                  maxLength={800}
                />
              </FormField>
            </div>
          </Card>

          <div className="admin-form-foot">
            <Link to="/admin/projects" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} />
              取消
            </Link>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? "保存中" : isNew ? "创建项目" : "保存项目"}
            </button>
          </div>
        </div>

        <aside className="admin-col-side">
          <Card title="发布状态">
            <div className="toggle-stack">
              <Toggle
                checked={draft.published}
                onChange={(value) => update("published", value)}
                label="公开发布"
                description="关闭后只有你能在后台看到。"
              />
              <Toggle
                checked={draft.featured}
                onChange={(value) => update("featured", value)}
                label="精选项目"
                description="优先出现在首页项目区域。"
              />
            </div>
          </Card>

          <Card title="封面图" description="推荐尺寸 1600 × 1000。">
            <div className="cover-preview">
              <span>{draft.title.slice(0, 1).toUpperCase() || <ImageIcon size={24} />}</span>
              {coverSafe ? (
                <img
                  src={draft.coverUrl}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
            </div>
            <FormField
              label="封面图片地址"
              htmlFor="project-cover"
              hint="可填写 /images/cover.svg 或图床 https 链接。"
            >
              <input
                id="project-cover"
                className="input"
                value={draft.coverUrl}
                onChange={(event) => update("coverUrl", event.target.value)}
                placeholder="/images/cover-aeon.svg"
                maxLength={800}
              />
            </FormField>
          </Card>

          <Card title="排序">
            <FormField
              label="排序权重"
              htmlFor="project-sort"
              hint="数字越小越靠前。"
            >
              <input
                id="project-sort"
                className="input"
                type="number"
                min={0}
                max={9999}
                value={draft.sortOrder}
                onChange={(event) =>
                  update("sortOrder", Number(event.target.value))
                }
              />
            </FormField>
          </Card>

          {!isNew ? (
            <Card title="危险操作">
              <p className="admin-muted admin-danger-copy">
                删除后，项目和详情页将从线上永久消失。
              </p>
              <button
                type="button"
                className="btn btn-danger btn-sm admin-delete-button"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={14} />
                删除这个项目
              </button>
            </Card>
          ) : null}
        </aside>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        title="删除这个项目？"
        description={`「${draft.title || "未命名项目"}」将被永久删除，此操作无法撤销。`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
      />
    </div>
  );
}
