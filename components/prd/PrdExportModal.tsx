"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Copy, Download, X } from "lucide-react";

interface PrdExportModalProps {
  open: boolean;
  loading: boolean;
  error: string | null;
  title: string | null;
  prdMarkdown: string | null;
  durationMs: number | null;
  onClose: () => void;
}

export function PrdExportModal({
  open,
  loading,
  error,
  title,
  prdMarkdown,
  durationMs,
  onClose,
}: PrdExportModalProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!prdMarkdown) return;
    try {
      await navigator.clipboard.writeText(prdMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore — older browser or permission denied
    }
  }

  function download() {
    if (!prdMarkdown) return;
    const blob = new Blob([prdMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(title ?? "prd")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-rule bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3">
              <div className="min-w-0">
                <div className="eyebrow text-inkFaint">PRD export · synthesis</div>
                <h2 className="truncate font-display text-lg text-ink">
                  {title ?? (loading ? "synthesizing…" : "PRD")}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {prdMarkdown ? (
                  <>
                    <button
                      type="button"
                      onClick={copy}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-rule bg-paperAlt px-2 font-mono text-[0.7rem] text-inkMuted hover:text-accent"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "copied" : "copy"}
                    </button>
                    <button
                      type="button"
                      onClick={download}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-rule bg-paperAlt px-2 font-mono text-[0.7rem] text-inkMuted hover:text-accent"
                    >
                      <Download className="h-3.5 w-3.5" />
                      .md
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rule bg-paperAlt text-inkMuted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="font-mono text-xs text-inkMuted">
                  Synthesizing across all 9 stage artifacts via prd-draft skill…
                </div>
              ) : error ? (
                <div className="rounded-md border border-alert/40 bg-alertSoft/40 p-3 text-xs text-alert">
                  {error}
                </div>
              ) : prdMarkdown ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-[0.78rem] leading-relaxed text-ink">
                  {prdMarkdown}
                </pre>
              ) : (
                <div className="text-xs text-inkFaint">No content yet.</div>
              )}
            </div>

            {durationMs !== null && !loading ? (
              <div className="border-t border-rule px-5 py-2 font-mono text-[0.66rem] text-inkFaint">
                synthesis · {durationMs} ms
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
