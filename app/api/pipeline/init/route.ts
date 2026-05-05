import { NextResponse } from "next/server";
import { z } from "zod";
import { emptyBrain, loadBrain, saveBrain } from "@/lib/server/brain-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RequestBodySchema = z.object({
  merchantId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  painPoint: z.string().min(1).max(4000),
  merchantName: z.string().max(160).optional(),
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
  const { merchantId, painPoint, merchantName } = parsed.data;

  try {
    const seed = await loadBrain(merchantId);
    const resolvedName =
      merchantName ??
      (seed.brain.merchantName && seed.brain.merchantId === merchantId
        ? seed.brain.merchantName
        : `Merchant ${merchantId}`);
    const brain = emptyBrain({
      merchantId,
      merchantName: resolvedName,
      inputPainPoint: painPoint,
    });
    await saveBrain(brain);
    return NextResponse.json({
      ok: true,
      merchantId,
      runId: brain.runId,
      brain,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "init failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
