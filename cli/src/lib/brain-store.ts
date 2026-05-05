import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  MerchantBrainSchema,
  type MerchantBrain,
  type StageId,
} from "./schemas.js";

const ENV_OVERRIDE = process.env.PDLC_BRAIN_DIR;

export function brainsDir(): string {
  return ENV_OVERRIDE ?? join(homedir(), ".pdlc", "brains");
}

export function brainPath(merchantId: string): string {
  return join(brainsDir(), `${merchantId}.json`);
}

export function ensureBrainsDir(): void {
  const dir = brainsDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function brainExists(merchantId: string): boolean {
  return existsSync(brainPath(merchantId));
}

export function readBrain(merchantId: string): MerchantBrain {
  const path = brainPath(merchantId);
  if (!existsSync(path)) {
    throw new Error(
      `No brain found for merchant '${merchantId}' at ${path}. Run \`pdlc init --merchant ${merchantId}\` first.`,
    );
  }
  const raw = readFileSync(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Brain file at ${path} is not valid JSON: ${(err as Error).message}`,
    );
  }
  return MerchantBrainSchema.parse(parsed);
}

export function writeBrain(brain: MerchantBrain): string {
  ensureBrainsDir();
  const validated = MerchantBrainSchema.parse(brain);
  const path = brainPath(validated.merchantId);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  return path;
}

export function emptyBrain(args: {
  merchantId: string;
  merchantName: string;
  inputPainPoint: string;
}): MerchantBrain {
  return {
    runId: `run-${Date.now().toString(36)}`,
    merchantId: args.merchantId,
    merchantName: args.merchantName,
    inputPainPoint: args.inputPainPoint,
    createdAt: new Date().toISOString(),
    artifacts: {},
    audit: [],
    evals: {},
  };
}

export function lastAuditOf(
  brain: MerchantBrain,
  stage: StageId,
): { hash: string; parentHashes: string[] } | null {
  const entry = [...brain.audit].reverse().find((a) => a.stage === stage);
  if (!entry) return null;
  return { hash: entry.hash, parentHashes: entry.parentHashes };
}
