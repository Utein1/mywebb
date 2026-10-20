import { useState, type FormEvent } from "react";
import {
  KeyRound,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../components/Toast";
import { useAdmin } from "../context";
import {
  AdminPageHeader,
  Card,
  FormField,
  formatApiError,
} from "../ui";

export function AccountAdminPage() {
  const { username, setUsername } = useAdmin();
  const { showToast } = useToast();
  const [formUsername, setFormUsername] = useState(username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const passwordAttempted = newPassword.length > 0 || confirmPassword.length > 0;
  const passwordLongEnough = newPassword.length >= 12;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(formUsername)) {
      setError("用户名只能包含 3–32 位字母、数字、下划线和连字符。");
      return;
    }
    if (!currentPassword) {
      setError("修改账号信息需要验证当前密码。");
      return;
    }
    if (passwordAttempted && !passwordLongEnough) {
      setError("新密码至少需要 12 个字符。");
      return;
    }
    if (passwordAttempted && !passwordsMatch) {
      setError("两次输入的新密码不一致。");
      return;
    }

    setSaving(true);
    try {
      const result = await api.auth.updateAccount({
        username: formUsername,
        currentPassword,
        newPassword: newPassword || undefined,
      });
      setUsername(result.username);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(result.message);
    } catch (caught) {
      setError(formatApiError(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page account-admin-page">
      <AdminPageHeader
        eyebrow="SECURITY / ACCOUNT"
        title="账号与安全"
        description="管理管理员凭据。这里的修改会立即生效。"
        actions={
          <button
            type="submit"
            form="account-form"
            className="btn btn-primary btn-sm"
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle size={14} className="spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "更新中" : "保存更改"}
          </button>
        }
      />

      {error ? <p className="form-error admin-form-error">{error}</p> : null}

      <form id="account-form" onSubmit={handleSubmit} className="admin-two-col">
        <div className="admin-col-main">
          <Card title="管理员账号" description="用于登录这个内容控制台。">
            <div className="admin-form-grid">
              <FormField
                label="用户名"
                htmlFor="account-username"
                hint="3–32 位字母、数字、下划线或连字符。"
                required
              >
                <input
                  id="account-username"
                  className="input"
                  value={formUsername}
                  onChange={(event) => setFormUsername(event.target.value)}
                  autoComplete="username"
                  maxLength={32}
                />
              </FormField>
              <FormField
                label="当前密码"
                htmlFor="account-current"
                hint="保存任何账号修改都需要验证。"
                required
              >
                <input
                  id="account-current"
                  className="input"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="输入当前密码"
                  maxLength={128}
                />
              </FormField>
            </div>
          </Card>

          <Card
            title="修改密码"
            description="如果不修改密码，将下面两栏留空即可。"
          >
            <div className="admin-form-grid">
              <FormField
                label="新密码"
                htmlFor="account-new"
                hint="至少 12 个字符，建议使用长密码短语。"
              >
                <input
                  id="account-new"
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="留空则不修改"
                  maxLength={128}
                />
              </FormField>
              <FormField
                label="确认新密码"
                htmlFor="account-confirm"
                hint={
                  passwordAttempted && !passwordsMatch
                    ? "两次输入不一致。"
                    : "再次输入新密码。"
                }
                error={
                  passwordAttempted && newPassword && !passwordsMatch
                    ? "两次输入的新密码不一致。"
                    : undefined
                }
              >
                <input
                  id="account-confirm"
                  className="input"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="再次输入新密码"
                  maxLength={128}
                />
              </FormField>
            </div>
            {passwordAttempted ? (
              <div className="password-strength">
                <span
                  className={
                    passwordLongEnough ? "is-strong" : "is-weak"
                  }
                >
                  {passwordLongEnough ? <ShieldCheck size={14} /> : <KeyRound size={14} />}
                  {passwordLongEnough
                    ? "密码长度符合要求"
                    : `还需要 ${Math.max(0, 12 - newPassword.length)} 个字符`}
                </span>
              </div>
            ) : null}
          </Card>

          <div className="admin-form-foot">
            <span className="admin-form-foot-note">
              修改密码后，其他设备上的登录会话会立即失效。
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
              {saving ? "更新中" : "保存更改"}
            </button>
          </div>
        </div>

        <aside className="admin-col-side">
          <Card title="安全概览">
            <div className="security-list">
              <div>
                <span className="security-icon">
                  <UserRound size={16} />
                </span>
                <div>
                  <strong>单一管理员</strong>
                  <p>当前站点只有一个管理员账号，避免权限分散。</p>
                </div>
              </div>
              <div>
                <span className="security-icon">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <strong>安全会话</strong>
                  <p>采用 HttpOnly Cookie 与数据库会话，7 天自动过期。</p>
                </div>
              </div>
              <div>
                <span className="security-icon">
                  <KeyRound size={16} />
                </span>
                <div>
                  <strong>加盐哈希</strong>
                  <p>密码以 PBKDF2-SHA256 加盐哈希存储，不保存明文。</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="账号恢复">
            <p className="admin-muted">
              管理员密码无法通过邮件找回。请将密码保存在可信的密码管理器中。
            </p>
            <p className="admin-muted">
              如果确实遗失，可通过 Cloudflare D1 控制台删除 admins 表中的记录，
              然后重新访问 <code>/admin/setup</code> 初始化账号。具体命令见项目 README。
            </p>
          </Card>
        </aside>
      </form>
    </div>
  );
}
