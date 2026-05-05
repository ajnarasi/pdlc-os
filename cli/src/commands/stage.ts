import { Command } from "commander";
import { makeExecutor } from "../executors/index.js";
import { readBrain } from "../lib/brain-store.js";
import { runStage } from "../lib/run-stage.js";
import { SKILL_REGISTRY } from "../lib/skill-registry.js";
import type { StageId } from "../lib/schemas.js";
import { banner, info, success } from "../lib/render.js";

const STAGES: { stage: StageId; verb: string }[] = [
  { stage: "discovery", verb: "synthesize" },
  { stage: "prioritization", verb: "size" },
  { stage: "design", verb: "iso-map" },
  { stage: "delivery", verb: "tickets" },
  { stage: "launch", verb: "checklist" },
  { stage: "support", verb: "triage" },
];

export function stageCommands(): Command[] {
  return STAGES.map(({ stage, verb }) => {
    const binding = SKILL_REGISTRY[stage];
    const parent = new Command(stage).description(
      `Stage ${binding.id} ${binding.version} — ${binding.description}`,
    );

    parent
      .command(verb)
      .description(binding.description)
      .requiredOption("-m, --merchant <id>", "Merchant id")
      .option(
        "-e, --executor <name>",
        "cached | anthropic | claude-code",
        "cached",
      )
      .option("--api-key <key>", "Anthropic API key")
      .option("--model <id>", "Anthropic model id")
      .action(async (opts) => {
        const executor = makeExecutor(opts.executor, {
          apiKey: opts.apiKey,
          model: opts.model,
        });
        const brain = readBrain(opts.merchant);

        banner(`pdlc ${stage} ${verb} · ${opts.merchant}`);
        info(`executor: ${executor.describe()}`);
        info(`pain    : ${brain.inputPainPoint}`);
        console.log();

        const result = await runStage({
          brain,
          stage,
          executor,
        });

        console.log();
        success(`${binding.id} written · hash ${result.hash.slice(0, 12)}…`);
      });

    return parent;
  });
}
