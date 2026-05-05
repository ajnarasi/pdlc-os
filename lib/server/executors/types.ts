import type { z } from "zod";
import type {
  Citation,
  KarpathyEvalLog,
  MerchantBrain,
  StageId,
} from "../schemas";
import type { SkillBinding } from "../skill-registry";

// claude-code is intentionally excluded — it shells out to a local binary that
// doesn't exist on Vercel serverless runners. The web app gates it out.
export type ExecutorName = "cached" | "anthropic";

export interface ExecutorContext {
  binding: SkillBinding;
  stage: StageId;
  brain: MerchantBrain;
  painPoint: string;
  merchantId: string;
  merchantName: string;
  parentHashes: string[];
}

export interface ExecutorResult<T = unknown> {
  artifact: T;
  artifactName: string;
  agentLabel: string;
  citations: Citation[];
  evalLog: KarpathyEvalLog;
  durationMs: number;
  rawResponse?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface Executor {
  name: ExecutorName;
  describe(): string;
  invoke<T>(
    ctx: ExecutorContext,
    schema: z.ZodType<T>,
  ): Promise<ExecutorResult<T>>;
}
