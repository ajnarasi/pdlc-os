"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chip } from "@/components/ui/Chip";
import type { StageId } from "@/lib/types";
import type { Executor } from "@/lib/settings";

interface PanelReviewProps {
  stage: StageId;
  merchantId: string;
  executor: Executor;
  apiKey?: string;
  model?: string;
  disabled?: boolean;
}

interface ReviewSuccess {
  id: string;
  label: string;
  review: {
    score: number;
    critique: string;
    recommendations: string[];
  };
}
interface ReviewFailure {
  id: string;
  label: string;
  error: string;
}
type ReviewItem = ReviewSuccess | ReviewFailure;

interface PanelResponse {
  ok: true;
  stage: StageId;
  durationMs: number;
  model: string;
  reviews: ReviewItem[];
}

export function PanelReview({
  stage,
  merchantId,
  executor,
  apiKey,
  model,
  disabled,
}: PanelReviewProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PanelResponse | null>(null);

  const liveDisabled = executor !== "anthropic" && !apiKey;

  async function run() {
    if (running || disabled) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/pipeline/panel/${encodeURIComponent(stage)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ merchantId, apiKey, model }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        setError(
          `Server returned ${res.status} ${res.statusText} (non-JSON). First chars: ${text.slice(0, 200).replace(/\s+/g, " ")}`,
        );
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(typeof data.error === "string" ? data.error : "Panel review failed.");
        return;
      }
      setResult(data as PanelResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-3 rounded-md border border-rule bg-paper/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-inkFaint">Panel review · 7 perspectives</span>
          {result ? (
            <Chip tone="muted">
              avg{" "}
              {avgScore(result.reviews).toFixed(0)}/100 · {result.durationMs}
              ms
            </Chip>
          ) : null}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running || disabled || liveDisabled}
          className="rounded-md border border-accent/40 bg-accentSoft/40 px-2 py-1 font-mono text-[0.66rem] text-accent transition-colors hover:bg-accentSoft disabled:opacity-50"
        >
          {running ? "running…" : result ? "re-run" : "run panel"}
        </button>
      </div>
      {liveDisabled ? (
        <p className="mt-1 text-[0.7rem] text-inkFaint">
          Panel review uses live Anthropic. Switch executor to{" "}
          <span className="font-mono">anthropic</span> or paste an API key.
        </p>
      ) : null}
      {error ? (
        <div className="mt-2 rounded-md border border-alert/40 bg-alertSoft/40 p-2 text-[0.7rem] text-alert">
          {error}
        </div>
      ) : null}
      <AnimatePresence>
        {result ? (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-1.5 overflow-hidden text-xs"
          >
            {result.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-rule bg-paperAlt/40 p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Chip tone="accent">{r.label}</Chip>
                    {"review" in r ? (
                      <span className="font-mono text-[0.7rem] text-ink">
                        {r.review.score}/100
                      </span>
                    ) : null}
                  </div>
                </div>
                {"review" in r ? (
                  <>
                    <p className="mt-1 text-ink">{r.review.critique}</p>
                    <ul className="mt-1 space-y-0.5 text-inkMuted">
                      {r.review.recommendations.map((rec, i) => (
                        <li key={i}>→ {rec}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-1 text-alert">error · {r.error}</p>
                )}
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function avgScore(reviews: ReviewItem[]): number {
  const scores = reviews
    .filter((r): r is ReviewSuccess => "review" in r)
    .map((r) => r.review.score);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
