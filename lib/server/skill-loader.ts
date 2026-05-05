import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SkillBinding } from "./skill-registry";

const SKILL_MD_DIR = join(process.cwd(), "lib", "server", "skill-md");

export interface LoadedSkill {
  name: string;
  path: string;
  markdown: string;
}

export function loadSkillMarkdown(skillName: string): LoadedSkill {
  const path = join(SKILL_MD_DIR, `${skillName}.md`);
  try {
    return {
      name: skillName,
      path,
      markdown: readFileSync(path, "utf8"),
    };
  } catch (err) {
    throw new Error(
      `Bundled skill markdown not found at ${path}. Run \`npm run sync:skills\` and commit the result. Underlying error: ${(err as Error).message}`,
    );
  }
}

export function loadAllSkillsForBinding(binding: SkillBinding): LoadedSkill[] {
  return binding.pmosSkillFiles.map(loadSkillMarkdown);
}

export function composeSkillContext(skills: LoadedSkill[]): string {
  return skills
    .map((s) => `## PM-OS Skill: ${s.name}\n\n${s.markdown}`)
    .join("\n\n---\n\n");
}
