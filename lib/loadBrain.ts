import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { MerchantBrain } from "./types";
import { DEMO_PIX_BRAIN } from "./seed/demoPix";

export interface BrainSource {
  brain: MerchantBrain;
  source: "file" | "fallback-demo";
  path?: string;
}

const ENV_OVERRIDE = process.env.PDLC_BRAIN_DIR;

function brainsDir(): string {
  return ENV_OVERRIDE ?? join(homedir(), ".pdlc", "brains");
}

export async function loadBrain(merchantId: string): Promise<BrainSource> {
  const path = join(brainsDir(), `${merchantId}.json`);
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as MerchantBrain;
    if (
      parsed &&
      typeof parsed === "object" &&
      "runId" in parsed &&
      "audit" in parsed
    ) {
      return { brain: parsed, source: "file", path };
    }
  } catch {
    // file missing, malformed JSON, or schema mismatch — fall through to demo
  }
  return { brain: DEMO_PIX_BRAIN, source: "fallback-demo" };
}
