import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  Check,
  LoaderCircle,
  Monitor,
  Palette,
  Save,
} from "lucide-react";
import type { SiteSettings } from "../../../shared/types";
import { api } from "../../lib/api";
import { useToast } from "../../components/Toast";
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  Card,
  FormField,
  formatApiError,
} from "../ui";

const accentPresets = [
  { color: "#7cf5d0", name: "薄荷" },
  { color: "#7cc8ff", name: "晴空" },
  { color: "#b3a6ff", name: "星紫" },
  { color: "#ffc59c", name: "暮光" },
  { color: "#ff9eae", name: "珊瑚" },
  { color: "#d7ef8c", name: "新芽" },
];

export function SettingsAdminPage() {
  const [form, setForm] = useState<SiteSettings | null>(null);
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
      .getSettings()
      .then((settings) => {
        if (!cancelled) setForm(settings);
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

  const update = <K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K],
  ) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    if (!/^#[0-9a-fA-F]{6}$/.test(form.accentColor)) {
      setError("强调色需要是合法的 6 位十六进制颜色，例如 #7cf5d0。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await api.admin.updateSettings(form);
      setForm(updated);
      document.documentElement.style.setProperty(
        "--accent",
        updated.accentColor,
      );
      showToast("站点设置已保存，刷新公开页面即可看到最新效果");
    } catch (caught) {
      setError(formatApiError(caught));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoading label="正在读取站点设置" />;
  if (error && !form) {
    return (
      <AdminError
        message={error}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
    );
  }
  if (!form) return null;

  const accentValid = /^#[0-9a-fA-F]{6}$/.test(form.accentColor);
  const previewStyle = {
    "--preview-accent": accentValid ? form.accentColor : "#7cf5d0",
  } as CSSProperties;

  return (
    <div className="admin-page settings-admin-page">
      <AdminPageHeader
        eyebrow="CONFIGURATION / SITE"
        title="站点设置"
        description="控制站点标题、搜索描述、页脚与全局强调色。"
        actions={
          <button
            type="submit"
            form="settings-form"
            className="btn btn-primary btn-sm"
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle size={14} className="spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "保存中" : "保存设置"}
          </button>
        }
      />

      {error ? <p className="form-error admin-form-error">{error}</p> : null}

      <form id="settings-form" onSubmit={handleSubmit} className="admin-two-col">
        <div className="admin-col-main">
          <Card title="站点信息" description="用于浏览器标题、搜索结果和页脚。">
            <div className="admin-form-grid">
              <FormField
                label="站点标题"
                htmlFor="settings-title"
                hint="显示在浏览器标签页与社交分享标题中。"
                full
                required
              >
                <input
                  id="settings-title"
                  className="input"
                  value={form.siteTitle}
                  onChange={(event) => update("siteTitle", event.target.value)}
                  maxLength={80}
                  required
                />
              </FormField>
              <FormField
                label="站点描述"
                htmlFor="settings-description"
                hint="建议 60–160 字，会用于 SEO 描述。"
                full
              >
                <textarea
                  id="settings-description"
                  className="input"
                  rows={3}
                  value={form.siteDescription}
                  onChange={(event) =>
                    update("siteDescription", event.target.value)
                  }
                  maxLength={200}
                />
              </FormField>
              <FormField
                label="页脚文字"
                htmlFor="settings-footer"
                hint="显示在页脚介绍与版权信息中。"
                full
              >
                <input
                  id="settings-footer"
                  className="input"
                  value={form.footerText}
                  onChange={(event) => update("footerText", event.target.value)}
                  maxLength={120}
                />
              </FormField>
            </div>
          </Card>

          <Card
            title="主题强调色"
            description="用于按钮、高亮、进度条与星空中的强调光点。"
            actions={
              <span className="settings-color-value">
                {form.accentColor.toUpperCase()}
              </span>
            }
          >
            <div className="accent-presets">
              {accentPresets.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  className={`accent-preset ${form.accentColor.toLowerCase() === preset.color ? "is-active" : ""}`}
                  onClick={() => update("accentColor", preset.color)}
                  aria-label={`使用${preset.name}强调色`}
                  aria-pressed={form.accentColor.toLowerCase() === preset.color}
                >
                  <span style={{ background: preset.color }}>
                    {form.accentColor.toLowerCase() === preset.color ? (
                      <Check size={13} />
                    ) : null}
                  </span>
                  <em>{preset.name}</em>
                </button>
              ))}
            </div>
            <div className="custom-color-row">
              <label htmlFor="settings-color" className="custom-color-label">
                <Palette size={15} />
                自定义颜色
              </label>
              <div className="custom-color-inputs">
                <input
                  id="settings-color-picker"
                  type="color"
                  value={accentValid ? form.accentColor : "#7cf5d0"}
                  onChange={(event) =>
                    update("accentColor", event.target.value)
                  }
                  aria-label="选择强调色"
                />
                <input
                  id="settings-color"
                  className="input"
                  value={form.accentColor}
                  onChange={(event) =>
                    update("accentColor", event.target.value.trim())
                  }
                  maxLength={7}
                  aria-invalid={!accentValid}
                />
              </div>
            </div>
            {!accentValid ? (
              <small className="field-error">
                请输入合法的十六进制颜色，例如 #7cf5d0
              </small>
            ) : null}
          </Card>

          <div className="admin-form-foot">
            <span className="admin-form-foot-note">
              公开页面刷新后应用新设置。已打开的页面不会自动刷新。
            </span>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? "保存中" : "保存设置"}
            </button>
          </div>
        </div>

        <aside className="admin-col-side">
          <Card
            title="实时预览"
            description="颜色会立即反映在下方的预览中。"
          >
            <div className="settings-preview" style={previewStyle}>
              <div className="settings-preview-browser">
                <span />
                <span />
                <span />
                <em>{form.siteTitle || "你的站点"}</em>
              </div>
              <div className="settings-preview-body">
                <p className="eyebrow">YOUR NEXT BIG THING</p>
                <h3>把复杂的事，做得自然。</h3>
                <p>
                  预览中的强调色、按钮与高光会随着设置同步改变。
                </p>
                <span className="settings-preview-button">探索作品</span>
                <div className="settings-preview-line">
                  <span />
                </div>
              </div>
            </div>
          </Card>

          <Card title="颜色建议">
            <ul className="admin-tips">
              <li>
                <Monitor size={14} />
                深色背景下，明亮、低饱和的颜色更容易阅读。
              </li>
              <li>强调色主要用于按钮和少量高光，不建议大面积铺底。</li>
              <li>
                修改后如需要，可对比度检查工具确认按钮文字是否清晰。
              </li>
            </ul>
          </Card>
        </aside>
      </form>
    </div>
  );
}
