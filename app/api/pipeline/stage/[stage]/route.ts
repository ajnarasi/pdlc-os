import { NextResponse } from "next/server";
import { z } from "zod";
import { makeExecutor } from "@/lib/server/executors";
import { loadBrain } from "@/lib/server/brain-store";
import { runStage } from "@/lib/server/pipeline";
import { MerchantBrainSchema, StageIdSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Stage-level timeout. Cached: <100ms. Live · Anthropic with Sonnet 4.6 +
// large skill markdown context (Design stage loads 3 SKILL.md files): 30–90s
// typical, occasionally up to 120s. 300 is the Pro tier cap; gives headroom.
export const maxDuration = 300;

// brainSnapshot is the client's in-memory brain after the previous stage's
// success. Sending it bypasses any KV read-after-write replication lag in
// the per-stage chain — without it, stage 8's loadBrain may land on a
// replica that hasn't seen stage 7's write, silently dropping stage 7
// from the chain. Optional for backwards compat; required for correctness
// in the 9-stage flow against multi-region KV.
const RequestBodySchema = z.object({
  merchantId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  executor: z.enum(["cached", "anthropic"]),
  model: z.string().max(120).optional(),
  apiKey: z.string().min(20).max(400).optional(),
  brainSnapshot: z.unknown().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { stage: string } },
) {
  const stageParse = StageIdSchema.safeParse(params.stage);
  if (!stageParse.success) {
    return NextResponse.json(
      { error: `Unknown stage '${params.stage}'.` },
      { status: 400 },
    );
  }
  const stage = stageParse.data;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { merchantId, executor, model, apiKey, brainSnapshot } = parsed.data;

  if (executor === "anthropic") {
    const hasKey = Boolean(apiKey || process.env.ANTHROPIC_API_KEY);
    if (!hasKey) {
      return NextResponse.json(
        {
          error:
            "Live mode requires an API key. Set ANTHROPIC_API_KEY on the server, or paste a key in Settings.",
        },
        { status: 400 },
      );
    }
  }

  const start = Date.now();
  try {
    // Prefer the client-supplied snapshot to avoid stale KV reads. If it
    // parses cleanly and matches the merchantId, use it as the seed — the
    // chain is now driven by client state and not by KV replicas. KV
    // remains the durable store; we still write each stage to it for
    // page-reload recovery.
    let seedBrain;
    let seedSource: "snapshot" | "kv" | "file" | "fallback-demo" = "kv";
    if (brainSnapshot !== undefined) {
      const parsedSnap = MerchantBrainSchema.safeParse(brainSnapshot);
      if (parsedSnap.success && parsedSnap.data.merchantId === merchantId) {
        seedBrain = parsedSnap.data;
        seedSource = "snapshot";
      }
    }
    if (!seedBrain) {
      const loaded = await loadBrain(merchantId);
      if (loaded.source === "fallback-demo") {
        return NextResponse.json(
          {
            error: `No brain found for merchant '${merchantId}'. Call /api/pipeline/init first.`,
          },
          { status: 409 },
        );
      }
      seedBrain = loaded.brain;
      seedSource = loaded.source;
    }
    const exec = makeExecutor(executor, { apiKey, model });
    const result = await runStage({ brain: seedBrain, stage, executor: exec });
    return NextResponse.json({
      ok: true,
      merchantId,
      stage,
      seedSource,
      hash: result.hash,
      durationMs: result.durationMs,
      brain: result.brain,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : `stage '${stage}' failed`;
    return NextResponse.json(
      { error: message, stage, durationMs: Date.now() - start },
      { status: 500 },
    );
  }
}
