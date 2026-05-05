import { Command } from "commander";
import { brainPath, brainsDir, readBrain } from "../lib/brain-store.js";
import { auditChain, banner, brainSummary, info } from "../lib/render.js";
import type { StageId } from "../lib/schemas.js";

export function brainCommand(): Command {
  const cmd = new Command("brain").description("Inspect the merchant brain.");

  cmd
    .command("show")
    .description("Pretty-print the merchant brain (or one stage of it).")
    .requiredOption("-m, --merchant <id>", "Merchant id")
    .option(
      "-s, --stage <stage>",
      "discovery | prioritization | design | delivery | launch | support",
    )
    .option("--json", "Print full JSON instead of summary")
    .action((opts) => {
      const brain = readBrain(opts.merchant);
      if (opts.json) {
        if (opts.stage) {
          const stage = opts.stage as StageId;
          const artifact = brain.artifacts[stage];
          if (!artifact) {
            throw new Error(`No artifact for stage '${stage}' in this brain.`);
          }
          process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
        } else {
          process.stdout.write(`${JSON.stringify(brain, null, 2)}\n`);
        }
        return;
      }
      banner(`pdlc brain show · ${brain.merchantId}`);
      brainSummary(brain);
      if (opts.stage) {
        const stage = opts.stage as StageId;
        const artifact = brain.artifacts[stage];
        info(`stage: ${stage}`);
        process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
      } else {
        auditChain(brain.audit);
      }
    });

  cmd
    .command("path")
    .description("Print the on-disk path to a merchant brain.")
    .requiredOption("-m, --merchant <id>", "Merchant id")
    .action((opts) => {
      process.stdout.write(`${brainPath(opts.merchant)}\n`);
    });

  cmd
    .command("dir")
    .description("Print the brains directory.")
    .action(() => {
      process.stdout.write(`${brainsDir()}\n`);
    });

  return cmd;
}
