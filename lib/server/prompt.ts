import type { ExecutorContext } from "./executors/types";

export interface PromptBundle {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Builds the system + user prompt for an LLM-backed stage executor.
 *
 * Output-shape enforcement is no longer in the prompt — the AnthropicExecutor
 * uses tool_use with forced tool_choice and passes the JSON Schema directly
 * to the model. That makes the schema a contract, not a suggestion.
 *
 * The prompt's job is to give the model:
 *  1. The PM-OS skill markdown for this stage (the "how to think")
 *  2. The merchant context + pain point
 *  3. Prior stages' artifacts (so it builds ON them, not invents fresh ones)
 *  4. Hard constraints on what NOT to invent (platforms, JTBD ids, archetype ids)
 */
export function buildPromptBundle(
  ctx: ExecutorContext,
  skillContext: string,
): PromptBundle {
  const priorArtifacts = collectPriorArtifacts(ctx);

  const systemPrompt = [
    `You are the ${ctx.binding.agentLabel} stage agent inside PDLC-OS — a compounding-memory PM operating system for Fiserv.`,
    ``,
    `STAGE: ${ctx.stage} (${ctx.binding.id} v${ctx.binding.version})`,
    `DESCRIPTION: ${ctx.binding.description}`,
    ``,
    `## How to think (authoritative PM-OS skill context)`,
    ``,
    skillContext,
    ``,
    `## Hard constraints`,
    `- You MUST submit your output via the submit_artifact tool. Do not return prose.`,
    `- You MUST consume the prior-stage artifacts as input. Do not invent a different archetype, JTBD id, or merchant scenario than what prior stages established.`,
    `- Cite every claim against a brain artifact path that already exists. Do not invent platform names, regulators, dataset paths, or merchant names beyond what prior stages provide.`,
    `- Stay within the schema. Do not add fields the schema does not define.`,
    ``,
    `## Quality criteria for this stage`,
    ctx.binding.rubricCriteriaIds.map((c) => `- ${c}`).join("\n"),
  ].join("\n");

  const userPrompt = [
    `## Merchant`,
    `- merchantId: ${ctx.merchantId}`,
    `- merchantName: ${ctx.merchantName}`,
    ``,
    `## Pain point (Discovery seed)`,
    ctx.painPoint,
    ``,
    `## Prior-stage artifacts — these are the context you must build ON`,
    priorArtifacts || "(none — this is stage 1, derive from the pain point)",
    ``,
    `Submit the ${ctx.stage} artifact via the submit_artifact tool now.`,
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
