import { spawn } from "node:child_process";
import type { z } from "zod";
import { defaultPassEval } from "../lib/karpathy.js";
import {
  composeSkillContext,
  loadAllSkillsForBinding,
} from "./skill-loader.js";
import { buildPromptBundle } from "./prompt.js";
import type {
  Executor,
  ExecutorContext,
  ExecutorResult,
} from "./types.js";

const CLAUDE_BIN = process.env.PDLC_CLAUDE_BIN ?? "claude";

export class ClaudeCodeExecutor implements Executor {
  readonly name = "claude-code" as const;

  describe(): string {
    return `claude-code · shells out to '${CLAUDE_BIN} -p' (uses your PM-OS skill registration)`;
  }

  async invoke<T>(
    ctx: ExecutorContext,
    schema: z.ZodType<T>,
  ): Promise<ExecutorResult<T>> {
    const start = Date.now();
    const skills = loadAllSkillsForBinding(ctx.binding);
    const skillContext = composeSkillContext(skills);
    const { systemPrompt, userPrompt } = buildPromptBundle(ctx, skillContext);
    const prompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

    const stdout = await runClaude(prompt);
    const json = parseClaudeOutput(stdout);
    const artifact = schema.parse(json) as T;

    return {
      artifact,
      artifactName: `${ctx.stage}.json`,
      agentLabel: `${ctx.binding.agentLabel} via claude-code`,
      citations: skills.map((s) => ({
        label: `PM-OS skill — ${s.name}`,
        path: s.path,
      })),
      evalLog: defaultPassEval(
        ctx.stage,
        "claude-code produced schema-valid artifact via PM-OS skills.",
      ),
      durationMs: Date.now() - start,
      rawResponse: stdout,
    };
  }
}

function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      CLAUDE_BIN,
      ["-p", "--output-format", "json", "--permission-mode", "default"],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      reject(
        new Error(
          `Failed to spawn '${CLAUDE_BIN}'. Is Claude Code installed and on PATH? Set PDLC_CLAUDE_BIN if it lives elsewhere. Underlying error: ${err.message}`,
        ),
      );
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `claude-code exited with status ${code}. stderr:\n${stderr.slice(-1500)}`,
          ),
        );
        return;
      }
      resolve(stdout);
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

interface ClaudeJsonEnvelope {
  result?: string;
  is_error?: boolean;
  message?: string;
  output?: string;
}

function parseClaudeOutput(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error("claude-code returned empty output.");
  }

  // The Claude Code --output-format json envelope wraps the assistant
  // response in { result, is_error, ... }. Try that first; fall back to
  // raw JSON if the envelope shape changes.
  let envelope: ClaudeJsonEnvelope | null = null;
  try {
    envelope = JSON.parse(trimmed) as ClaudeJsonEnvelope;
  } catch {
    envelope = null;
  }

  if (envelope?.is_error) {
    throw new Error(
      `claude-code reported is_error: ${envelope.message ?? "(no message)"}`,
    );
  }

  const inner = envelope?.result ?? envelope?.output ?? trimmed;
  return extractJsonObject(typeof inner === "string" ? inner : trimmed);
}

function extractJsonObject(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : raw).trim();
  const firstBrace = body.indexOf("{");
  const lastBrace = body.lastIndexOf("}");
  const candidate =
    firstBrace !== -1 && lastBrace > firstBrace
      ? body.slice(firstBrace, lastBrace + 1)
      : body;
  try {
    return JSON.parse(candidate);
  } catch (err) {
    throw new Error(
      `claude-code executor: failed to parse JSON. Raw output (first 800 chars):\n${raw.slice(0, 800)}\n\nParser error: ${(err as Error).message}`,
    );
  }
}
