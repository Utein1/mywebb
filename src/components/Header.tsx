import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useSite } from "../lib/site-context";
import { Logo } from "./Brand";

const navItems = [
  { label: "关于", to: "/#about", section: "about" },
  { label: "能力", to: "/#skills", section: "skills" },
  { label: "项目", to: "/#projects", section: "projects" },
  { label: "写作", to: "/#writing", section: "writing" },
  { label: "博客", to: "/blog", section: "blog" },
];

export function Header() {
  const { profile } = useSite();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (location.pathname !== "/") {
      if (location.pathname.startsWith("/blog")) {
        setActiveSection("blog");
      } else if (location.pathname.startsWith("/projects")) {
        setActiveSection("projects");
      } else {
        setActiveSection("");
      }
      return;
    }
    const sections = ["about", "skills", "projects", "writing"]
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: [0.05, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [location.pathname]);

  const brandName = profile.latinName || profile.name;

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`.trim()}>
      <div className="header-inner shell">
        <Logo name={brandName} />
        <nav className="desktop-nav" aria-label="主导航">
          {navItems.map((item) => {
            const active =
              activeSection === item.section ||
              (item.section === "blog" && location.pathname.startsWith("/blog"));
            return (
              <Link
                key={item.label}
                to={item.to}
                className={active ? "is-active" : ""}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="header-actions">
          <Link to="/#contact" className="header-cta" aria-label="聊聊合作">
            <span>聊聊合作</span>
            <ArrowUpRight size={15} />
          </Link>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${open ? "is-open" : ""}`.trim()}>
        <div className="mobile-menu-inner shell">
          <p className="eyebrow">NAVIGATION</p>
          <nav aria-label="移动端导航">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.to}
                style={{ transitionDelay: `${80 + index * 40}ms` }}
                onClick={() => setOpen(false)}
              >
                <span className="mobile-index">0{index + 1}</span>
                {item.label}
                <ArrowUpRight size={18} />
              </Link>
            ))}
            <Link to="/#contact" onClick={() => setOpen(false)}>
              <span className="mobile-index">06</span>
              联系
              <ArrowUpRight size={18} />
            </Link>
          </nav>
          <div className="mobile-menu-foot">
            <p>{profile.location}</p>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </div>
        </div>
      </div>
    </header>
  );
}
