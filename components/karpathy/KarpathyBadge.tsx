"use client";

import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EvalVerdict } from "@/lib/types";

interface KarpathyBadgeProps {
  verdict: EvalVerdict;
  score: number;
  onClick?: () => void;
}

const VERDICT_STYLES: Record<EvalVerdict, string> = {
  PASS: "bg-growthSoft text-growth border-growth/30",
  WARN: "bg-goldSoft text-gold border-gold/30",
  FAIL: "bg-alertSoft text-alert border-alert/30",
  PENDING: "bg-paperAlt text-inkMuted border-rule",
};

const VERDICT_LABEL: Record<EvalVerdict, string> = {
  PASS: "passed",
  WARN: "warn",
  FAIL: "failed",
  PENDING: "queued",
};

export function KarpathyBadge({ verdict, score, onClick }: KarpathyBadgeProps) {
  const Icon =
    verdict === "PASS"
      ? CheckCircle2
      : verdict === "WARN"
        ? AlertCircle
        : verdict === "FAIL"
          ? XCircle
          : Clock;
  const label =
    verdict === "PENDING"
      ? VERDICT_LABEL[verdict]
      : `${(score * 100).toFixed(0)}% · ${VERDICT_LABEL[verdict]}`;

  return (
    <button
      type="button"
      onClick={onClick}
      title="View evaluation log"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[0.72rem] font-medium",
        "transition-colors hover:brightness-95",
        VERDICT_STYLES[verdict],
      )}
    >
      <Icon className="h-3 w-3" />
      <span>eval</span>
      <span className="text-inkFaint">·</span>
      <span>{label}</span>
    </button>
  );
}
