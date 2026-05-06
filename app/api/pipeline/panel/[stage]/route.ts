import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { loadBrain } from "@/lib/server/brain-store";
import { StageIdSchema } from "@/lib/server/schemas";
import {
  buildPanelReviewerPrompt,
  loadSubAgents,
} from "@/lib/server/sub-agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 7 parallel Anthropic calls. Each returns ≤2-3K output tokens. Pro cap is
// 300s; even with one slow reviewer this stays well under the limit.
export const maxDuration = 300;

const RequestBodySchema = z.object({
  merchantId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  apiKey: z.string().min(20).max(400).optional(),
  model: z.string().max(120).optional(),
});

// Reviewers reliably exceed tight character caps and occasionally return
// `recommendations` as a stringified array. Limits are deliberately generous
// (the UI clips with line-clamp anyway) and the preprocess accepts strings
// or string arrays — splitting on newlines / bullets when the model returns
// a single multi-line block.
const ReviewSchema = z.object({
  score: z.number().min(0).max(100),
  critique: z.string().min(1).max(8000),
  recommendations: z.preprocess((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      const trimmed = val.trim();
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // not JSON — fall through to bullet/newline split
      }
      const lines = trimmed
        .split(/\r?\n+/)
        .map((s) => s.replace(/^\s*(?:[-*•]\s*|\d+[.)]\s*)/, "").trim())
        .filter(Boolean);
      return lines.length ? lines : [trimmed];
    }
    return val;
  }, z.array(z.string().min(1).max(2000)).min(1).max(5)),
});
type Review = z.infer<typeof ReviewSchema>;

const TOOL_NAME = "submit_review";

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
  const { merchantId, apiKey, model } = parsed.data;

  const apiKeyResolved = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKeyResolved) {
    return NextResponse.json(
      {
        error:
          "Panel review requires an API key. Set ANTHROPIC_API_KEY on the server, or paste a key in Settings.",
      },
      { status: 400 },
    );
  }

  const seed = await loadBrain(merchantId);
  const artifact = seed.brain.artifacts[stage];
  if (!artifact) {
    return NextResponse.json(
      {
        error: `Stage '${stage}' has no artifact in the brain. Run the stage first.`,
      },
      { status: 409 },
    );
  }

  const start = Date.now();
  try {
    const client = new Anthropic({ apiKey: apiKeyResolved });
    const resolvedModel =
      model ?? process.env.PDLC_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
    const agents = loadSubAgents();
    const artifactJson = JSON.stringify(artifact, null, 2);
    const inputSchema = zodToJsonSchema(ReviewSchema, {
      target: "openApi3",
      $refStrategy: "none",
    }) as Record<string, unknown>;

    const reviews = await Promise.all(
      agents.map(async (agent) => {
        const { systemPrompt, userPrompt } = buildPanelReviewerPrompt(
          agent,
          stage,
          artifactJson,
        );
        try {
          const response = await client.messages.create({
            model: resolvedModel,
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
            tools: [
              {
                name: TOOL_NAME,
                description: `Submit a structured panel review with score, critique, and ≤3 recommendations.`,
                input_schema: inputSchema as Anthropic.Tool["input_schema"],
              },
            ],
            tool_choice: { type: "tool", name: TOOL_NAME },
          });
          const toolBlock = response.content.find((b) => b.type === "tool_use");
          if (!toolBlock || toolBlock.type !== "tool_use") {
            return {
              id: agent.id,
              label: agent.label,
              error: `model returned no ${TOOL_NAME} tool_use block`,
            };
          }
          const review = ReviewSchema.parse(toolBlock.input) satisfies Review;
          return { id: agent.id, label: agent.label, review };
        } catch (err) {
          return {
            id: agent.id,
            label: agent.label,
            error: err instanceof Error ? err.message : "review failed",
          };
        }
      }),
    );

    return NextResponse.json({
      ok: true,
      stage,
      merchantId,
      durationMs: Date.now() - start,
      model: resolvedModel,
      reviews,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "panel review failed",
        stage,
        durationMs: Date.now() - start,
      },
      { status: 500 },
    );
  }
}
