import { Link } from "react-router-dom";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { useSite } from "../lib/site-context";
import { LogoMark } from "./Brand";
import { SocialLinks } from "./SocialLinks";

const footerLinks = [
  { label: "首页", to: "/" },
  { label: "关于我", to: "/#about" },
  { label: "项目", to: "/#projects" },
  { label: "博客", to: "/blog" },
  { label: "联系", to: "/#contact" },
];

export function Footer() {
  const { profile, settings } = useSite();
  const year = new Date().getFullYear();
  const wordmark = (profile.latinName || profile.name)
    .replace(/\s+/g, " ")
    .trim();

  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <div className="footer-intro">
            <div className="footer-brand">
              <LogoMark />
              <span>{profile.name}</span>
            </div>
            <p>{settings.footerText || profile.tagline}</p>
            <a href={`mailto:${profile.email}`} className="footer-mail">
              {profile.email}
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="footer-columns">
            <div>
              <p className="footer-label">导航</p>
              <nav aria-label="页脚导航">
                {footerLinks.map((link) => (
                  <Link key={link.label} to={link.to}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <p className="footer-label">在其他地方</p>
              <SocialLinks socials={profile.socials} />
              <p className="footer-location">{profile.location}</p>
            </div>
          </div>
        </div>

        <div className="footer-wordmark" aria-hidden="true">
          {wordmark}
        </div>

        <div className="footer-bottom">
          <p>
            © {year} {profile.name}. {settings.footerText}
          </p>
          <div className="footer-bottom-links">
            <span>Built with Cloudflare</span>
            <Link to="/admin" className="admin-link">
              <LockKeyhole size={12} />
              管理后台
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
