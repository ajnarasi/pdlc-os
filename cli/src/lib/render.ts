import kleur from "kleur";
import type { AuditEntry, KarpathyEvalLog, MerchantBrain, StageId } from "./schemas.js";
import { STAGE_ORDER } from "./schemas.js";

export function banner(message: string): void {
  process.stdout.write(`${kleur.cyan().bold(message)}\n`);
}

export function info(message: string): void {
  process.stdout.write(`${kleur.gray("→")} ${message}\n`);
}

export function success(message: string): void {
  process.stdout.write(`${kleur.green("✓")} ${message}\n`);
}

export function warn(message: string): void {
  process.stdout.write(`${kleur.yellow("!")} ${message}\n`);
}

export function fail(message: string): void {
  process.stderr.write(`${kleur.red("✗")} ${message}\n`);
}

const VERDICT_COLOR: Record<string, (s: string) => string> = {
  PASS: (s) => kleur.green(s),
  WARN: (s) => kleur.yellow(s),
  FAIL: (s) => kleur.red(s),
  PENDING: (s) => kleur.gray(s),
};

export function stageRunLine(args: {
  stage: StageId;
  index: number;
  total: number;
  durationMs: number;
  evalLog: KarpathyEvalLog;
  hash: string;
  executor: string;
}): void {
  const { stage, index, total, durationMs, evalLog, hash, executor } = args;
  const verdict = evalLog.finalVerdict;
  const score = `${(evalLog.finalScore * 100).toFixed(0)}%`;
  const color = VERDICT_COLOR[verdict] ?? ((s: string) => s);
  const stageLabel = stage.padEnd(15);
  const dur = `${(durationMs / 1000).toFixed(1)}s`.padStart(6);
  process.stdout.write(
    `  ${kleur.gray(`${index + 1}/${total}`)} ${kleur.bold(stageLabel)} ${dur} ${color(`${score} · ${verdict}`)} ${kleur.gray(`· ${hash.slice(0, 12)}…`)} ${kleur.gray(`(${executor})`)}\n`,
  );
}

export function brainSummary(brain: MerchantBrain): void {
  process.stdout.write(`\n${kleur.cyan().bold("merchant brain")}\n`);
  process.stdout.write(
    `  ${kleur.gray("merchantId")}    ${brain.merchantId}\n`,
  );
  process.stdout.write(
    `  ${kleur.gray("merchantName")}  ${brain.merchantName}\n`,
  );
  process.stdout.write(
    `  ${kleur.gray("runId")}         ${brain.runId}\n`,
  );
  process.stdout.write(
    `  ${kleur.gray("createdAt")}     ${brain.createdAt}\n`,
  );
  process.stdout.write(
    `  ${kleur.gray("painPoint")}     ${brain.inputPainPoint}\n`,
  );
  process.stdout.write(
    `  ${kleur.gray("artifacts")}     ${describeArtifactStatus(brain)}\n`,
  );
  process.stdout.write(
    `  ${kleur.gray("audit")}         ${brain.audit.length} signed entries\n`,
  );
}

function describeArtifactStatus(brain: MerchantBrain): string {
  return STAGE_ORDER.map((s) => {
    const has = Boolean(brain.artifacts[s]);
    return has ? kleur.green(s) : kleur.gray(s);
  }).join(" · ");
}

export function auditChain(audit: AuditEntry[]): void {
  if (audit.length === 0) {
    info("No audit entries yet.");
    return;
  }
  process.stdout.write(`\n${kleur.cyan().bold("audit chain")}\n`);
  for (const entry of audit) {
    process.stdout.write(
      `  ${kleur.gray(entry.stage.padEnd(15))} ${entry.artifactName.padEnd(20)} ${kleur.gray(entry.hash.slice(0, 12))}… ${kleur.gray(`← ${entry.parentHashes.length === 0 ? "(genesis)" : entry.parentHashes.map((h) => h.slice(0, 8)).join(",")}`)} ${kleur.gray(`· ${(entry.evalScore * 100).toFixed(0)}% ${entry.evalVerdict}`)}\n`,
    );
    if (entry.citations.length > 0) {
      for (const c of entry.citations) {
        process.stdout.write(
          `      ${kleur.gray("·")} ${c.label} ${kleur.gray(`→ ${c.path}`)}\n`,
        );
      }
    }
  }
}
