import { Command } from "commander";
import { brainExists, brainPath, emptyBrain, writeBrain } from "../lib/brain-store.js";
import { buildDemoPixBrain } from "../lib/demo-seed.js";
import { brainSummary, info, success, warn } from "../lib/render.js";

export function initCommand(): Command {
  return new Command("init")
    .description("Initialize a merchant brain at ~/.pdlc/brains/{merchant}.json")
    .requiredOption("-m, --merchant <id>", "Merchant id (e.g., A1)")
    .option("-n, --name <name>", "Merchant display name")
    .option("-p, --pain <painPoint>", "Initial pain point seed")
    .option(
      "--from <fixture>",
      "Seed from a fixture (currently: 'demo-pix' = canonical Pix→A1 demo)",
    )
    .option("--force", "Overwrite an existing brain file")
    .action(async (opts) => {
      const merchantId = opts.merchant as string;
      const merchantName = (opts.name as string | undefined) ??
        (opts.from === "demo-pix"
          ? "A1 · Mid-Market Fashion D2C (Indigo Road-class)"
          : `Merchant ${merchantId}`);
      const inputPainPoint = (opts.pain as string | undefined) ??
        (opts.from === "demo-pix"
          ? "Brazilian buyers abandon at checkout — we don't accept Pix."
          : "");

      if (brainExists(merchantId) && !opts.force) {
        warn(
          `Brain already exists at ${brainPath(merchantId)}. Use --force to overwrite.`,
        );
        process.exit(1);
      }

      const brain =
        opts.from === "demo-pix"
          ? buildDemoPixBrain({ merchantId, merchantName, inputPainPoint })
          : emptyBrain({ merchantId, merchantName, inputPainPoint });
      const path = writeBrain(brain);

      success(`brain initialized at ${path}`);
      info(`merchant: ${brain.merchantName}`);
      if (opts.from === "demo-pix") {
        info(
          "seeded with full 6-stage canonical Pix→A1 brain (Discovery → Support, Karpathy-PASS).",
        );
      } else {
        info(
          "empty brain — run `pdlc pipeline run --merchant <id> --pain '<...>'` to fill it.",
        );
      }
      brainSummary(brain);
    });
}
