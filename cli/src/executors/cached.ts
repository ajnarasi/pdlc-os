import { buildDemoPixBrain } from "../lib/demo-seed.js";
import { defaultPassEval } from "../lib/karpathy.js";
import type { Citation, MerchantBrain, StageId } from "../lib/schemas.js";
import type {
  Executor,
  ExecutorContext,
  ExecutorResult,
} from "./types.js";

/**
 * Cached executor — looks up the canonical Pix-into-A1 demo seed.
 * Demo-safe (zero network, deterministic). Use for the keynote demo or
 * when the user wants offline reproducibility.
 */
export class CachedExecutor implements Executor {
  readonly name = "cached" as const;

  describe(): string {
    return "cached · canonical Pix→A1 demo seed (offline, deterministic)";
  }

  async invoke<T>(ctx: ExecutorContext): Promise<ExecutorResult<T>> {
    const start = Date.now();
    const seed = buildDemoPixBrain({
      merchantId: ctx.merchantId,
      merchantName: ctx.merchantName,
      inputPainPoint: ctx.painPoint,
    });
    const stageArtifact = seed.artifacts[ctx.stage];
    if (!stageArtifact) {
      throw new Error(
        `Cached executor: no demo artifact for stage '${ctx.stage}'.`,
      );
    }
    const artifact = ctx.binding.outputSchema.parse(stageArtifact) as T;

    const seededAudit = seed.audit.find(
      (a: MerchantBrain["audit"][number]) => a.stage === ctx.stage,
    );
    const citations: Citation[] = seededAudit?.citations ?? [];

    const evalLog =
      seed.evals[ctx.stage] ??
      defaultPassEval(
        ctx.stage as StageId,
        "Cached seed validated against schema.",
      );

    return {
      artifact,
      artifactName: seededAudit?.artifactName ?? `${ctx.stage}.json`,
      agentLabel: seededAudit?.agent ?? ctx.binding.agentLabel,
      citations,
      evalLog,
      durationMs: Date.now() - start,
    };
  }
}
