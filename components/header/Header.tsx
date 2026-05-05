"use client";

import { FileText, Settings } from "lucide-react";

interface HeaderProps {
  onOpenSettings?: () => void;
  onExportPrd?: () => void;
  exportPrdDisabled?: boolean;
  exportPrdLabel?: string;
}

export function Header({
  onOpenSettings,
  onExportPrd,
  exportPrdDisabled,
  exportPrdLabel,
}: HeaderProps) {
  return (
    <header className="rule-bottom sticky top-0 z-30 bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-frame items-center justify-between gap-6 px-6 py-4 md:px-10">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-tight">
            PDLC<span className="text-accent">·</span>OS
          </span>
          <span className="hidden text-sm text-inkMuted sm:inline">
            <span className="text-inkFaint">·</span> one brain across 6 canonical + 3 extension stages
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onExportPrd ? (
            <button
              type="button"
              onClick={onExportPrd}
              disabled={exportPrdDisabled}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-accent/40 bg-accentSoft/40 px-3 text-xs text-accent transition-colors hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Export PRD"
              title="Synthesize one PRD across all 9 stage artifacts"
            >
              <FileText className="h-4 w-4" />
              <span className="font-mono">{exportPrdLabel ?? "Export PRD"}</span>
            </button>
          ) : null}
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
      </div>
    </header>
  );
}
