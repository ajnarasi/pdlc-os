"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { EASE_EXPO, FADE_UP } from "@/lib/motion";
import type { KarpathyEvalLog, StageId, StageMeta } from "@/lib/types";
import { KarpathyBadge } from "@/components/karpathy/KarpathyBadge";
import { KarpathyLog } from "@/components/karpathy/KarpathyLog";
import { StageArtifactBody } from "./StageArtifactBody";
import { SKILL_BINDINGS } from "@/lib/skills";
import { previewLine } from "@/lib/preview";

interface StageCardProps {
  stage: StageMeta;
  status: "pending" | "running" | "complete";
  artifact?: unknown;
  evalLog?: KarpathyEvalLog;
  defaultExpanded?: boolean;
}

export function StageCard({
  stage,
  status,
  artifact,
  evalLog,
  defaultExpanded = false,
}: StageCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [logOpen, setLogOpen] = useState(false);
  const binding = SKILL_BINDINGS[stage.id as StageId];

  const verdict = evalLog?.finalVerdict ?? "PENDING";
  const score = evalLog?.finalScore ?? 0;
  const summary = previewLine(stage.id as StageId, artifact);

  return (
    <motion.article
      variants={FADE_UP}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.32, ease: EASE_EXPO }}
      className={cn(
        "relative overflow-hidden rounded-lg border bg-paperAlt/40 transition-colors",
        status === "running"
          ? "border-accent/60"
          : status === "complete"
            ? "border-rule"
            : "border-rule/60",
      )}
    >
      {status === "running" ? (
        <motion.div
          aria-hidden
          className="absolute left-0 right-0 top-0 h-px bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
          style={{ originX: 0 }}
        />
      ) : null}

      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className={cn(
          "flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3 text-left transition-colors",
          "hover:bg-paperAlt/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
        )}
      >
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="font-mono text-xs text-inkFaint">{stage.num}</span>
          <span className="font-display text-lg tracking-tight">
            {stage.title}
          </span>
          <span className="hidden truncate text-xs text-inkMuted sm:inline">
            · {summary}
          </span>
        </div>
        <div
          className="flex flex-shrink-0 items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {evalLog ? (
            <KarpathyBadge
              verdict={verdict}
              score={score}
              onClick={() => {
                setExpanded(true);
                setLogOpen((v) => !v);
              }}
            />
          ) : null}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-inkMuted"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </div>
      </div>

      <div className="block px-4 pb-2 text-xs text-inkMuted sm:hidden">
        {summary}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_EXPO }}
            className="overflow-hidden border-t border-rule"
          >
            <div className="px-4 py-4">
              <div className="mb-3 flex flex-col gap-1 text-[0.7rem] text-inkMuted">
                <span className="text-inkFaint">{stage.subtitle}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono">skill</span>
                  {binding.pmosSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-rule bg-paper/40 px-1.5 py-0.5 font-mono text-[0.62rem]"
                    >
                      /{s}
                    </span>
                  ))}
                </div>
              </div>

              <StageArtifactBody
                stage={stage.id as StageId}
                artifact={artifact}
              />

              <AnimatePresence>
                {logOpen && evalLog ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mt-3 overflow-hidden rounded-md border border-accent/30 bg-paper/60 p-3"
                  >
                    <div className="mb-2 text-[0.72rem] text-accent">
                      Evaluation log
                    </div>
                    <KarpathyLog log={evalLog} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
