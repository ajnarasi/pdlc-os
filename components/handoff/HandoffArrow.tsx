"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { EASE_EXPO } from "@/lib/motion";

interface HandoffArrowProps {
  active: boolean;
  label: string;
}

export function HandoffArrow({ active, label }: HandoffArrowProps) {
  return (
    <div className="relative flex items-center gap-3 py-2 pl-6">
      <motion.div
        animate={{
          opacity: active ? 1 : 0.25,
          scale: active ? 1 : 0.9,
        }}
        transition={{ duration: 0.4, ease: EASE_EXPO }}
        className="relative flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-accentSoft text-accent"
      >
        <ArrowDown className="h-3.5 w-3.5" />
        {active ? (
          <motion.div
            layoutId="handoff-pulse"
            className="absolute inset-0 rounded-full border border-accent"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
      </motion.div>
      <div className="font-mono text-[0.7rem] text-inkMuted">{label}</div>
    </div>
  );
}
