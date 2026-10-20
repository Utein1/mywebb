import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { SitePayload } from "../../shared/types";
import { api } from "../lib/api";
import { SiteProvider } from "../lib/site-context";
import { Starfield } from "../components/Starfield";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { LogoMark, PageLoader } from "../components/Brand";
import { ScrollManager } from "../components/ScrollManager";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; site: SitePayload };

export function PublicLayout() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    api
      .getSite()
      .then((site) => {
        if (controller.signal.aborted) return;
        setState({ status: "ready", site });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "站点内容暂时无法载入。";
        setState({ status: "error", message });
      });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (state.status !== "ready") return;
    const { settings } = state.site;
    document.documentElement.style.setProperty(
      "--accent",
      settings.accentColor,
    );
    document.title = settings.siteTitle;
  }, [state]);

  if (state.status === "loading") {
    return (
      <div className="app-loading">
        <Starfield />
        <div className="loading-center">
          <PageLoader label="正在校准星图" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="app-loading">
        <Starfield />
        <div className="load-error-card">
          <LogoMark className="error-mark" />
          <p className="eyebrow">CONNECTION LOST</p>
          <h1>内容暂时没有抵达</h1>
          <p>{state.message}</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            <RefreshCw size={16} />
            重新加载
          </button>
          <span className="load-error-hint">
            <AlertTriangle size={13} />
            如果刚刚完成部署，请先执行数据库迁移
          </span>
        </div>
      </div>
    );
  }

  return (
    <SiteProvider value={state.site}>
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
      <Starfield accent={state.site.settings.accentColor} />
      <ScrollManager />
      <div className="site-shell">
        <Header />
        <main id="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SiteProvider>
  );
}
