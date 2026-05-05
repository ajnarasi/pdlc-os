import { Command } from "commander";
import { readBrain } from "../lib/brain-store.js";
import { deterministicHash } from "../lib/sign.js";
import { auditChain, banner, fail, info, success } from "../lib/render.js";

export function auditCommand(): Command {
  const cmd = new Command("audit").description(
    "Inspect / replay / verify the signed audit chain.",
  );

  cmd
    .command("verify")
    .description(
      "Replay the brain through deterministicHash and verify every audit entry.",
    )
    .requiredOption("-m, --merchant <id>", "Merchant id")
    .action((opts) => {
      const brain = readBrain(opts.merchant);
      banner(`pdlc audit verify · ${opts.merchant}`);
      let ok = true;
      for (const entry of brain.audit) {
        const recomputed = deterministicHash({
          stage: entry.stage,
          agent: entry.agent,
          artifactName: entry.artifactName,
          artifact: brain.artifacts[entry.stage],
          parentHashes: entry.parentHashes,
          timestampISO: entry.timestampISO,
        });
        const match = recomputed === entry.hash;
        if (!match) ok = false;
        const line = `${entry.stage.padEnd(15)} ${entry.hash.slice(0, 12)}… ${match ? "" : `(expected ${recomputed.slice(0, 12)}…)`}`;
        if (match) success(line);
        else fail(line);
      }
      info(
        `${brain.audit.length} entries · parent-link integrity: ${verifyParentLinks(brain.audit) ? "PASS" : "FAIL"}`,
      );
      if (!ok) {
        fail("audit verify FAILED");
        process.exit(1);
      }
      success("audit verify PASSED");
    });

  cmd
    .command("replay")
    .description("Print the signed audit chain in order.")
    .requiredOption("-m, --merchant <id>", "Merchant id")
    .action((opts) => {
      const brain = readBrain(opts.merchant);
      banner(`pdlc audit replay · ${opts.merchant}`);
      auditChain(brain.audit);
    });

  return cmd;
}

function verifyParentLinks(
  audit: { hash: string; parentHashes: string[] }[],
): boolean {
  if (audit.length === 0) return true;
  const seen = new Set<string>();
  for (const entry of audit) {
    for (const p of entry.parentHashes) {
      if (!seen.has(p)) return false;
    }
    seen.add(entry.hash);
  }
  return true;
}
