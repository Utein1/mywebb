import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-mark ${className}`.trim()} aria-hidden="true">
      <span className="logo-ring" />
      <span className="logo-core" />
      <span className="logo-satellite" />
    </span>
  );
}

export function Logo({
  name = "LIN CHUAN",
  to = "/",
}: {
  name?: string;
  to?: string;
}) {
  return (
    <Link to={to} className="brand" aria-label={`${name} 首页`}>
      <LogoMark />
      <span className="brand-copy">
        <span className="brand-name">{name}</span>
        <span className="brand-sub">ORBIT / PORTFOLIO</span>
      </span>
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="section-heading-main">
        <p className="eyebrow">
          <span className="eyebrow-line" />
          {eyebrow}
        </p>
        <h2>{title}</h2>
        {description ? <p className="section-description">{description}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}

export function Spinner({ label = "加载中" }: { label?: string }) {
  return (
    <span className="spinner-wrap" role="status" aria-label={label}>
      <span className="spinner" />
    </span>
  );
}

export function PageLoader({ label = "正在加载内容" }: { label?: string }) {
  return (
    <div className="page-loader">
      <LogoMark className="loader-mark" />
      <p>{label}</p>
      <span className="loader-line" />
    </div>
  );
}
