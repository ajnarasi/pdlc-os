import { AnthropicExecutor } from "./anthropic.js";
import { CachedExecutor } from "./cached.js";
import { ClaudeCodeExecutor } from "./claude-code.js";
import type { Executor, ExecutorName } from "./types.js";

export function makeExecutor(
  name: ExecutorName,
  options: { apiKey?: string; model?: string } = {},
): Executor {
  switch (name) {
    case "cached":
      return new CachedExecutor();
    case "anthropic":
      return new AnthropicExecutor(options.apiKey, options.model);
    case "claude-code":
      return new ClaudeCodeExecutor();
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown executor '${exhaustive}'`);
    }
  }
}

export type { Executor, ExecutorContext, ExecutorResult, ExecutorName } from "./types.js";
