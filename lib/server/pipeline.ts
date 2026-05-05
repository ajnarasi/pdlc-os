import type { Executor } from "./executors";
import type { ExecutorContext } from "./executors/types";
import { sign } from "./sign";
import { saveBrain } from "./brain-store";
import { bindingFor } from "./skill-registry";
import type { MerchantBrain, StageId } from "./schemas";

export interface RunStageArgs {
  brain: MerchantBrain;
  stage: StageId;
  executor: Executor;
}

export interface RunStageResult {
  brain: MerchantBrain;
  hash: string;
  durationMs: number;
}

export async function runStage(args: RunStageArgs): Promise<RunStageResult> {
  const binding = bindingFor(args.stage);
  const parentHashes = collectParents(args.brain, args.stage);

  const ctx: ExecutorContext = {
    binding,
    stage: args.stage,
    brain: args.brain,
    painPoint: args.brain.inputPainPoint,
    merchantId: args.brain.merchantId ?? "unknown",
    merchantName: args.brain.merchantName,
    parentHashes,
  };

  const result = await args.executor.invoke(ctx, binding.outputSchema);

  const auditEntry = sign({
    stage: args.stage,
    agent: result.agentLabel,
    artifactName: result.artifactName,
    artifact: result.artifact,
    evalScore: result.evalLog.finalScore,
    evalVerdict: result.evalLog.finalVerdict,
    citations: result.citations,
    parentHashes,
  });

  const nextBrain: MerchantBrain = {
    ...args.brain,
    artifacts: {
      ...args.brain.artifacts,
      [args.stage]: result.artifact,
    } as MerchantBrain["artifacts"],
    audit: [...args.brain.audit, auditEntry],
    evals: { ...args.brain.evals, [args.stage]: result.evalLog },
  };
  await saveBrain(nextBrain);

  return {
    brain: nextBrain,
    hash: auditEntry.hash,
    durationMs: result.durationMs,
  };
}

function collectParents(brain: MerchantBrain, stage: StageId): string[] {
  const lastEntry = [...brain.audit].reverse()[0];
  if (!lastEntry) return [];
  if (lastEntry.stage === stage) return lastEntry.parentHashes;
  return [lastEntry.hash];
}
