import { Command } from "commander";
import { makeExecutor } from "../executors/index.js";
import {
  brainExists,
  emptyBrain,
  readBrain,
  writeBrain,
} from "../lib/brain-store.js";
import { runStage } from "../lib/run-stage.js";
import { STAGE_ORDER, type MerchantBrain } from "../lib/schemas.js";
import { auditChain, banner, brainSummary, info, success } from "../lib/render.js";

export function pipelineCommand(): Command {
  const cmd = new Command("pipeline").description(
    "Compose-and-sign all six PDLC stages (Discovery → Support).",
  );

  cmd
    .command("run")
    .description("Run all six stages on a merchant brain.")
    .requiredOption("-m, --merchant <id>", "Merchant id (must exist or be auto-init)")
    .option("-p, --pain <painPoint>", "Pain point — overrides existing pain on the brain")
    .option(
      "-e, --executor <name>",
      "cached | anthropic | claude-code",
      "cached",
    )
    .option("--api-key <key>", "Anthropic API key (overrides ANTHROPIC_API_KEY env)")
    .option("--model <id>", "Anthropic model id (default: claude-sonnet-4-6)")
    .option("--auto-init", "Create the brain if it does not yet exist")
    .action(async (opts) => {
      const merchantId = opts.merchant as string;
      const executor = makeExecutor(opts.executor, {
        apiKey: opts.apiKey,
        model: opts.model,
      });

      let brain: MerchantBrain;
      if (brainExists(merchantId)) {
        brain = readBrain(merchantId);
        if (opts.pain) {
          brain = {
            ...brain,
            inputPainPoint: opts.pain,
            artifacts: {},
            audit: [],
            evals: {},
            runId: `run-${Date.now().toString(36)}`,
          };
          writeBrain(brain);
        }
      } else {
        if (!opts.autoInit) {
          throw new Error(
            `No brain for merchant '${merchantId}'. Run \`pdlc init --merchant ${merchantId}\` or pass --auto-init.`,
          );
        }
        brain = emptyBrain({
          merchantId,
          merchantName: `Merchant ${merchantId}`,
          inputPainPoint: (opts.pain as string | undefined) ?? "",
        });
        writeBrain(brain);
      }

      banner(`pdlc pipeline run · ${merchantId}`);
      info(`executor: ${executor.describe()}`);
      info(`pain    : ${brain.inputPainPoint}`);
      info(`writing : ~/.pdlc/brains/${merchantId}.json`);
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
