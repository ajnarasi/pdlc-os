#!/usr/bin/env node
/**
 * Copies the PM-OS SKILL.md files referenced by lib/server/skill-registry.ts
 * into lib/server/skill-md/{name}.md so the deployed Next.js bundle has them.
 *
 * Local-only: run this whenever the PM-OS skills change, then commit the
 * updated lib/server/skill-md/ folder.
 *
 * Required: PM-OS at one of:
 *   ~/Documents/Work/PM-OS/.claude/skills/
 *   ~/Documents/Work/Projects/APM/PM-OS/.claude/skills/
 *   $PMOS_SKILLS_DIR
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT_DIR = join(ROOT, "lib", "server", "skill-md");

// Extract skill names from skill-registry.ts (the source of truth).
function readSkillNames() {
  const src = readFileSync(
    join(ROOT, "lib", "server", "skill-registry.ts"),
    "utf8",
  );
  const matches = [...src.matchAll(/pmosSkillFiles:\s*\[([^\]]+)\]/g)];
  const names = new Set();
  for (const m of matches) {
    const list = m[1]
      .split(",")
      .map((s) => s.trim().replace(/["']/g, ""))
      .filter(Boolean);
    for (const n of list) names.add(n);
  }
  return [...names];
}

function skillSearchRoots() {
  return [
    process.env.PMOS_SKILLS_DIR,
    join(homedir(), "Documents", "Work", "PM-OS", ".claude", "skills"),
    join(homedir(), "Documents", "Work", "Projects", "APM", "PM-OS", ".claude", "skills"),
    join(homedir(), ".claude", "skills"),
  ].filter(Boolean);
}

function locateSkill(name) {
  for (const root of skillSearchRoots()) {
    const candidate = join(root, name, "SKILL.md");
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function main() {
  const names = readSkillNames();
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  let copied = 0;
  const missing = [];
  for (const name of names) {
    const src = locateSkill(name);
    if (!src) {
      missing.push(name);
      continue;
    }
    const dst = join(OUT_DIR, `${name}.md`);
    writeFileSync(dst, readFileSync(src, "utf8"), "utf8");
    copied += 1;
  }

  console.log(`synced ${copied}/${names.length} skill markdown files → lib/server/skill-md/`);
  if (missing.length) {
    console.warn(`missing skills:\n  - ${missing.join("\n  - ")}`);
    console.warn("Searched:\n  - " + skillSearchRoots().join("\n  - "));
    console.warn("These executors will fail at runtime. Either install the skill or remove it from skill-registry.ts.");
  }
}

main();
