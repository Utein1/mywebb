import {
  Code2,
  Layers,
  PenTool,
  Server,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Skill } from "../../shared/types";

function iconForCategory(category: string): LucideIcon {
  const value = category.toLowerCase();
  if (/前端|front|web/.test(value)) return Code2;
  if (/后端|back|server|data|数据/.test(value)) return Server;
  if (/设计|design|product|产品/.test(value)) return PenTool;
  if (/ai|智能|machine/.test(value)) return Sparkles;
  return Layers;
}

function levelLabel(level: number): string {
  if (level >= 90) return "熟练";
  if (level >= 78) return "进阶";
  if (level >= 60) return "常用";
  return "探索";
}

export function SkillBoard({ skills }: { skills: Skill[] }) {
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const list = groups.get(skill.category) ?? [];
    list.push(skill);
    groups.set(skill.category, list);
  }

  return (
    <div className="skill-board">
      {Array.from(groups.entries()).map(([category, items], index) => {
        const Icon = iconForCategory(category);
        return (
          <article
            className="skill-group"
            key={category}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="skill-group-head">
              <span className="skill-icon">
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <div>
                <h3>{category}</h3>
                <p>{String(items.length).padStart(2, "0")} 项能力</p>
              </div>
            </div>
            <ul className="skill-list">
              {items.map((skill) => (
                <li key={skill.id}>
                  <div className="skill-line">
                    <div className="skill-name-wrap">
                      <span className="skill-name">{skill.name}</span>
                      {skill.description ? (
                        <span className="skill-description">
                          {skill.description}
                        </span>
                      ) : null}
                    </div>
                    <span className="skill-level-label">
                      {levelLabel(skill.level)}
                    </span>
                  </div>
                  <div
                    className="skill-meter"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={skill.level}
                    aria-label={`${skill.name} 熟练度`}
                  >
                    <span style={{ width: `${skill.level}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
