import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { MerchantBrainSchema, type MerchantBrain, type StageId } from "./schemas";
import { DEMO_PIX_BRAIN_FALLBACK } from "@/lib/seed/demoPix";

/**
 * Brain storage that works on Vercel (KV) and locally (filesystem).
 *
 * - In production / preview deploys: requires KV_REST_API_URL + KV_REST_API_TOKEN
 *   (auto-set by Vercel when you provision a KV database).
 * - Locally without KV: uses ~/.pdlc/brains/{merchant}.json. Set PDLC_BRAIN_DIR
 *   to override.
 */

interface KvClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<unknown>;
  del(key: string): Promise<unknown>;
  keys(pattern: string): Promise<string[]>;
}

let cachedKv: KvClient | null | undefined;
async function getKv(): Promise<KvClient | null> {
  if (cachedKv !== undefined) return cachedKv;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    cachedKv = null;
    return cachedKv;
  }
  try {
    const mod = await import("@vercel/kv");
    cachedKv = mod.kv as unknown as KvClient;
  } catch {
    // @vercel/kv not installed yet — fall through to filesystem.
    cachedKv = null;
  }
  return cachedKv;
}

function brainKey(merchantId: string): string {
  return `pdlc:brain:${merchantId}`;
}

function fsBrainsDir(): string {
  return process.env.PDLC_BRAIN_DIR ?? join(homedir(), ".pdlc", "brains");
}

function fsBrainPath(merchantId: string): string {
  return join(fsBrainsDir(), `${merchantId}.json`);
}

export interface BrainSource {
  brain: MerchantBrain;
  source: "kv" | "file" | "fallback-demo";
  path?: string;
}

function ensureMerchantId(brain: MerchantBrain, merchantId: string): MerchantBrain {
  return brain.merchantId ? brain : { ...brain, merchantId };
}

export async function loadBrain(merchantId: string): Promise<BrainSource> {
  const kv = await getKv();
  if (kv) {
    try {
      const raw = await kv.get<unknown>(brainKey(merchantId));
      if (raw) {
        const parsed = MerchantBrainSchema.parse(raw);
        return { brain: ensureMerchantId(parsed, merchantId), source: "kv" };
      }
    } catch {
      // KV miss / parse failure — fall through to filesystem fallback below.
    }
  }
  const path = fsBrainPath(merchantId);
  if (existsSync(path)) {
    try {
      const raw = readFileSync(path, "utf8");
      const parsed = MerchantBrainSchema.parse(JSON.parse(raw));
      return {
        brain: ensureMerchantId(parsed, merchantId),
        source: "file",
        path,
      };
    } catch {
      // file unreadable / invalid — fall through to demo seed.
    }
  }
  return {
    brain: ensureMerchantId(DEMO_PIX_BRAIN_FALLBACK as MerchantBrain, merchantId),
    source: "fallback-demo",
  };
}

export async function saveBrain(brain: MerchantBrain): Promise<{
  source: "kv" | "file";
  path?: string;
}> {
  const validated = MerchantBrainSchema.parse(brain);
  const kv = await getKv();
  if (kv) {
    await kv.set(brainKey(validated.merchantId ?? "unknown"), validated);
    return { source: "kv" };
  }
  const path = fsBrainPath(validated.merchantId ?? "unknown");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  return { source: "file", path };
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
