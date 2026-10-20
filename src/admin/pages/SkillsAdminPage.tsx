import { useEffect, useState } from "react";
import {
  Cpu,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { Skill } from "../../../shared/types";
import { api } from "../../lib/api";
import { useToast } from "../../components/Toast";
import {
  AdminError,
  AdminLoading,
  AdminPageHeader,
  ConfirmDialog,
  EmptyState,
  FormField,
  Modal,
  formatApiError,
} from "../ui";

interface SkillDraft {
  id?: number;
  category: string;
  name: string;
  level: number;
  description: string;
  sortOrder: number;
}

const emptyDraft = (sortOrder = 10): SkillDraft => ({
  category: "",
  name: "",
  level: 80,
  description: "",
  sortOrder,
});

export function SkillsAdminPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<SkillDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const loadSkills = () => {
    setLoading(true);
    setError("");
    api.admin
      .getSkills()
      .then(setSkills)
      .catch((caught: unknown) => setError(formatApiError(caught)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSkills();
  }, [reloadKey]);

  const sortSkills = (items: Skill[]) =>
    [...items].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
    );

  const openCreate = () => {
    const maxOrder = skills.reduce(
      (max, skill) => Math.max(max, skill.sortOrder),
      0,
    );
    setDraft(emptyDraft(maxOrder + 10));
    setModalError("");
    setEditorOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setDraft({
      id: skill.id,
      category: skill.category,
      name: skill.name,
      level: skill.level,
      description: skill.description,
      sortOrder: skill.sortOrder,
    });
    setModalError("");
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!draft.category.trim() || !draft.name.trim()) {
      setModalError("分类和技能名称不能为空。");
      return;
    }
    setSaving(true);
    setModalError("");
    const payload = {
      category: draft.category.trim(),
      name: draft.name.trim(),
      level: draft.level,
      description: draft.description.trim(),
      sortOrder: draft.sortOrder,
    };
    try {
      if (draft.id) {
        const updated = await api.admin.updateSkill(draft.id, payload);
        setSkills((current) =>
          sortSkills(
            current.map((skill) => (skill.id === updated.id ? updated : skill)),
          ),
        );
        showToast("技能已更新");
      } else {
        const created = await api.admin.createSkill(payload);
        setSkills((current) => sortSkills([...current, created]));
        showToast("技能已添加");
      }
      setEditorOpen(false);
    } catch (caught) {
      setModalError(formatApiError(caught));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.admin.deleteSkill(deleteTarget.id);
      setSkills((current) =>
        current.filter((skill) => skill.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      showToast("技能已删除");
    } catch (caught) {
      showToast(formatApiError(caught), "error");
    } finally {
      setDeleting(false);
    }
  };

  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const list = groups.get(skill.category) ?? [];
    list.push(skill);
    groups.set(skill.category, list);
  }

  return (
    <div className="admin-page skills-admin-page">
      <AdminPageHeader
        eyebrow="CAPABILITIES / SKILLS"
        title="技能管理"
        description="按分类组织你的能力，熟练度会以细线进度条呈现。"
        actions={
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={15} />
            新增技能
          </button>
        }
      />

      {loading ? (
        <AdminLoading label="正在读取技能列表" />
      ) : error ? (
        <AdminError
          message={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : skills.length === 0 ? (
        <EmptyState
          title="还没有技能条目"
          description="添加第一项技能，让访客了解你的能力结构。"
          icon={<Cpu size={20} />}
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              <Plus size={15} />
              添加技能
            </button>
          }
        />
      ) : (
        <div className="admin-skill-groups">
          {Array.from(groups.entries()).map(([category, items]) => (
            <section className="admin-skill-group" key={category}>
              <header className="admin-skill-group-head">
                <div>
                  <span className="admin-skill-group-icon">
                    <Cpu size={15} />
                  </span>
                  <h2>{category}</h2>
                </div>
                <span>{String(items.length).padStart(2, "0")} ITEMS</span>
              </header>
              <div className="admin-skill-list">
                {items.map((skill, index) => (
                  <div className="admin-skill-row" key={skill.id}>
                    <span className="admin-skill-order">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="admin-skill-main">
                      <div className="admin-skill-title">
                        <strong>{skill.name}</strong>
                        <span>{skill.level}%</span>
                      </div>
                      {skill.description ? <p>{skill.description}</p> : null}
                      <div className="admin-skill-meter">
                        <span style={{ width: `${skill.level}%` }} />
                      </div>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-icon-button"
                        onClick={() => openEdit(skill)}
                        aria-label={`编辑 ${skill.name}`}
                        title="编辑"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button danger"
                        onClick={() => setDeleteTarget(skill)}
                        aria-label={`删除 ${skill.name}`}
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={editorOpen}
        onClose={() => {
          if (!saving) setEditorOpen(false);
        }}
        title={draft.id ? "编辑技能" : "新增技能"}
        description="分类相同的技能会自动归组展示。"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setEditorOpen(false)}
              disabled={saving}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? "保存中" : "保存技能"}
            </button>
          </>
        }
      >
        {modalError ? (
          <p className="form-error admin-form-error">{modalError}</p>
        ) : null}
        <div className="admin-form-grid">
          <FormField label="分类" htmlFor="skill-category" required>
            <input
              id="skill-category"
              className="input"
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              placeholder="例如：前端工程"
              maxLength={40}
            />
          </FormField>
          <FormField label="技能名称" htmlFor="skill-name" required>
            <input
              id="skill-name"
              className="input"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="例如：TypeScript"
              maxLength={40}
            />
          </FormField>
          <FormField
            label="一句话说明"
            htmlFor="skill-description"
            full
            hint="可选，显示为技能名下方的小字。"
          >
            <input
              id="skill-description"
              className="input"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="例如：类型安全的工程实践"
              maxLength={120}
            />
          </FormField>
          <FormField
            label={`熟练度 · ${draft.level}%`}
            htmlFor="skill-level"
            full
            hint="用于绘制进度条，不代表绝对标准。"
          >
            <div className="range-field">
              <input
                id="skill-level"
                type="range"
                min={0}
                max={100}
                step={1}
                value={draft.level}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    level: Number(event.target.value),
                  }))
                }
              />
              <input
                className="input range-number"
                type="number"
                min={0}
                max={100}
                value={draft.level}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    level: Math.max(
                      0,
                      Math.min(100, Number(event.target.value) || 0),
                    ),
                  }))
                }
                aria-label="熟练度数值"
              />
            </div>
          </FormField>
          <FormField
            label="排序权重"
            htmlFor="skill-order"
            hint="数字越小越靠前。留空或相同则按创建顺序。"
          >
            <input
              id="skill-order"
              className="input"
              type="number"
              min={0}
              max={9999}
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value),
                }))
              }
            />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除这项技能？"
        description={`「${deleteTarget?.name ?? ""}」将从公开页面永久移除，此操作无法撤销。`}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
