import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Code2,
} from "lucide-react";
import { useSite } from "../lib/site-context";
import { usePageMeta } from "../lib/usePageMeta";
import { isSafeLink } from "../lib/format";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { NotFoundPage } from "./NotFoundPage";

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { projects, settings, profile } = useSite();
  const project = projects.find((item) => item.slug === slug);

  usePageMeta({
    title: project
      ? `${project.title} · ${settings.siteTitle}`
      : `项目未找到 · ${settings.siteTitle}`,
    description: project?.summary,
    image: project?.coverUrl,
  });

  if (!project) {
    return <NotFoundPage />;
  }

  const currentIndex = projects.findIndex((item) => item.id === project.id);
  const nextProject =
    projects.length > 1
      ? projects[(currentIndex + 1) % projects.length]
      : null;
  const hasCover = project.coverUrl && isSafeLink(project.coverUrl);
  const hasDemo = project.demoUrl && isSafeLink(project.demoUrl);
  const hasRepo = project.repoUrl && isSafeLink(project.repoUrl);

  return (
    <div className="project-detail-page">
      <article>
        <header className="project-detail-hero shell">
          <Link to="/projects" className="back-link">
            <ArrowLeft size={15} />
            全部项目
          </Link>
          <div className="project-detail-kicker">
            <span>{project.year || "PROJECT"}</span>
            <span className="dot-separator" />
            <span>{project.tech.slice(0, 2).join(" / ")}</span>
          </div>
          <h1>{project.title}</h1>
          <p className="project-detail-lede">{project.summary}</p>
          <div className="project-detail-actions">
            {hasDemo ? (
              <a
                href={project.demoUrl}
                className="btn btn-primary"
                target="_blank"
                rel="noreferrer noopener"
              >
                访问线上项目
                <ArrowUpRight size={16} />
              </a>
            ) : null}
            {hasRepo ? (
              <a
                href={project.repoUrl}
                className="btn btn-secondary"
                target="_blank"
                rel="noreferrer noopener"
              >
                查看源码
                <ArrowUpRight size={16} />
              </a>
            ) : null}
            {!hasDemo && !hasRepo ? (
              <Link to="/#contact" className="btn btn-secondary">
                聊聊类似的项目
                <ArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </header>

        <div className="shell">
          <div className="project-detail-cover">
            <div className="project-detail-cover-fallback" aria-hidden="true">
              {project.title}
            </div>
            {hasCover ? (
              <img
                src={project.coverUrl}
                alt={`${project.title} 项目封面`}
              />
            ) : null}
          </div>
        </div>

        <div className="shell project-detail-body">
          <aside className="project-facts">
            <p className="eyebrow">PROJECT INFO</p>
            <dl>
              <div>
                <dt>
                  <CalendarDays size={14} />
                  年份
                </dt>
                <dd>{project.year || "—"}</dd>
              </div>
              <div>
                <dt>
                  <Code2 size={14} />
                  技术
                </dt>
                <dd>
                  <div className="project-facts-tech">
                    {project.tech.map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                </dd>
              </div>
              <div>
                <dt>类型</dt>
                <dd>产品设计 / 全栈开发</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd className="status-live">
                  <span />
                  已发布
                </dd>
              </div>
            </dl>
            <Link to="/#contact" className="project-facts-contact">
              <span>有相似的需求？</span>
              <strong>
                联系我
                <ArrowUpRight size={14} />
              </strong>
            </Link>
          </aside>

          <div className="project-story">
            {project.description ? (
              <MarkdownRenderer content={project.description} />
            ) : (
              <p>{project.summary}</p>
            )}
          </div>
        </div>
      </article>

      {nextProject ? (
        <section className="next-project-section">
          <div className="shell">
            <p className="eyebrow">NEXT PROJECT</p>
            <Link to={`/projects/${nextProject.slug}`} className="next-project">
              <div>
                <span>{nextProject.year || "PROJECT"}</span>
                <h2>{nextProject.title}</h2>
                <p>{nextProject.summary}</p>
              </div>
              <span className="next-project-arrow">
                <ArrowUpRight size={28} />
              </span>
            </Link>
          </div>
        </section>
      ) : null}

      <section className="section project-contact-strip">
        <div className="shell project-contact-inner">
          <div>
            <p className="eyebrow">LET&apos;S BUILD SOMETHING</p>
            <h2>有一个相似的想法？</h2>
          </div>
          <a href={`mailto:${profile.email}`} className="btn btn-primary">
            写信给我
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>
    </div>
  );
}
