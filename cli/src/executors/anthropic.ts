import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { defaultPassEval } from "../lib/karpathy.js";
import {
  composeSkillContext,
  loadAllSkillsForBinding,
} from "./skill-loader.js";
import { buildPromptBundle } from "./prompt.js";
import type {
  Executor,
  ExecutorContext,
  ExecutorResult,
} from "./types.js";

const DEFAULT_MODEL = process.env.PDLC_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = Number.parseInt(
  process.env.PDLC_ANTHROPIC_MAX_TOKENS ?? "16384",
  10,
);

export class AnthropicExecutor implements Executor {
  readonly name = "anthropic" as const;
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY ?? "", model?: string) {
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY not set. export ANTHROPIC_API_KEY=sk-... or pass via --api-key.",
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  describe(): string {
    return `anthropic · ${this.model} · skill markdown loaded as system prompt`;
  }

  async invoke<T>(
    ctx: ExecutorContext,
    schema: z.ZodType<T>,
  ): Promise<ExecutorResult<T>> {
    const start = Date.now();
    const skills = loadAllSkillsForBinding(ctx.binding);
    const skillContext = composeSkillContext(skills);
    const { systemPrompt, userPrompt } = buildPromptBundle(ctx, skillContext);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = extractText(response);
    const json = parseJsonStrict(text);
    const artifact = schema.parse(json) as T;

    return {
      artifact,
      artifactName: `${ctx.stage}.json`,
      agentLabel: `${ctx.binding.agentLabel} via ${this.model}`,
      citations: skills.map((s) => ({
        label: `PM-OS skill — ${s.name}`,
        path: s.path,
      })),
      evalLog: defaultPassEval(
        ctx.stage,
        `Anthropic ${this.model} produced schema-valid artifact under skill markdown system prompt.`,
      ),
      durationMs: Date.now() - start,
      rawResponse: text,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    };
  }
}

function extractText(response: Anthropic.Message): string {
  const parts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") parts.push(block.text);
  }
  return parts.join("\n").trim();
}

function parseJsonStrict(raw: string): unknown {
  // Strip ```json fences if the model added them.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : raw).trim();
  // Find the first balanced-looking JSON object. Falls back to JSON.parse
  // if the body is already a clean object.
  const firstBrace = body.indexOf("{");
  const lastBrace = body.lastIndexOf("}");
  const candidate =
    firstBrace !== -1 && lastBrace > firstBrace
      ? body.slice(firstBrace, lastBrace + 1)
      : body;
  try {
    return JSON.parse(candidate);
  } catch (err) {
    throw new Error(
      `Anthropic executor: failed to parse JSON response. Raw text:\n${raw.slice(0, 800)}\n\nParser error: ${(err as Error).message}`,
    );
  }
}
