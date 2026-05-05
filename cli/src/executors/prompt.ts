import { z } from "zod";
import type { ExecutorContext } from "./types.js";

const SCHEMA_HINT_FOR_LLM = `Return ONLY a single JSON object that matches the schema below. Do not include prose, markdown fences, or commentary outside the JSON. Every field is required unless marked optional.`;

export interface PromptBundle {
  systemPrompt: string;
  userPrompt: string;
}

export function buildPromptBundle(
  ctx: ExecutorContext,
  skillContext: string,
): PromptBundle {
  const priorArtifacts = collectPriorArtifacts(ctx);
  const schemaSummary = describeSchemaShape(ctx.binding.outputSchema);

  const systemPrompt = [
    `You are the ${ctx.binding.agentLabel} stage agent inside PDLC-OS — a compounding-memory PM operating system for Fiserv.`,
    ``,
    `STAGE: ${ctx.stage} (${ctx.binding.id} v${ctx.binding.version})`,
    `DESCRIPTION: ${ctx.binding.description}`,
    ``,
    `## Authoritative skill context (PM-OS)`,
    ``,
    skillContext,
    ``,
    `## Output contract`,
    ``,
    SCHEMA_HINT_FOR_LLM,
    ``,
    `### Output schema`,
    schemaSummary,
    ``,
    `## Karpathy rubric criteria you must satisfy`,
    ctx.binding.rubricCriteriaIds.map((c) => `- ${c}`).join("\n"),
    ``,
    `Cite every claim against an existing brain artifact path. Do not hallucinate platforms, regulators, or merchant names.`,
  ].join("\n");

  const userPrompt = [
    `## Merchant`,
    `- merchantId: ${ctx.merchantId}`,
    `- merchantName: ${ctx.merchantName}`,
    ``,
    `## Pain point (Discovery seed)`,
    ctx.painPoint,
    ``,
    `## Prior-stage artifacts (read-only — your output should consume these)`,
    priorArtifacts || "(none — this is stage 1)",
    ``,
    `Produce the ${ctx.stage} artifact JSON now.`,
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function collectPriorArtifacts(ctx: ExecutorContext): string {
  const entries = Object.entries(ctx.brain.artifacts).filter(
    ([, v]) => v != null,
  );
  if (entries.length === 0) return "";
  return entries
    .map(
      ([stage, artifact]) =>
        `### ${stage}.json\n\`\`\`json\n${JSON.stringify(artifact, null, 2)}\n\`\`\``,
    )
    .join("\n\n");
}

function describeSchemaShape(schema: z.ZodTypeAny): string {
  // Best-effort: stringify the Zod definition for the model. Not pretty,
  // but stable and concrete. Plus an example-shape line.
  try {
    const description = schemaDescribe(schema, 0);
    return ["```", description, "```"].join("\n");
  } catch {
    return "(schema description unavailable — match the artifact shape used in prior stages)";
  }
}

function schemaDescribe(schema: z.ZodTypeAny, depth: number): string {
  const pad = "  ".repeat(depth);
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const lines = Object.entries(shape).map(
      ([k, v]) => `${pad}  ${k}: ${schemaDescribe(v, depth + 1)}`,
    );
    return `{\n${lines.join(",\n")}\n${pad}}`;
  }
  if (schema instanceof z.ZodArray) {
    return `[${schemaDescribe(schema.element, depth)}]`;
  }
  if (schema instanceof z.ZodString) return "string";
  if (schema instanceof z.ZodNumber) return "number";
  if (schema instanceof z.ZodBoolean) return "boolean";
  if (schema instanceof z.ZodEnum) {
    const values = (schema as z.ZodEnum<[string, ...string[]]>).options;
    return `enum(${values.join(" | ")})`;
  }
  if (schema instanceof z.ZodOptional) {
    return `${schemaDescribe(schema.unwrap(), depth)}?`;
  }
  if (schema instanceof z.ZodRecord) {
    return "Record<string, unknown>";
  }
  return "unknown";
}
