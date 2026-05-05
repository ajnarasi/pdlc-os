"use client";

import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { KarpathyEvalLog } from "@/lib/types";

interface KarpathyLogProps {
  log: KarpathyEvalLog;
}

export function KarpathyLog({ log }: KarpathyLogProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-inkMuted">
        <span>rubric {log.rubricVersion}</span>
        <span>
          final {(log.finalScore * 100).toFixed(0)}% · {log.finalVerdict.toLowerCase()}
        </span>
      </div>
      {log.rounds.map((round) => (
        <div key={round.round} className="rounded-md border border-rule bg-paperAlt p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow text-inkFaint">Round {round.round}</span>
            <span className="text-xs text-inkMuted">{round.notes}</span>
          </div>
          <ul className="space-y-1.5">
            {round.criteria.map((c) => {
              const Icon =
                c.verdict === "PASS"
                  ? CheckCircle2
                  : c.verdict === "WARN"
                    ? AlertCircle
                    : XCircle;
              return (
                <li
                  key={c.id}
                  className="grid grid-cols-[auto_1fr_auto] items-start gap-2 text-xs"
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5",
                      c.verdict === "PASS"
                        ? "text-growth"
                        : c.verdict === "WARN"
                          ? "text-gold"
                          : "text-alert",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="text-ink">{c.label}</div>
                    <div className="text-inkFaint">{c.rationale}</div>
                  </div>
                  <span className="text-[0.72rem] text-inkMuted">
                    {(c.score * 100).toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
