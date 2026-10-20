import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useSite } from "../lib/site-context";
import { usePageMeta } from "../lib/usePageMeta";
import { projectSpans } from "../lib/layout";
import { ProjectCard } from "../components/ProjectCard";
import { SectionHeading } from "../components/Brand";
import { Reveal } from "../components/Reveal";

export function ProjectsPage() {
  const { projects, settings } = useSite();
  usePageMeta({
    title: `项目档案 · ${settings.siteTitle}`,
    description: "林川的作品档案：产品、设计系统与数字体验。",
  });

  const spans = projectSpans(projects.length);

  return (
    <div className="archive-page">
      <section className="page-hero shell">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} />
          返回首页
        </Link>
        <p className="eyebrow">ARCHIVE / SELECTED WORK</p>
        <h1>
          选择做一些
          <br />
          <span className="accent-text">真正有用的事。</span>
        </h1>
        <div className="page-hero-meta">
          <span>{String(projects.length).padStart(2, "0")} 个公开项目</span>
          <span>2024 — 2026</span>
          <span>产品 · 工程 · 设计</span>
        </div>
      </section>

      <section className="section archive-content">
        <Reveal className="shell">
          {projects.length > 0 ? (
            <div className="project-grid">
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  spanClass={spans[index]}
                />
              ))}
            </div>
          ) : (
            <p className="empty-note">项目正在整理中，很快见面。</p>
          )}
        </Reveal>
      </section>

      <section className="section archive-cta">
        <Reveal className="shell archive-cta-inner">
          <SectionHeading
            eyebrow="NEXT / COLLABORATION"
            title={
              <>
                你的项目，
                <br />
                也许可以成为下一个。
              </>
            }
            description="目前开放产品设计、全栈开发与长期顾问合作。"
            action={
              <Link to="/#contact" className="btn btn-primary">
                开始聊聊
                <ArrowUpRight size={16} />
              </Link>
            }
          />
        </Reveal>
      </section>
    </div>
  );
}
