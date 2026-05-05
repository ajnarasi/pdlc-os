"use client";

// claude-code is local-only (it shells out to a binary). The web app supports
// only cached + anthropic for portability.
export type Executor = "cached" | "anthropic";

export function normalizeExecutor(value: unknown): Executor {
  return value === "anthropic" ? "anthropic" : "cached";
}

export interface PdlcSettings {
  executor: Executor;
  apiKey?: string;
  model?: string;
}

const STORAGE_KEY = "pdlc.settings.v1";

const DEFAULT_SETTINGS: PdlcSettings = {
  executor: "cached",
};

export function readSettings(): PdlcSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as { executor?: unknown; apiKey?: string; model?: string };
    return {
      executor: normalizeExecutor(parsed.executor),
      apiKey: parsed.apiKey,
      model: parsed.model,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: PdlcSettings): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function maskKey(key: string | undefined): string {
  if (!key) return "(none)";
  if (key.length < 16) return "(invalid)";
  return `${key.slice(0, 12)}…${key.slice(-4)}`;
}

export const ANTHROPIC_MODELS = [
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
  "claude-opus-4-7",
] as const;
