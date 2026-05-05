"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { MerchantBrain } from "@/lib/types";

interface BrainViewProps {
  brain: MerchantBrain;
}

export function BrainView({ brain }: BrainViewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-6 top-24 z-20 inline-flex items-center gap-2 rounded-full",
          "border border-accent/30 bg-accentSoft px-3 py-2 text-xs text-accent shadow-lg",
          "transition-transform hover:translate-y-[-1px]",
        )}
      >
        <Brain className="h-4 w-4" />
        <span>Brain</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-paper/70 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28 }}
              className="flex h-full w-full max-w-xl flex-col border-l border-rule bg-paper"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center justify-between border-b border-rule p-5">
                <div>
                  <div className="eyebrow text-inkFaint">Merchant brain</div>
                  <div className="font-display text-xl">
                    {brain.merchantName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-2 text-inkMuted hover:bg-paperAlt hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="flex-1 overflow-auto p-5">
                <pre className="whitespace-pre-wrap break-words font-mono text-[0.7rem] leading-relaxed text-ink">
                  {JSON.stringify(brain, null, 2)}
                </pre>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
