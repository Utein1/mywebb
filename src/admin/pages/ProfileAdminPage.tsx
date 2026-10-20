import { useEffect, useState, type FormEvent } from "react";
import {
  AtSign,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import type { Profile } from "../../../shared/types";
import { api } from "../../lib/api";
import { initials, isSafeLink } from "../../lib/format";
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  Card,
  FormField,
  formatApiError,
} from "../ui";
import { useToast } from "../../components/Toast";

export function ProfileAdminPage() {
  const [form, setForm] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.admin
      .getProfile()
      .then((profile) => {
        if (!cancelled) setForm(profile);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(formatApiError(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateSocial = (
    index: number,
    field: "label" | "url",
    value: string,
  ) => {
    setForm((current) => {
      if (!current) return current;
      const socials = current.socials.map((social, socialIndex) =>
        socialIndex === index ? { ...social, [field]: value } : social,
      );
      return { ...current, socials };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setError("");
    setSaving(true);
    try {
      const updated = await api.admin.updateProfile(form);
      setForm(updated);
      showToast("个人资料已保存，线上页面已同步");
    } catch (caught) {
      setError(formatApiError(caught));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoading label="正在读取个人资料" />;
  if (error && !form) {
    return (
      <AdminError
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
    );
  }
  if (!form) return null;

  const avatarSafe = form.avatarUrl && isSafeLink(form.avatarUrl);

  return (
    <div className="admin-page profile-admin-page">
      <AdminPageHeader
        eyebrow="IDENTITY / PROFILE"
        title="个人资料"
        description="这些信息会出现在首页、关于我与页脚等位置。"
        actions={
          <button
            type="submit"
            form="profile-form"
            className="btn btn-primary btn-sm"
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Save size={15} />
            )}
            {saving ? "保存中" : "保存修改"}
          </button>
        }
      />

      {error ? <p className="form-error admin-form-error">{error}</p> : null}

      <form id="profile-form" onSubmit={handleSubmit} className="admin-two-col">
        <div className="admin-col-main">
          <Card title="基本信息" description="你是谁，以及你如何介绍自己。">
            <div className="admin-form-grid">
              <FormField label="姓名" htmlFor="profile-name" required>
                <input
                  id="profile-name"
                  className="input"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  maxLength={40}
                  required
                />
              </FormField>
              <FormField
                label="英文名 / 品牌字"
                htmlFor="profile-latin"
                hint="用于 Logo 和页脚大字，例如 LIN CHUAN。"
              >
                <input
                  id="profile-latin"
                  className="input"
                  value={form.latinName}
                  onChange={(event) => update("latinName", event.target.value)}
                  maxLength={60}
                />
              </FormField>
              <FormField label="身份 / 角色" htmlFor="profile-role" required>
                <input
                  id="profile-role"
                  className="input"
                  value={form.role}
                  onChange={(event) => update("role", event.target.value)}
                  maxLength={80}
                  required
                />
              </FormField>
              <FormField
                label="问候语"
                htmlFor="profile-greeting"
                hint="显示在首页姓名上方。"
                required
              >
                <input
                  id="profile-greeting"
                  className="input"
                  value={form.greeting}
                  onChange={(event) => update("greeting", event.target.value)}
                  maxLength={30}
                  required
                />
              </FormField>
              <FormField label="所在地" htmlFor="profile-location">
                <input
                  id="profile-location"
                  className="input"
                  value={form.location}
                  onChange={(event) => update("location", event.target.value)}
                  maxLength={80}
                />
              </FormField>
              <FormField label="联系邮箱" htmlFor="profile-email" required>
                <input
                  id="profile-email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  maxLength={120}
                  required
                />
              </FormField>
              <FormField
                label="工作年限"
                htmlFor="profile-years"
                hint="显示在首页数据栏。"
              >
                <input
                  id="profile-years"
                  className="input"
                  type="number"
                  min={0}
                  max={60}
                  value={form.yearsExperience}
                  onChange={(event) =>
                    update("yearsExperience", Number(event.target.value))
                  }
                />
              </FormField>
              <FormField
                label="档期 / 状态"
                htmlFor="profile-availability"
                hint="例如：目前可接受 2026 Q4 的新项目。"
              >
                <input
                  id="profile-availability"
                  className="input"
                  value={form.availability}
                  onChange={(event) =>
                    update("availability", event.target.value)
                  }
                  maxLength={120}
                />
              </FormField>
              <FormField
                label="头像地址"
                htmlFor="profile-avatar"
                hint="支持站内路径（/images/avatar.svg）或 https 图片链接。"
                full
              >
                <input
                  id="profile-avatar"
                  className="input"
                  value={form.avatarUrl}
                  onChange={(event) => update("avatarUrl", event.target.value)}
                  placeholder="/images/avatar.svg"
                  maxLength={800}
                />
              </FormField>
              <FormField
                label="简历地址"
                htmlFor="profile-resume"
                hint="可填入 PDF 链接，留空则首页隐藏下载按钮。"
                full
              >
                <input
                  id="profile-resume"
                  className="input"
                  value={form.resumeUrl}
                  onChange={(event) => update("resumeUrl", event.target.value)}
                  placeholder="https://…/resume.pdf"
                  maxLength={800}
                />
              </FormField>
            </div>
          </Card>

          <Card title="首页文案" description="用几句话建立第一印象。">
            <div className="admin-form-grid">
              <FormField
                label="一句话主张"
                htmlFor="profile-tagline"
                hint="显示在姓名与角色下方。"
                full
              >
                <textarea
                  id="profile-tagline"
                  className="input"
                  rows={3}
                  value={form.tagline}
                  onChange={(event) => update("tagline", event.target.value)}
                  maxLength={240}
                />
              </FormField>
              <FormField
                label="当前专注"
                htmlFor="profile-focus"
                hint="显示在首页轨道卡片。"
                full
              >
                <input
                  id="profile-focus"
                  className="input"
                  value={form.currentFocus}
                  onChange={(event) =>
                    update("currentFocus", event.target.value)
                  }
                  maxLength={120}
                  placeholder="例如：AI 原生体验与设计系统"
                />
              </FormField>
            </div>
          </Card>

          <Card
            title="关于我"
            description="支持分段。空行会被渲染成新的段落。"
          >
            <FormField
              label="个人介绍"
              htmlFor="profile-bio"
              hint={`${form.bio.length} / 6000 字符`}
              full
            >
              <textarea
                id="profile-bio"
                className="input admin-bio-input"
                rows={12}
                value={form.bio}
                onChange={(event) => update("bio", event.target.value)}
                maxLength={6000}
                required
              />
            </FormField>
          </Card>

          <Card
            title="社交链接"
            description="支持 http(s) 与 mailto 链接，最多 10 个。"
            actions={
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  update("socials", [
                    ...form.socials,
                    { label: "GitHub", url: "https://github.com/" },
                  ])
                }
                disabled={form.socials.length >= 10}
              >
                <Plus size={14} />
                添加链接
              </button>
            }
          >
            {form.socials.length > 0 ? (
              <div className="social-editor">
                {form.socials.map((social, index) => (
                  <div className="social-editor-row" key={index}>
                    <span className="social-editor-icon">
                      <AtSign size={15} />
                    </span>
                    <input
                      className="input"
                      value={social.label}
                      onChange={(event) =>
                        updateSocial(index, "label", event.target.value)
                      }
                      placeholder="平台名称"
                      aria-label={`社交平台 ${index + 1} 名称`}
                      maxLength={30}
                    />
                    <input
                      className="input"
                      value={social.url}
                      onChange={(event) =>
                        updateSocial(index, "url", event.target.value)
                      }
                      placeholder="https://… 或 mailto:…"
                      aria-label={`社交平台 ${index + 1} 链接`}
                      maxLength={500}
                    />
                    <button
                      type="button"
                      className="admin-icon-button danger"
                      onClick={() =>
                        update(
                          "socials",
                          form.socials.filter(
                            (_, socialIndex) => socialIndex !== index,
                          ),
                        )
                      }
                      aria-label={`删除 ${social.label || "社交链接"}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-muted">还没有社交链接，点击右上角添加。</p>
            )}
          </Card>

          <div className="admin-form-foot">
            <span className="admin-form-foot-note">
              所有内容保存后立即同步到公开页面。
            </span>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <Save size={15} />
              )}
              {saving ? "保存中" : "保存修改"}
            </button>
          </div>
        </div>

        <aside className="admin-col-side">
          <Card title="公开形象预览" description="访问者看到的个人卡片。">
            <div className="profile-preview">
              <div className="profile-preview-avatar">
                <span>{initials(form.name || "你的名字")}</span>
                {avatarSafe ? (
                  <img
                    src={form.avatarUrl}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </div>
              <p className="profile-preview-greeting">{form.greeting}</p>
              <h3>{form.name || "你的名字"}</h3>
              <p className="profile-preview-role">{form.role}</p>
              <p className="profile-preview-tagline">{form.tagline}</p>
              <div className="profile-preview-meta">
                <span>{form.location || "所在地"}</span>
                <span>{form.currentFocus || "当前专注"}</span>
              </div>
            </div>
          </Card>

          <Card title="填写建议">
            <ul className="admin-tips">
              <li>
                <UserRound size={14} />
                个人介绍建议保持 2–4 段，第一段用一句话说清楚你在做什么。
              </li>
              <li>
                头像推荐使用方形图片，页面上会自动裁切为圆形。
              </li>
              <li>
                如果暂时没有简历链接，留空即可，不会显示空白按钮。
              </li>
              <li>
                英文名会用于页脚的大型品牌字，建议使用大写字母。
              </li>
            </ul>
          </Card>
        </aside>
      </form>
    </div>
  );
}
