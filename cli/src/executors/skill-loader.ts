import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { SkillBinding } from "../lib/skill-registry.js";

const PMOS_SKILL_ROOTS = [
  process.env.PMOS_SKILLS_DIR,
  join(homedir(), "Documents", "Work", "PM-OS", ".claude", "skills"),
  join(homedir(), "Documents", "Work", "Projects", "APM", "PM-OS", ".claude", "skills"),
  join(homedir(), ".claude", "skills"),
].filter(Boolean) as string[];

export interface LoadedSkill {
  name: string;
  path: string;
  markdown: string;
}

export function loadSkillMarkdown(skillName: string): LoadedSkill {
  for (const root of PMOS_SKILL_ROOTS) {
    const candidate = join(root, skillName, "SKILL.md");
    if (existsSync(candidate)) {
      return {
        name: skillName,
        path: candidate,
        markdown: readFileSync(candidate, "utf8"),
      };
    }
  }
  throw new Error(
    `PM-OS skill '${skillName}' not found. Tried:\n  - ${PMOS_SKILL_ROOTS.map((r) => join(r, skillName, "SKILL.md")).join("\n  - ")}\nSet PMOS_SKILLS_DIR to override.`,
  );
}

export function loadAllSkillsForBinding(binding: SkillBinding): LoadedSkill[] {
  return binding.pmosSkillFiles.map(loadSkillMarkdown);
}

export function composeSkillContext(skills: LoadedSkill[]): string {
  return skills
    .map((s) => `## PM-OS Skill: ${s.name}\n\n${s.markdown}`)
    .join("\n\n---\n\n");
}
