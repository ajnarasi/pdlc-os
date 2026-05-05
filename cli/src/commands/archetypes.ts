import { Command } from "commander";
import kleur from "kleur";
import {
  archetypeAsPainPoint,
  findArchetypeById,
  jtbdsByPhase,
  loadCatalog,
  type CatalogArchetype,
} from "../lib/jtbd-catalog.js";
import {
  brainExists,
  emptyBrain,
  readBrain,
  writeBrain,
} from "../lib/brain-store.js";
import { runStage } from "../lib/run-stage.js";
import { makeExecutor } from "../executors/index.js";
import { STAGE_ORDER, type MerchantBrain } from "../lib/schemas.js";
import { auditChain, banner, brainSummary, info, success } from "../lib/render.js";

export function archetypesCommand(): Command {
  const cmd = new Command("archetypes").description(
    "Browse the 17 merchant archetypes (all status: locked) and run the pipeline against any of them.",
  );

  cmd
    .command("list")
    .description("List all merchant archetypes with summary stats.")
    .option("-t, --tier <n>", "Filter by tier (0 / 1 / 2)")
    .action((opts) => {
      const cat = loadCatalog();
      const tierFilter = opts.tier !== undefined ? Number.parseInt(String(opts.tier), 10) : null;
      const items = cat.archetypes.filter(
        (a) => tierFilter === null || a.tier === tierFilter,
      );
      banner(`pdlc archetypes list · ${items.length} of ${cat.archetypes.length}`);
      console.log();
      console.log(
        `  ${kleur.gray("id".padEnd(4))} ${kleur.gray("tier")} ${kleur.gray("slice")} ${kleur.gray("status".padEnd(7))} ${kleur.gray("score")} ${kleur.gray("jtbds".padEnd(6))} ${kleur.gray("p0")}  name`,
      );
      console.log("  " + "-".repeat(90));
      for (const a of items) {
        printRow(a);
      }
    });

  cmd
    .command("show <id>")
    .description("Print full archetype profile + phase-grouped JTBD index.")
    .option("--json", "Emit raw JSON")
    .action((id, opts) => {
      const a = findArchetypeById(id);
      if (!a) throw new Error(`No archetype with id '${id}'.`);
      if (opts.json) {
        process.stdout.write(
          `${JSON.stringify({ archetype: a, jtbdsByPhase: jtbdsByPhase(id) }, null, 2)}\n`,
        );
        return;
      }
      banner(`pdlc archetypes show · ${a.id}`);
      console.log(`  ${kleur.gray("name")}              ${a.name}`);
      console.log(
        `  ${kleur.gray("tier / slice")}      ${a.tier ?? "-"} / ${a.mvpSlice ?? "-"}`,
      );
      console.log(
        `  ${kleur.gray("status / score")}    ${a.status ?? "-"} / ${a.lastScore != null ? `${(a.lastScore * 100).toFixed(1)}%` : "-"} (round ${a.lastRound ?? "?"})`,
      );
      console.log(`  ${kleur.gray("size / GPV")}        ${a.size ?? "-"} / ${a.gpvBand ?? "-"}`);
      console.log(`  ${kleur.gray("channel")}           ${(a.channel ?? []).join(", ")}`);
      console.log(`  ${kleur.gray("vertical")}          ${(a.vertical ?? []).join(", ")}`);
      console.log(`  ${kleur.gray("business model")}    ${(a.businessModel ?? []).join(", ")}`);
      console.log(
        `  ${kleur.gray("integration modes")} ${(a.integrationModes ?? []).join(", ") || "-"}`,
      );
      console.log(
        `  ${kleur.gray("regulatory")}        ${(a.regulatoryOverlay ?? []).join(", ") || "-"}`,
      );
      console.log(`  ${kleur.gray("brain posture")}     ${a.brainPosture ?? "-"}`);
      if (a.brandClass) {
        console.log(`  ${kleur.gray("brand class")}       ${a.brandClass}`);
      }
      console.log(
        `  ${kleur.gray("jtbds")}             ${a.jtbdCount} total / ${a.fullJtbdCount} full / ${a.p0JtbdCount} P0`,
      );
      console.log();
      console.log(kleur.cyan().bold("JTBDs by phase"));
      const groups = jtbdsByPhase(a.id);
      for (const g of groups) {
        console.log();
        console.log(
          `  ${kleur.cyan(`§${g.phaseId}`)} ${kleur.bold(g.phaseLabel)} ${kleur.gray(`(${g.jtbds.length})`)}`,
        );
        for (const j of g.jtbds) {
          const partial = j.partial ? kleur.gray("[partial] ") : "";
          console.log(
            `    ${kleur.gray(j.id.padEnd(22))} ${partial}${j.title}`,
          );
        }
      }
    });

  cmd
    .command("use <id>")
    .description(
      "Use an archetype as the pain seed (no specific JTBD) and run all six PDLC stages.",
    )
    .requiredOption("-m, --merchant <id>", "Merchant id")
    .option("-e, --executor <name>", "cached | anthropic | claude-code", "cached")
    .option("--api-key <key>", "Anthropic API key (overrides env)")
    .option("--model <id>", "Anthropic model id")
    .option("--auto-init", "Create the brain if missing")
    .action(async (id, opts) => {
      const a = findArchetypeById(id);
      if (!a) throw new Error(`No archetype with id '${id}'.`);
      const painPoint = archetypeAsPainPoint(a);

      let brain: MerchantBrain;
      if (brainExists(opts.merchant)) {
        brain = readBrain(opts.merchant);
        brain = {
          ...brain,
          inputPainPoint: painPoint,
          artifacts: {},
          audit: [],
          evals: {},
          runId: `run-${Date.now().toString(36)}`,
        };
        writeBrain(brain);
      } else if (opts.autoInit) {
        brain = emptyBrain({
          merchantId: opts.merchant,
          merchantName: `${a.id} · ${a.name}`,
          inputPainPoint: painPoint,
        });
        writeBrain(brain);
      } else {
        throw new Error(
          `No brain for merchant '${opts.merchant}'. Pass --auto-init or run \`pdlc init --merchant ${opts.merchant}\` first.`,
        );
      }

      const executor = makeExecutor(opts.executor, {
        apiKey: opts.apiKey,
        model: opts.model,
      });

      banner(`pdlc archetypes use · ${a.id} → merchant ${opts.merchant}`);
      info(`executor: ${executor.describe()}`);
      info(`pain    : ${painPoint.slice(0, 140)}${painPoint.length > 140 ? "…" : ""}`);
      console.log();

      for (let i = 0; i < STAGE_ORDER.length; i += 1) {
        const stage = STAGE_ORDER[i];
        const result = await runStage({
          brain,
          stage,
          executor,
          index: i,
          total: STAGE_ORDER.length,
        });
        brain = result.brain;
      }

      console.log();
      success(
        `pipeline complete · ${brain.audit.length}/${STAGE_ORDER.length} signed`,
      );
      brainSummary(brain);
      auditChain(brain.audit);
    });

  return cmd;
}

function printRow(a: CatalogArchetype): void {
  const id = kleur.cyan(a.id.padEnd(4));
  const tier = (a.tier === null ? "-" : String(a.tier)).padEnd(4);
  const slice = (a.mvpSlice ?? "-").padEnd(5);
  const status = kleur.green((a.status ?? "-").padEnd(7));
  const score =
    a.lastScore != null ? `${(a.lastScore * 100).toFixed(0)}%` : "-";
  const jtbds = String(a.jtbdCount).padEnd(6);
  const p0 = a.p0JtbdCount > 0 ? kleur.red(String(a.p0JtbdCount).padEnd(2)) : kleur.gray("-".padEnd(2));
  console.log(
    `  ${id} ${kleur.gray(tier)} ${kleur.gray(slice)} ${status} ${kleur.gray(score.padEnd(5))} ${kleur.gray(jtbds)} ${p0}  ${a.name}`,
  );
}
