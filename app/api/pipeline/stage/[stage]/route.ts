import { NextResponse } from "next/server";
import { z } from "zod";
import { makeExecutor } from "@/lib/server/executors";
import { loadBrain } from "@/lib/server/brain-store";
import { runStage } from "@/lib/server/pipeline";
import { StageIdSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Stage-level timeout. Cached: <100ms. Live · Anthropic with Sonnet 4.6 +
// large skill markdown context (Design stage loads 3 SKILL.md files): 30–90s
// typical, occasionally up to 120s. 300 is the Pro tier cap; gives headroom.
export const maxDuration = 300;

const RequestBodySchema = z.object({
  merchantId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  executor: z.enum(["cached", "anthropic"]),
  model: z.string().max(120).optional(),
  apiKey: z.string().min(20).max(400).optional(),
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
  const { merchantId, executor, model, apiKey } = parsed.data;

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
    const seed = await loadBrain(merchantId);
    if (seed.source === "fallback-demo") {
      return NextResponse.json(
        {
          error: `No brain found for merchant '${merchantId}'. Call /api/pipeline/init first.`,
        },
        { status: 409 },
      );
    }
    const exec = makeExecutor(executor, { apiKey, model });
    const result = await runStage({ brain: seed.brain, stage, executor: exec });
    return NextResponse.json({
      ok: true,
      merchantId,
      stage,
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
