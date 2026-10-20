import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "../../shared/types";
import { isSafeLink } from "../lib/format";

function ProjectCover({ project }: { project: Project }) {
  const safeCover = project.coverUrl && isSafeLink(project.coverUrl);
  return (
    <div className="project-cover">
      <div className="project-cover-fallback" aria-hidden="true">
        <span>{project.title.slice(0, 1).toUpperCase()}</span>
      </div>
      {safeCover ? (
        <img
          src={project.coverUrl}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
        />
      ) : null}
      <div className="project-cover-scan" aria-hidden="true" />
      <span className="project-open">
        查看案例
        <ArrowUpRight size={14} />
      </span>
    </div>
  );
}

export function ProjectCard({
  project,
  index,
  spanClass = "",
}: {
  project: Project;
  index: number;
  spanClass?: string;
}) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className={`project-card ${spanClass}`.trim()}
      aria-label={`查看项目：${project.title}`}
    >
      <ProjectCover project={project} />
      <div className="project-card-body">
        <div className="project-card-meta">
          <span>{project.year || "PROJECT"}</span>
          <span className="project-index">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="project-card-title-row">
          <h3>{project.title}</h3>
          <span className="project-arrow">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <p>{project.summary}</p>
        <div className="project-tech">
          {project.tech.slice(0, 5).map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
