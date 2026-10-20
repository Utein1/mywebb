import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Download,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useSite } from "../lib/site-context";
import { usePageMeta } from "../lib/usePageMeta";
import { initials, isSafeLink } from "../lib/format";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/Brand";
import { SocialLinks } from "../components/SocialLinks";
import { SkillBoard } from "../components/SkillBoard";
import { ProjectCard } from "../components/ProjectCard";
import { ContactForm } from "../components/ContactForm";
import { formatShortDate } from "../lib/format";

function projectSpan(index: number, count: number): string {
  if (count === 1) return "span-12";
  if (count === 2) return "span-6";
  if (count === 3) return ["span-7", "span-5", "span-12"][index];
  return ["span-7", "span-5", "span-5", "span-7"][index % 4];
}

export function HomePage() {
  const { profile, settings, skills, projects, posts } = useSite();
  usePageMeta({
    title: settings.siteTitle,
    description: settings.siteDescription,
  });

  const visibleProjects = projects.slice(0, 4);
  const latestPosts = posts.slice(0, 3);
  const orbitSkills = skills.slice(0, 3);
  const hasResume = Boolean(profile.resumeUrl && isSafeLink(profile.resumeUrl));

  return (
    <div className="home-page">
      <section className="hero" id="top">
        <div className="shell hero-shell">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="status-dot" />
              {profile.availability || "开放新的合作可能"}
            </div>
            <p className="hero-greeting">{profile.greeting}</p>
            <h1 className="hero-name">
              {profile.name}
              <span className="hero-period" aria-hidden="true" />
            </h1>
            <div className="hero-role">
              <span>{profile.role}</span>
              <span className="hero-role-rule" />
              <span className="hero-role-latin">
                {profile.latinName || "PORTFOLIO 2026"}
              </span>
            </div>
            <p className="hero-tagline">{profile.tagline}</p>
            <div className="hero-actions">
              <Link to="/#projects" className="btn btn-primary">
                探索我的作品
                <ArrowDown size={16} />
              </Link>
              {hasResume ? (
                <a
                  href={profile.resumeUrl}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Download size={16} />
                  下载简历
                </a>
              ) : (
                <Link to="/#about" className="btn btn-secondary">
                  了解更多
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <div className="hero-foot">
              <div className="hero-location">
                <MapPin size={14} />
                {profile.location}
              </div>
              <span className="hero-foot-divider" />
              <SocialLinks socials={profile.socials} />
            </div>
          </div>

          <div className="hero-visual" aria-label={`${profile.name} 的个人视觉`}>
            <div className="orbit-stage">
              <div className="orbit-glow" aria-hidden="true" />
              <div className="orbit-ring orbit-ring-outer" aria-hidden="true" />
              <div className="orbit-ring orbit-ring-inner" aria-hidden="true" />
              <div className="orbit-crosshair" aria-hidden="true" />
              <div className="orbit-avatar">
                <div className="avatar-fallback" aria-hidden="true">
                  {initials(profile.name)}
                </div>
                {profile.avatarUrl && isSafeLink(profile.avatarUrl) ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.name} 的头像`}
                    onError={(event) => {
                      event.currentTarget.style.opacity = "0";
                    }}
                  />
                ) : null}
              </div>
              {orbitSkills.map((skill, index) => (
                <span
                  key={skill.id}
                  className={`orbit-node orbit-node-${index + 1}`}
                >
                  <span />
                  {skill.name}
                </span>
              ))}
              <div className="floating-card floating-focus">
                <Sparkles size={15} />
                <div>
                  <span>正在关注</span>
                  <strong>{profile.currentFocus || "持续创造"}</strong>
                </div>
              </div>
              {profile.location ? (
                <div className="floating-card floating-location">
                  <MapPin size={15} />
                  <span>{profile.location}</span>
                </div>
              ) : null}
              <span className="orbit-year" aria-hidden="true">
                EST. 2020
              </span>
            </div>
          </div>

          <div className="hero-footer">
            <div className="hero-stats">
              {profile.yearsExperience > 0 ? (
                <div>
                  <strong>
                    {String(profile.yearsExperience).padStart(2, "0")}
                    <em>+</em>
                  </strong>
                  <span>年产品经验</span>
                </div>
              ) : null}
              <div>
                <strong>{String(projects.length).padStart(2, "0")}</strong>
                <span>个公开项目</span>
              </div>
              <div>
                <strong>{String(posts.length).padStart(2, "0")}</strong>
                <span>篇公开文章</span>
              </div>
            </div>
            <a href="#about" className="scroll-cue">
              <span>SCROLL TO EXPLORE</span>
              <span className="scroll-cue-line" />
            </a>
          </div>
        </div>
      </section>

      <section className="section about-section" id="about">
        <Reveal className="shell">
          <SectionHeading
            eyebrow="ABOUT / 01"
            title={
              <>
                把复杂的事，<br />
                <span className="accent-text">做得自然。</span>
              </>
            }
            description="我相信优秀的产品既需要工程的严谨，也需要设计的直觉。"
          />
          <div className="about-grid">
            <div className="about-narrative">
              {profile.bio.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <div className="about-actions">
                <a
                  href={`mailto:${profile.email}`}
                  className="text-link"
                >
                  <Mail size={15} />
                  和我聊聊
                  <ArrowUpRight size={14} />
                </a>
                {hasResume ? (
                  <a
                    href={profile.resumeUrl}
                    className="text-link muted-link"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Download size={15} />
                    下载简历
                  </a>
                ) : null}
              </div>
            </div>

            <aside className="about-panel">
              <div className="about-panel-head">
                <p className="eyebrow">PROFILE / NOW</p>
                {profile.availability ? (
                  <span className="availability-chip">
                    <span />
                    {profile.availability}
                  </span>
                ) : null}
              </div>
              <dl className="profile-facts">
                <div>
                  <dt>所在地</dt>
                  <dd>{profile.location || "自由生长"}</dd>
                </div>
                <div>
                  <dt>当前专注</dt>
                  <dd>{profile.currentFocus || "长期主义的产品创造"}</dd>
                </div>
                <div>
                  <dt>邮箱</dt>
                  <dd>
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                  </dd>
                </div>
              </dl>
              <div className="about-panel-foot">
                <SocialLinks socials={profile.socials} />
                <span>保持开放，保持好奇。</span>
              </div>
            </aside>
          </div>
        </Reveal>
      </section>

      {skills.length > 0 ? (
        <section className="section skills-section" id="skills">
          <Reveal className="shell">
            <SectionHeading
              eyebrow="CAPABILITIES / 02"
              title={
                <>
                  工具会变，<br />
                  判断力不会。
                </>
              }
              description="从界面到数据库，我习惯完整地理解一个产品。"
              action={
                <span className="section-counter">
                  {String(skills.length).padStart(2, "0")} SKILLS
                </span>
              }
            />
            <SkillBoard skills={skills} />
          </Reveal>
        </section>
      ) : null}

      {projects.length > 0 ? (
        <section className="section projects-section" id="projects">
          <Reveal className="shell">
            <SectionHeading
              eyebrow="SELECTED WORK / 03"
              title={
                <>
                  做过一些，<br />
                  值得被看见的事。
                </>
              }
              description="每个项目都从一个真实的问题出发，以被使用作为终点。"
              action={
                <Link to="/projects" className="link-arrow">
                  全部项目
                  <ArrowUpRight size={16} />
                </Link>
              }
            />
            <div className="project-grid">
              {visibleProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  spanClass={projectSpan(index, visibleProjects.length)}
                />
              ))}
            </div>
          </Reveal>
        </section>
      ) : null}

      <section className="section writing-section" id="writing">
        <Reveal className="shell">
          <SectionHeading
            eyebrow="NOTES / 04"
            title={
              <>
                写作是另一种<br />
                整理思绪的方式。
              </>
            }
            description="关于设计、工程，以及如何把产品做深一点。"
            action={
              <Link to="/blog" className="link-arrow">
                全部文章
                <ArrowUpRight size={16} />
              </Link>
            }
          />
          {latestPosts.length > 0 ? (
            <div className="post-preview-list">
              {latestPosts.map((post, index) => (
                <article className="post-preview" key={post.id}>
                  <Link to={`/blog/${post.slug}`}>
                    <div className="post-preview-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="post-preview-main">
                      <div className="post-preview-meta">
                        <time dateTime={post.publishedAt ?? post.createdAt}>
                          {formatShortDate(post.publishedAt ?? post.createdAt)}
                        </time>
                        <span>{post.readingMinutes} 分钟阅读</span>
                      </div>
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                    </div>
                    <div className="post-preview-side">
                      <div className="post-tags">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                      <span className="post-preview-arrow">
                        <ArrowUpRight size={19} />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-note">第一篇文章正在路上。</p>
          )}
        </Reveal>
      </section>

      <section className="section contact-section" id="contact">
        <Reveal className="shell">
          <div className="contact-grid">
            <div className="contact-copy">
              <p className="eyebrow">CONTACT / 05</p>
              <h2>
                有想法？
                <br />
                让我们一起
                <br />
                <span className="accent-text">把它做出来。</span>
              </h2>
              <p>
                无论是产品合作、技术咨询，还是想聊聊某个还没成形的念头，都欢迎写信给我。
              </p>
              <a className="contact-email" href={`mailto:${profile.email}`}>
                <span>{profile.email}</span>
                <span className="contact-email-icon">
                  <ArrowUpRight size={20} />
                </span>
              </a>
              <div className="contact-meta">
                <span>
                  <MapPin size={14} />
                  {profile.location}
                </span>
                <SocialLinks socials={profile.socials} />
              </div>
            </div>
            <div className="contact-form-card">
              <div className="contact-form-head">
                <p className="eyebrow">START A CONVERSATION</p>
                <span>通常 1–2 天回复</span>
              </div>
              <ContactForm />
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
