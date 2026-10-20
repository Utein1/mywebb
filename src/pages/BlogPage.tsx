import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Search,
  X,
} from "lucide-react";
import { useSite } from "../lib/site-context";
import { usePageMeta } from "../lib/usePageMeta";
import { formatShortDate } from "../lib/format";

export function BlogPage() {
  const { posts, settings } = useSite();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  usePageMeta({
    title: `写作 · ${settings.siteTitle}`,
    description: "关于设计、工程与慢思考的长期笔记。",
  });

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesTag = !activeTag || post.tags.includes(activeTag);
      if (!matchesTag) return false;
      if (!deferredQuery) return true;
      const haystack = [post.title, post.excerpt, ...post.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(deferredQuery);
    });
  }, [posts, activeTag, deferredQuery]);

  return (
    <div className="blog-page">
      <section className="blog-hero shell">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} />
          返回首页
        </Link>
        <div className="blog-hero-grid">
          <div>
            <p className="eyebrow">WRITING / FIELD NOTES</p>
            <h1>
              写下来，
              <br />
              才算真正
              <br />
              <span className="accent-text">想清楚。</span>
            </h1>
          </div>
          <div className="blog-hero-aside">
            <p>
              关于设计、工程、AI 与如何把产品做深一点的长期笔记。不追热点，只写值得留下来的东西。
            </p>
            <span className="blog-hero-count">
              {String(posts.length).padStart(2, "0")} ARTICLES / 2026
            </span>
          </div>
        </div>
      </section>

      <section className="blog-content shell">
        <div className="blog-filters">
          <label className="blog-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">搜索文章</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、摘要或标签"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="清除搜索"
              >
                <X size={14} />
              </button>
            ) : null}
          </label>
          <div className="blog-tag-filter" aria-label="按标签筛选">
            <button
              type="button"
              className={!activeTag ? "is-active" : ""}
              onClick={() => setActiveTag("")}
              aria-pressed={!activeTag}
            >
              全部
            </button>
            {tags.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                className={activeTag === tag ? "is-active" : ""}
                onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                aria-pressed={activeTag === tag}
              >
                {tag}
                <span>{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="blog-result-meta">
          <span>
            {deferredQuery || activeTag
              ? `找到 ${filteredPosts.length} 篇文章`
              : "全部文章"}
          </span>
          <span>NEWEST FIRST</span>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="blog-list">
            {filteredPosts.map((post, index) => (
              <article className="blog-row" key={post.id}>
                <Link to={`/blog/${post.slug}`}>
                  <span className="blog-row-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="blog-row-meta">
                    <time dateTime={post.publishedAt ?? post.createdAt}>
                      {formatShortDate(post.publishedAt ?? post.createdAt)}
                    </time>
                    <span>{post.readingMinutes} 分钟</span>
                  </div>
                  <div className="blog-row-main">
                    <h2>{post.title}</h2>
                    <p>{post.excerpt}</p>
                    <div className="post-tags">
                      {post.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <span className="blog-row-arrow">
                    <ArrowUpRight size={20} />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="blog-empty">
            <p className="eyebrow">NO SIGNAL FOUND</p>
            <h2>这颗星球上暂时没有匹配的内容。</h2>
            <p>换个关键词，或者清除筛选再看看。</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setQuery("");
                setActiveTag("");
              }}
            >
              清除筛选
            </button>
          </div>
        )}

        <div className="blog-end-note">
          <span className="blog-end-line" />
          <p>
            想聊聊文章里的某个观点？
            <Link to="/#contact">
              写信给我
              <ArrowUpRight size={14} />
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
