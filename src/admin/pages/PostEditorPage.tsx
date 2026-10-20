import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bold,
  Code2,
  ExternalLink,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  LoaderCircle,
  PenLine,
  Quote,
  Save,
  Trash2,
} from "lucide-react";
import type { Post } from "../../../shared/types";
import { api } from "../../lib/api";
import {
  fromDateTimeLocal,
  isSafeLink,
  slugifyTitle,
  splitCommaList,
  toDateTimeLocal,
} from "../../lib/format";
import { MarkdownRenderer } from "../../components/MarkdownRenderer";
import { useToast } from "../../components/Toast";
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

interface PostDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tagsText: string;
  coverUrl: string;
  published: boolean;
  publishedAtLocal: string;
}

const createDraft = (): PostDraft => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  tagsText: "",
  coverUrl: "",
  published: false,
  publishedAtLocal: "",
});

const fromPost = (post: Post): PostDraft => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  tagsText: post.tags.join(", "),
  coverUrl: post.coverUrl,
  published: post.published,
  publishedAtLocal: toDateTimeLocal(post.publishedAt),
});

export function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isNew = !id;
  const [draft, setDraft] = useState<PostDraft>(createDraft);
  const [savedPost, setSavedPost] = useState<Post | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isNew) {
      setDraft(createDraft());
      setSavedPost(null);
      setSlugTouched(false);
      setLoading(false);
      setError("");
      return;
    }
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setError("无效的文章 ID。");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    api.admin
      .getPost(numericId)
      .then((post) => {
        if (cancelled) return;
        setDraft(fromPost(post));
        setSavedPost(post);
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

  const update = <K extends keyof PostDraft>(key: K, value: PostDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (value: string) => {
    setDraft((current) => ({
      ...current,
      title: value,
      slug: !slugTouched && isNew ? slugifyTitle(value) : current.slug,
    }));
  };

  const wrapSelection = (
    before: string,
    after = "",
    placeholder = "文字",
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      update("content", `${draft.content}${before}${placeholder}${after}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = draft.content.slice(start, end) || placeholder;
    const next = `${draft.content.slice(0, start)}${before}${selected}${after}${draft.content.slice(end)}`;
    update("content", next);
    window.setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    }, 0);
  };

  const prefixLine = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      update("content", `${draft.content}\n${prefix}`);
      return;
    }
    const start = textarea.selectionStart;
    const lineStart = draft.content.lastIndexOf("\n", start - 1) + 1;
    const next = `${draft.content.slice(0, lineStart)}${prefix}${draft.content.slice(lineStart)}`;
    update("content", next);
    window.setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = draft.content.slice(start, end) || "链接文字";
    const next = `${draft.content.slice(0, start)}[${selected}](https://)${draft.content.slice(end)}`;
    update("content", next);
    window.setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + selected.length + 3,
        start + selected.length + 11,
      );
    }, 0);
  };

  const buildPayload = () => ({
    title: draft.title,
    slug: draft.slug,
    excerpt: draft.excerpt,
    content: draft.content,
    tags: splitCommaList(draft.tagsText),
    coverUrl: draft.coverUrl,
    published: draft.published,
    publishedAt: draft.publishedAtLocal
      ? fromDateTimeLocal(draft.publishedAtLocal)
      : null,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!draft.title.trim()) {
      setError("请先填写文章标题。");
      return;
    }
    if (!draft.content.trim()) {
      setError("文章内容不能为空。");
      setTab("write");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await api.admin.createPost(buildPayload());
        showToast(created.published ? "文章已发布" : "草稿已保存");
        navigate(`/admin/posts/${created.id}`, { replace: true });
      } else {
        const updated = await api.admin.updatePost(
          Number(id),
          buildPayload(),
        );
        setSavedPost(updated);
        setDraft(fromPost(updated));
        setSlugTouched(true);
        showToast(updated.published ? "文章已发布，线上内容已同步" : "草稿已保存");
      }
    } catch (caught) {
      setError(formatApiError(caught));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!savedPost) return;
    setDeleting(true);
    try {
      await api.admin.deletePost(savedPost.id);
      showToast("文章已删除");
      navigate("/admin/posts", { replace: true });
    } catch (caught) {
      showToast(formatApiError(caught), "error");
      setDeleting(false);
    }
  };

  if (loading) return <AdminLoading label="正在读取文章" />;
  if (error && !isNew && !savedPost) {
    return (
      <AdminError
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
    );
  }

  const plainLength = draft.content.replace(/\s/g, "").length;
  const estimatedMinutes = Math.max(1, Math.ceil(plainLength / 400));
  const coverSafe = draft.coverUrl && isSafeLink(draft.coverUrl);

  return (
    <div className="admin-page post-editor-page">
      <AdminPageHeader
        eyebrow={isNew ? "NEW ARTICLE" : "EDIT ARTICLE"}
        title={isNew ? "写新文章" : draft.title || "编辑文章"}
        description={
          isNew
            ? "从一个真实的念头开始，不必等它完全成形。"
            : draft.published
              ? "文章已公开，保存后线上内容会立即更新。"
              : "这是一篇草稿，只有登录后台才能看到。"
        }
        back={{ to: "/admin/posts", label: "返回文章列表" }}
        actions={
          <>
            {!isNew && savedPost?.published ? (
              <a
                href={`/blog/${savedPost.slug}`}
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
              form="post-form"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <Save size={14} />
              )}
              {saving
                ? "保存中"
                : draft.published
                  ? "保存并发布"
                  : "保存草稿"}
            </button>
          </>
        }
      />

      {error ? <p className="form-error admin-form-error">{error}</p> : null}

      <form id="post-form" onSubmit={handleSubmit} className="admin-two-col">
        <div className="admin-col-main">
          <Card>
            <div className="post-editor-title-block">
              <label htmlFor="post-title" className="sr-only">
                文章标题
              </label>
              <input
                id="post-title"
                className="post-editor-title-input"
                value={draft.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="输入文章标题…"
                maxLength={120}
              />
              <div className="post-editor-slug-row">
                <span>/blog/</span>
                <input
                  value={draft.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    update(
                      "slug",
                      event.target.value.toLowerCase().replace(/\s+/g, "-"),
                    );
                  }}
                  placeholder="leave-empty-to-auto-generate"
                  aria-label="文章链接标识"
                  maxLength={80}
                />
              </div>
              <label htmlFor="post-excerpt" className="sr-only">
                文章摘要
              </label>
              <textarea
                id="post-excerpt"
                className="post-editor-excerpt"
                rows={2}
                value={draft.excerpt}
                onChange={(event) => update("excerpt", event.target.value)}
                placeholder="写一段摘要。留空会根据正文自动提取。"
                maxLength={300}
              />
              <div className="post-editor-tags">
                <label htmlFor="post-tags">标签</label>
                <input
                  id="post-tags"
                  value={draft.tagsText}
                  onChange={(event) => update("tagsText", event.target.value)}
                  placeholder="设计, 深色模式, 工程"
                />
                <span>用逗号分隔，最多 8 个</span>
              </div>
            </div>
          </Card>

          <Card
            flush
            actions={
              <div className="editor-tabs">
                <button
                  type="button"
                  className={tab === "write" ? "is-active" : ""}
                  onClick={() => setTab("write")}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className={tab === "preview" ? "is-active" : ""}
                  onClick={() => setTab("preview")}
                >
                  <Eye size={13} />
                  预览
                </button>
              </div>
            }
          >
            {tab === "write" ? (
              <div className="markdown-editor">
                <div className="markdown-toolbar" role="toolbar" aria-label="Markdown 格式">
                  <button
                    type="button"
                    onClick={() => prefixLine("## ")}
                    title="二级标题"
                    aria-label="二级标题"
                  >
                    <Heading2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => wrapSelection("**", "**", "加粗文字")}
                    title="加粗"
                    aria-label="加粗"
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => wrapSelection("_", "_", "斜体文字")}
                    title="斜体"
                    aria-label="斜体"
                  >
                    <Italic size={16} />
                  </button>
                  <span className="toolbar-divider" />
                  <button
                    type="button"
                    onClick={() => prefixLine("- ")}
                    title="无序列表"
                    aria-label="无序列表"
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => prefixLine("> ")}
                    title="引用"
                    aria-label="引用"
                  >
                    <Quote size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => wrapSelection("`", "`", "代码")}
                    title="行内代码"
                    aria-label="行内代码"
                  >
                    <Code2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={insertLink}
                    title="插入链接"
                    aria-label="插入链接"
                  >
                    <Link2 size={16} />
                  </button>
                  <span className="markdown-toolbar-meta">
                    MARKDOWN SUPPORTED
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  className="markdown-editor-input"
                  value={draft.content}
                  onChange={(event) => update("content", event.target.value)}
                  placeholder={"从这里开始写。\n\n## 一个小标题\n\n正文、列表、引用与代码块都支持 Markdown。\n\n- 列出你的想法\n- 记录一个细节"}
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="markdown-preview post-markdown-preview">
                {draft.content ? (
                  <MarkdownRenderer content={draft.content} />
                ) : (
                  <p className="admin-muted">还没有内容可以预览。</p>
                )}
              </div>
            )}
            <div className="editor-status-bar">
              <span>{plainLength.toLocaleString("zh-CN")} 字符</span>
              <span>约 {estimatedMinutes} 分钟阅读</span>
              <span>{draft.published ? "已发布" : "草稿状态"}</span>
            </div>
          </Card>

          <div className="admin-form-foot">
            <Link to="/admin/posts" className="btn btn-ghost btn-sm">
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
              {saving ? "保存中" : draft.published ? "保存并发布" : "保存草稿"}
            </button>
          </div>
        </div>

        <aside className="admin-col-side">
          <Card title="发布设置">
            <div className="toggle-stack">
              <Toggle
                checked={draft.published}
                onChange={(value) => update("published", value)}
                label="公开发布"
                description="关闭后，文章仅作为草稿保存。"
              />
            </div>
            <FormField
              label="发布时间"
              htmlFor="post-published-at"
              hint="留空则在发布时自动记录当前时间。"
            >
              <input
                id="post-published-at"
                className="input"
                type="datetime-local"
                value={draft.publishedAtLocal}
                onChange={(event) =>
                  update("publishedAtLocal", event.target.value)
                }
              />
            </FormField>
            <div className={`publish-summary ${draft.published ? "is-live" : ""}`}>
              <span />
              {draft.published
                ? "保存后，所有访客都能看到这篇文章。"
                : "这篇文章还停留在你的私人雷达里。"}
            </div>
          </Card>

          <Card title="封面图" description="可选。推荐 1200 × 675。">
            <div className="cover-preview post-cover-preview">
              <span>
                {draft.title.slice(0, 1).toUpperCase() || "文"}
              </span>
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
              htmlFor="post-cover"
              hint="支持站内路径或图床 https 链接。"
            >
              <input
                id="post-cover"
                className="input"
                value={draft.coverUrl}
                onChange={(event) => update("coverUrl", event.target.value)}
                placeholder="/images/writing-dark.svg"
                maxLength={800}
              />
            </FormField>
          </Card>

          <Card title="写作提示">
            <ul className="admin-tips">
              <li>
                <PenLine size={14} />
                先用一句话写下核心观点，再展开论证。
              </li>
              <li>小标题可以让长文更容易被扫描和记住。</li>
              <li>如果草稿还没准备好，关闭公开发布即可。</li>
            </ul>
          </Card>

          {!isNew ? (
            <Card title="危险操作">
              <p className="admin-muted admin-danger-copy">
                删除后，文章和公开链接都会永久消失。
              </p>
              <button
                type="button"
                className="btn btn-danger btn-sm admin-delete-button"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={14} />
                删除这篇文章
              </button>
            </Card>
          ) : null}
        </aside>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        title="删除这篇文章？"
        description={`「${draft.title || "未命名文章"}」将被永久删除，此操作无法撤销。`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
      />
    </div>
  );
}
