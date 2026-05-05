import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { defaultPassEval } from "../karpathy";
import {
  composeSkillContext,
  loadAllSkillsForBinding,
} from "../skill-loader";
import { buildPromptBundle } from "../prompt";
import type {
  Executor,
  ExecutorContext,
  ExecutorResult,
} from "./types";

const DEFAULT_MODEL =
  process.env.PDLC_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = Number.parseInt(
  process.env.PDLC_ANTHROPIC_MAX_TOKENS ?? "16384",
  10,
);

const TOOL_NAME = "submit_artifact";

export class AnthropicExecutor implements Executor {
  readonly name = "anthropic" as const;
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY missing. Set the env var on Vercel or paste a key in Settings.",
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  describe(): string {
    return `anthropic · ${this.model}`;
  }

  async invoke<T>(
    ctx: ExecutorContext,
    schema: z.ZodType<T>,
  ): Promise<ExecutorResult<T>> {
    const start = Date.now();
    const skills = loadAllSkillsForBinding(ctx.binding);
    const skillContext = composeSkillContext(skills);
    const { systemPrompt, userPrompt } = buildPromptBundle(ctx, skillContext);

    // Convert the Zod schema into a JSON Schema and define a single tool.
    // Forcing tool_choice on this tool makes the model emit a structured
    // tool_use block whose `input` matches the schema exactly — no prose,
    // no fenced JSON, no schema drift, no truncated freeform output.
    const inputSchema = zodToJsonSchema(schema, {
      target: "openApi3",
      $refStrategy: "none",
    }) as Record<string, unknown>;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      tools: [
        {
          name: TOOL_NAME,
          description: `Submit the ${ctx.stage} stage artifact for the merchant brain. Fill every required field strictly — do not invent fields, do not skip fields, do not nest extra structure.`,
          input_schema: inputSchema as Anthropic.Tool["input_schema"],
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
    });

    const toolBlock = extractToolUse(response, TOOL_NAME);
    if (!toolBlock) {
      throw new Error(
        `Anthropic executor: model did not return a ${TOOL_NAME} tool_use block (stop_reason=${response.stop_reason}). First text: ${extractText(response).slice(0, 400)}`,
      );
    }

    const artifact = schema.parse(toolBlock.input) as T;

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
        `Anthropic ${this.model} produced schema-valid artifact via tool_use enforcement.`,
      ),
      durationMs: Date.now() - start,
      rawResponse: JSON.stringify(toolBlock.input),
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    };
  }
}

interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}

function extractToolUse(
  response: Anthropic.Message,
  expectedName: string,
): ToolUseBlock | null {
  for (const block of response.content) {
    if (
      block.type === "tool_use" &&
      (block as ToolUseBlock).name === expectedName
    ) {
      return block as ToolUseBlock;
    }
  }
  return null;
}

function extractText(response: Anthropic.Message): string {
  const parts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") parts.push(block.text);
  }
  return parts.join("\n").trim();
}
