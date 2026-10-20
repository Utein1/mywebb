import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Copy,
  Mail,
} from "lucide-react";
import type { Post } from "../../shared/types";
import { api } from "../lib/api";
import { useSite } from "../lib/site-context";
import { usePageMeta } from "../lib/usePageMeta";
import { formatShortDate, initials, isSafeLink } from "../lib/format";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { PageLoader } from "../components/Brand";
import { useToast } from "../components/Toast";
import { NotFoundPage } from "./NotFoundPage";

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const element = document.documentElement;
      const max = element.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="reading-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { posts, settings, profile } = useSite();
  const { showToast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  usePageMeta({
    title: post ? `${post.title} · ${profile.name}` : `阅读 · ${settings.siteTitle}`,
    description: post?.excerpt ?? settings.siteDescription,
    image: post?.coverUrl ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setLoading(false);
      setError("文章不存在。");
      return;
    }
    setLoading(true);
    setError("");
    api
      .getPost(slug)
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "文章加载失败。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  if (loading) {
    return (
      <div className="article-loading">
        <PageLoader label="正在展开文章" />
      </div>
    );
  }

  if (error || !post) {
    if (error.includes("不存在")) return <NotFoundPage />;
    return (
      <div className="article-error shell">
        <p className="eyebrow">SIGNAL LOST</p>
        <h1>文章暂时没有抵达</h1>
        <p>{error}</p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setReloadKey((value) => value + 1)}
        >
          重新加载
        </button>
      </div>
    );
  }

  const currentIndex = posts.findIndex((item) => item.id === post.id);
  const newer = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const older =
    currentIndex >= 0 && currentIndex < posts.length - 1
      ? posts[currentIndex + 1]
      : null;
  const hasCover = post.coverUrl && isSafeLink(post.coverUrl);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("文章链接已复制");
    } catch {
      showToast("复制失败，请手动复制浏览器地址", "error");
    }
  };

  return (
    <div className="article-page">
      <ReadingProgress />
      <article>
        <header className="article-header shell">
          <Link to="/blog" className="back-link">
            <ArrowLeft size={15} />
            返回文章列表
          </Link>
          <div className="article-tags">
            {post.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <h1>{post.title}</h1>
          <p className="article-excerpt">{post.excerpt}</p>
          <div className="article-meta">
            <div className="article-author-mini">
              <span className="author-avatar">
                {profile.avatarUrl && isSafeLink(profile.avatarUrl) ? (
                  <img src={profile.avatarUrl} alt="" />
                ) : (
                  initials(profile.name)
                )}
              </span>
              <div>
                <strong>{profile.name}</strong>
                <span>{profile.role}</span>
              </div>
            </div>
            <span className="article-meta-divider" />
            <time dateTime={post.publishedAt ?? post.createdAt}>
              {formatShortDate(post.publishedAt ?? post.createdAt)}
            </time>
            <span className="article-meta-item">
              <Clock3 size={14} />
              {post.readingMinutes} 分钟阅读
            </span>
            <button
              type="button"
              className="article-copy"
              onClick={copyLink}
            >
              <Copy size={14} />
              复制链接
            </button>
          </div>
        </header>

        {hasCover ? (
          <div className="shell article-cover">
            <img src={post.coverUrl} alt="" />
          </div>
        ) : null}

        <div className="shell article-body">
          <MarkdownRenderer content={post.content} />
        </div>

        <footer className="shell article-footer">
          <div className="article-end-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="article-author-card">
            <span className="author-avatar author-avatar-large">
              {profile.avatarUrl && isSafeLink(profile.avatarUrl) ? (
                <img src={profile.avatarUrl} alt={`${profile.name} 的头像`} />
              ) : (
                initials(profile.name)
              )}
            </span>
            <div>
              <p className="eyebrow">WRITTEN BY</p>
              <h2>{profile.name}</h2>
              <p>{profile.tagline}</p>
            </div>
            <a
              href={`mailto:${profile.email}`}
              className="btn btn-secondary"
            >
              <Mail size={15} />
              写信给我
            </a>
          </div>

          <div className="article-nav">
            {newer ? (
              <Link to={`/blog/${newer.slug}`} className="article-nav-link">
                <span>
                  <ArrowLeft size={14} />
                  较新一篇
                </span>
                <strong>{newer.title}</strong>
              </Link>
            ) : (
              <span />
            )}
            {older ? (
              <Link
                to={`/blog/${older.slug}`}
                className="article-nav-link article-nav-next"
              >
                <span>
                  较早一篇
                  <ArrowRight size={14} />
                </span>
                <strong>{older.title}</strong>
              </Link>
            ) : (
              <span />
            )}
          </div>

          <div className="article-contact-strip">
            <p>如果这篇文章让你想到点什么，欢迎来信。</p>
            <Link to="/#contact" className="link-arrow">
              开始一段对话
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
