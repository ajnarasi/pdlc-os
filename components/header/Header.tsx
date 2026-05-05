"use client";

import { Settings } from "lucide-react";

interface HeaderProps {
  onOpenSettings?: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="rule-bottom sticky top-0 z-30 bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-frame items-center justify-between gap-6 px-6 py-4 md:px-10">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-tight">
            PDLC<span className="text-accent">·</span>OS
          </span>
          <span className="hidden text-sm text-inkMuted sm:inline">
            <span className="text-inkFaint">·</span> one brain across Discovery to Support
          </span>
        </div>
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rule bg-paperAlt text-inkMuted transition-colors hover:border-accent/40 hover:text-accent"
            aria-label="Settings"
            title="Executor &amp; API key"
          >
            <Settings className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </header>
  );
}
