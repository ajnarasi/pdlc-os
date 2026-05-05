import { AnthropicExecutor } from "./anthropic";
import { CachedExecutor } from "./cached";
import type { Executor, ExecutorName } from "./types";

export function makeExecutor(
  name: ExecutorName,
  options: { apiKey?: string; model?: string } = {},
): Executor {
  switch (name) {
    case "cached":
      return new CachedExecutor();
    case "anthropic": {
      const key = options.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
      return new AnthropicExecutor(key, options.model);
    }
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown executor '${exhaustive}'`);
    }
  }
}

export type { Executor, ExecutorContext, ExecutorResult, ExecutorName } from "./types";
