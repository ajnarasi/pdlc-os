import type { Executor } from "../executors/index.js";
import type { ExecutorContext } from "../executors/types.js";
import { sign } from "./sign.js";
import { writeBrain } from "./brain-store.js";
import { bindingFor } from "./skill-registry.js";
import { stageRunLine } from "./render.js";
import type { MerchantBrain, StageId } from "./schemas.js";

export interface RunStageArgs {
  brain: MerchantBrain;
  stage: StageId;
  executor: Executor;
  index?: number;
  total?: number;
  silent?: boolean;
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
    merchantId: args.brain.merchantId,
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
  writeBrain(nextBrain);

  if (!args.silent) {
    stageRunLine({
      stage: args.stage,
      index: args.index ?? 0,
      total: args.total ?? 1,
      durationMs: result.durationMs,
      evalLog: result.evalLog,
      hash: auditEntry.hash,
      executor: args.executor.name,
    });
  }

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
