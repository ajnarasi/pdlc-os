"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { AuditEntry } from "@/lib/types";
import { STAGES } from "@/lib/types";

interface AuditRibbonProps {
  audit: AuditEntry[];
}

export function AuditRibbon({ audit }: AuditRibbonProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <footer className="rule-top sticky bottom-0 z-30 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-frame px-6 py-3 md:px-10">
        <div className="mb-2 flex items-center justify-between text-xs text-inkMuted">
          <span>
            Signed audit · {audit.length} artifact{audit.length === 1 ? "" : "s"}
          </span>
          <span className="text-inkFaint">
            click any to inspect provenance
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {audit.map((entry, idx) => {
            const stage = STAGES[entry.stage];
            const isOpen = openIndex === idx;
            return (
              <button
                type="button"
                key={entry.hash}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-md border bg-paperAlt p-2 text-left transition-colors",
                  isOpen ? "border-accent/60" : "border-rule hover:border-accent/40",
                )}
              >
                <div className="flex items-center justify-between text-[0.7rem] text-inkMuted">
                  <span>
                    {stage.num} · {stage.title}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </div>
                <div className="truncate text-xs text-ink">
                  {entry.artifactName}
                </div>
                <div className="truncate font-mono text-[0.66rem] text-inkFaint">
                  {entry.hash.slice(0, 12)}…
                </div>
              </button>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {openIndex !== null ? (
            <motion.div
              key={audit[openIndex].hash}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-3 overflow-hidden rounded-md border border-rule bg-paperAlt p-3 text-xs"
            >
              <AuditDetail entry={audit[openIndex]} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </footer>
  );
}

function AuditDetail({ entry }: { entry: AuditEntry }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <div className="eyebrow mb-1 text-inkFaint">Provenance</div>
        <div className="space-y-0.5 text-[0.72rem]">
          <Field label="stage" value={entry.stage} />
          <Field label="agent" value={entry.agent} />
          <Field label="artifact" value={entry.artifactName} />
          <Field label="at" value={entry.timestampISO} />
          <Field
            label="eval"
            value={`${(entry.evalScore * 100).toFixed(0)}% · ${entry.evalVerdict.toLowerCase()}`}
          />
          <Field
            label="hash"
            value={entry.hash}
            mono
            wrap
          />
          <Field
            label="parents"
            value={
              entry.parentHashes.length === 0
                ? "(genesis)"
                : entry.parentHashes.map((h) => h.slice(0, 12)).join(", ")
            }
            mono
          />
        </div>
      </div>
      <div>
        <div className="eyebrow mb-1 text-inkFaint">Citations</div>
        <ul className="space-y-1 text-xs">
          {entry.citations.map((c) => (
            <li key={c.path} className="flex items-start gap-2">
              <LinkIcon className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
              <div className="min-w-0">
                <div className="text-ink">{c.label}</div>
                <div className="truncate font-mono text-[0.66rem] text-inkFaint">
                  {c.path}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  wrap = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className="grid grid-cols-[5rem_1fr] items-baseline gap-2">
      <span className="text-inkFaint">{label}</span>
      <span
        className={cn(
          mono ? "font-mono text-[0.7rem]" : "",
          wrap ? "break-all" : "truncate",
          "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}
