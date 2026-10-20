import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { usePageMeta } from "../lib/usePageMeta";

export function NotFoundPage() {
  usePageMeta({
    title: "页面未找到 · 林川",
    description: "这条轨道上暂时没有内容。",
  });

  return (
    <div className="notfound-page">
      <div className="shell notfound-inner">
        <div className="notfound-visual" aria-hidden="true">
          <span className="notfound-code">404</span>
          <span className="notfound-orbit notfound-orbit-a" />
          <span className="notfound-orbit notfound-orbit-b" />
          <span className="notfound-dot" />
        </div>
        <p className="eyebrow">LOST IN ORBIT</p>
        <h1>
          这颗星球
          <br />
          还没有被绘制。
        </h1>
        <p className="notfound-copy">
          你访问的页面可能已经移动，或者从未存在过。不如回到轨道，重新出发。
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-primary">
            <Compass size={16} />
            回到首页
          </Link>
          <Link to="/blog" className="btn btn-secondary">
            去读点东西
            <ArrowRight size={16} />
          </Link>
        </div>
        <Link to="/" className="back-link notfound-back">
          <ArrowLeft size={15} />
          返回轨道
        </Link>
      </div>
    </div>
  );
}
