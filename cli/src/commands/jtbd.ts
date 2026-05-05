import { Command } from "commander";
import kleur from "kleur";
import {
  findById,
  jtbdAsPainPoint,
  loadCatalog,
  searchCatalog,
} from "../lib/jtbd-catalog.js";
import { writeBrain, brainExists, readBrain, emptyBrain } from "../lib/brain-store.js";
import { runStage } from "../lib/run-stage.js";
import { makeExecutor } from "../executors/index.js";
import { STAGE_ORDER, type MerchantBrain } from "../lib/schemas.js";
import { auditChain, banner, brainSummary, info, success } from "../lib/render.js";

export function jtbdCommand(): Command {
  const cmd = new Command("jtbd").description(
    "Browse / search the merchant-research JTBD catalog (628 scenarios across 17 archetypes).",
  );

  cmd
    .command("stats")
    .description("Print catalog summary.")
    .action(() => {
      const cat = loadCatalog();
      banner("pdlc jtbd · catalog stats");
      info(`generated   ${cat.generatedAt}`);
      info(`total       ${cat.totalJtbds} (${cat.fullJtbds} full + ${cat.partialJtbds} partial)`);
      info(`archetypes  ${cat.archetypeCount}`);
      console.log();
      console.log(kleur.cyan().bold("by archetype"));
      for (const [k, v] of Object.entries(cat.index.archetypes)) {
        console.log(`  ${k.padEnd(6)} ${v}`);
      }
      console.log();
      console.log(kleur.cyan().bold("by phase"));
      for (const [k, v] of Object.entries(cat.index.phases)) {
        console.log(`  §${k.padEnd(6)} ${v}`);
      }
    });

  cmd
    .command("list")
    .description("List JTBDs (filterable, default 25 results).")
    .option("-a, --archetype <id>", "Filter by archetype id (e.g., A1)")
    .option("-p, --phase <id>", "Filter by phase id (e.g., 3.5)")
    .option("-l, --limit <n>", "Max rows", "25")
    .option("--all", "Skip the limit, dump everything matched")
    .option("--include-partial", "Include TOC-only entries without Christensen body")
    .action((opts) => {
      const limit = opts.all ? undefined : Number.parseInt(String(opts.limit), 10);
      const items = searchCatalog({
        archetypeId: opts.archetype,
        phaseId: opts.phase,
        includePartial: !!opts.includePartial,
        limit,
      });
      banner(`pdlc jtbd list · ${items.length} of ${loadCatalog().totalJtbds}`);
      for (const j of items) {
        printRow(j);
      }
    });

  cmd
    .command("search <query>")
    .description("Free-text search across id / title / Christensen statement / agent.")
    .option("-a, --archetype <id>", "Restrict to a single archetype")
    .option("-p, --phase <id>", "Restrict to a single phase id")
    .option("-l, --limit <n>", "Max rows", "25")
    .option("--include-partial", "Include partial entries")
    .action((q, opts) => {
      const items = searchCatalog({
        q,
        archetypeId: opts.archetype,
        phaseId: opts.phase,
        includePartial: !!opts.includePartial,
        limit: Number.parseInt(String(opts.limit), 10),
      });
      banner(`pdlc jtbd search · "${q}" · ${items.length} matched`);
      for (const j of items) printRow(j);
    });

  cmd
    .command("show <id>")
    .description("Print one JTBD in full (Christensen + metadata).")
    .option("--json", "Emit raw JSON")
    .action((id, opts) => {
      const j = findById(id);
      if (!j) {
        throw new Error(`No JTBD with id '${id}' in the catalog.`);
      }
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(j, null, 2)}\n`);
        return;
      }
      banner(`pdlc jtbd show · ${j.id}`);
      console.log(`  ${kleur.gray("archetype")}  ${j.archetypeId} · ${j.archetypeName}`);
      console.log(`  ${kleur.gray("phase")}      §${j.phaseId} · ${j.phaseLabel}`);
      console.log(`  ${kleur.gray("title")}      ${j.title}`);
      if (j.when) {
        console.log();
        console.log(`  ${kleur.cyan("When")}        ${j.when}`);
        console.log(`  ${kleur.cyan("I want to")}   ${j.iWantTo}`);
        console.log(`  ${kleur.cyan("so I can")}    ${j.soICan}`);
      }
      console.log();
      const m = j.metadata;
      const fields: [string, string | undefined][] = [
        ["Trigger", m.trigger],
        ["Frequency", m.frequency],
        ["Actor", m.actor],
        ["Workaround", m.workaround],
        ["Success metric", m.successMetric],
        ["Failure mode", m.failureMode],
        ["Failure freq today", m.failureFrequency],
        ["Agent target", m.agentTarget],
        ["Autonomy envelope", m.autonomyEnvelope],
        ["Source", m.source],
        ["Priority", m.priority],
      ];
      for (const [label, value] of fields) {
        if (value) console.log(`  ${kleur.gray(label.padEnd(20))} ${value}`);
      }
    });

  cmd
    .command("use <id>")
    .description(
      "Use a JTBD as the pain point and run the full pipeline against a merchant brain.",
    )
    .requiredOption("-m, --merchant <id>", "Merchant id")
    .option("-e, --executor <name>", "cached | anthropic | claude-code", "cached")
    .option("--api-key <key>", "Anthropic API key (overrides env)")
    .option("--model <id>", "Anthropic model id")
    .option("--auto-init", "Create the brain if missing")
    .action(async (id, opts) => {
      const j = findById(id);
      if (!j) throw new Error(`No JTBD with id '${id}'.`);
      const painPoint = jtbdAsPainPoint(j);

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
          merchantName: `Merchant ${opts.merchant}`,
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

      banner(`pdlc jtbd use · ${id} → merchant ${opts.merchant}`);
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

function printRow(j: ReturnType<typeof findById> extends infer T ? Exclude<T, undefined> : never): void {
  const idCol = kleur.cyan(j.id.padEnd(22));
  const arche = kleur.gray(`${j.archetypeId.padEnd(4)} §${j.phaseId.padEnd(5)}`);
  const partial = j.partial ? kleur.gray("[partial] ") : "";
  console.log(`  ${idCol} ${arche} ${partial}${j.title}`);
}
