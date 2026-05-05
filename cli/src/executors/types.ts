import type { z } from "zod";
import type {
  Citation,
  KarpathyEvalLog,
  MerchantBrain,
  StageId,
} from "../lib/schemas.js";
import type { SkillBinding } from "../lib/skill-registry.js";

export type ExecutorName = "cached" | "anthropic" | "claude-code";

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
  /** Human-readable summary for the run banner. */
  describe(): string;
  invoke<T>(
    ctx: ExecutorContext,
    schema: z.ZodType<T>,
  ): Promise<ExecutorResult<T>>;
}
