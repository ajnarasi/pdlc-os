import { NextResponse } from "next/server";
import { z } from "zod";
import { makeExecutor } from "@/lib/server/executors";
import { emptyBrain, loadBrain, saveBrain } from "@/lib/server/brain-store";
import { runStage } from "@/lib/server/pipeline";
import { STAGE_ORDER } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // up to 5 min for live runs (Vercel Pro tier)

const RequestBodySchema = z.object({
  merchantId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  painPoint: z.string().min(1).max(4000),
  executor: z.enum(["cached", "anthropic"]),
  model: z.string().max(120).optional(),
  apiKey: z.string().min(20).max(400).optional(),
  autoInit: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
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
  const { merchantId, painPoint, executor, model, apiKey } = parsed.data;

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
    const exec = makeExecutor(executor, { apiKey, model });

    // Reset the merchant brain to a fresh run with this pain point.
    const seed = await loadBrain(merchantId);
    const merchantName =
      seed.brain.merchantName && seed.brain.merchantId === merchantId
        ? seed.brain.merchantName
        : `Merchant ${merchantId}`;
    let brain = emptyBrain({ merchantId, merchantName, inputPainPoint: painPoint });
    await saveBrain(brain);

    for (const stage of STAGE_ORDER) {
      const result = await runStage({ brain, stage, executor: exec });
      brain = result.brain;
    }

    return NextResponse.json({
      ok: true,
      merchantId,
      executor,
      durationMs: Date.now() - start,
      runId: brain.runId,
      auditCount: brain.audit.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "pipeline run failed";
    return NextResponse.json(
      { error: message, durationMs: Date.now() - start },
      { status: 500 },
    );
  }
}
