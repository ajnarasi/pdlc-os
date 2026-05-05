import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadBrain } from "@/lib/server/brain-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Single-call synthesis across all 9 artifacts + prd-draft skill markdown.
// Output is one markdown document, ~6-12K tokens. Fits well under the cap.
export const maxDuration = 300;

const RequestBodySchema = z.object({
  merchantId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  apiKey: z.string().min(20).max(400).optional(),
  model: z.string().max(120).optional(),
});

const OutputSchema = z.object({
  title: z.string().min(1).max(200),
  prdMarkdown: z.string().min(200).max(60000),
});

const TOOL_NAME = "submit_prd";

function loadPrdDraftSkill(): string {
  const path = join(
    process.cwd(),
    "lib",
    "server",
    "skill-md",
    "prd-draft.md",
  );
  if (existsSync(path)) return readFileSync(path, "utf8");
  return "(prd-draft skill markdown not bundled — use sound PM-OS PRD structure)";
}

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
  const { merchantId, apiKey, model } = parsed.data;

  const apiKeyResolved = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKeyResolved) {
    return NextResponse.json(
      {
        error:
          "PRD export requires an API key. Set ANTHROPIC_API_KEY on the server, or paste a key in Settings.",
      },
      { status: 400 },
    );
  }

  const seed = await loadBrain(merchantId);
  if (seed.source === "fallback-demo") {
    return NextResponse.json(
      {
        error: `No brain found for merchant '${merchantId}'. Run the pipeline first.`,
      },
      { status: 409 },
    );
  }

  const start = Date.now();
  try {
    const client = new Anthropic({ apiKey: apiKeyResolved });
    const resolvedModel =
      model ?? process.env.PDLC_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
    const skillContext = loadPrdDraftSkill();
    const inputSchema = zodToJsonSchema(OutputSchema, {
      target: "openApi3",
      $refStrategy: "none",
    }) as Record<string, unknown>;

    const systemPrompt = [
      `You are the prd-draft skill operating across the full PDLC-OS merchant brain.`,
      ``,
      `## How to think (authoritative PM-OS skill context)`,
      skillContext,
      ``,
      `## Hard constraints`,
      `- Submit your output via the submit_prd tool. Do not return prose outside the tool.`,
      `- Synthesize ALL 9 stage artifacts into one cohesive PRD — do not omit a stage's contribution.`,
      `- Cite each non-trivial claim against the brain artifact path it came from (e.g., "per artifacts.discovery.jtbd").`,
      `- Plain markdown. Section headers (##), bullet lists, code blocks for ISO envelope.`,
      `- Audience: a Fiserv VP who hasn't run the pipeline. Make the PRD readable cold.`,
    ].join("\n");

    const userPrompt = [
      `## Merchant`,
      `- merchantId: ${seed.brain.merchantId}`,
      `- merchantName: ${seed.brain.merchantName}`,
      `- runId: ${seed.brain.runId}`,
      ``,
      `## Pain point seed`,
      seed.brain.inputPainPoint,
      ``,
      `## Full brain JSON (all 9 stage artifacts)`,
      "```json",
      JSON.stringify(seed.brain.artifacts, null, 2),
      "```",
      ``,
      `Synthesize a publication-ready PRD. Submit via submit_prd now.`,
    ].join("\n");

    const response = await client.messages.create({
      model: resolvedModel,
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      tools: [
        {
          name: TOOL_NAME,
          description:
            "Submit the synthesized PRD as a single markdown document. Title separate, body in prdMarkdown.",
          input_schema: inputSchema as Anthropic.Tool["input_schema"],
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return NextResponse.json(
        {
          error: `Anthropic did not return a ${TOOL_NAME} tool_use block (stop_reason=${response.stop_reason}).`,
        },
        { status: 500 },
      );
    }
    const { title, prdMarkdown } = OutputSchema.parse(toolBlock.input);

    return NextResponse.json({
      ok: true,
      merchantId,
      title,
      prdMarkdown,
      durationMs: Date.now() - start,
      model: resolvedModel,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "PRD export failed",
        durationMs: Date.now() - start,
      },
      { status: 500 },
    );
  }
}
