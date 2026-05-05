import { Command } from "commander";
import { SKILL_REGISTRY } from "../lib/skill-registry.js";
import { STAGE_ORDER } from "../lib/schemas.js";
import { banner } from "../lib/render.js";
import kleur from "kleur";

export function skillsCommand(): Command {
  return new Command("skills")
    .description("List the registered PM-OS skill bindings.")
    .action(() => {
      banner("pdlc skills · v1 registry");
      for (const stage of STAGE_ORDER) {
        const b = SKILL_REGISTRY[stage];
        process.stdout.write(
          `\n  ${kleur.cyan(b.id)} ${kleur.gray(b.version)}\n`,
        );
        process.stdout.write(`    ${b.description}\n`);
        process.stdout.write(
          `    ${kleur.gray("pmos-skills")}  ${b.pmosSkillFiles.map((s) => `/${s}`).join(", ")}\n`,
        );
        process.stdout.write(
          `    ${kleur.gray("rubric")}       ${b.rubricCriteriaIds.join(", ")}\n`,
        );
        process.stdout.write(
          `    ${kleur.gray("autonomy")}     ${b.defaultAutonomy}\n`,
        );
      }
    });
}
