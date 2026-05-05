"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CatalogArchetype } from "@/lib/jtbdCatalog";
import { Chip } from "@/components/ui/Chip";

interface ArchetypeCardProps {
  archetype: CatalogArchetype;
  onUse: (a: CatalogArchetype) => void;
  onDrill: (a: CatalogArchetype) => void;
}

export function ArchetypeCard({ archetype, onUse, onDrill }: ArchetypeCardProps) {
  const isCanonical = archetype.tier === 0;
  const scorePct =
    archetype.lastScore != null
      ? `${(archetype.lastScore * 100).toFixed(1)}%`
      : null;

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-paperAlt/40 p-4 transition-colors",
        isCanonical
          ? "border-accent/50 bg-accentSoft/20"
          : "border-rule hover:border-accent/30",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-accent">{archetype.id}</span>
            {archetype.tier !== null ? (
              <Chip tone={isCanonical ? "accent" : "muted"}>
                <span className="font-mono text-[0.62rem]">tier {archetype.tier}</span>
              </Chip>
            ) : null}
            {archetype.mvpSlice ? (
              <Chip tone="growth">
                <span className="font-mono text-[0.62rem]">slice {archetype.mvpSlice}</span>
              </Chip>
            ) : null}
            {archetype.status ? (
              <Chip tone={archetype.status === "locked" ? "growth" : "muted"}>
                <span className="font-mono text-[0.62rem]">{archetype.status}</span>
              </Chip>
            ) : null}
          </div>
          <h3 className="mt-1 font-display text-base leading-snug text-ink">
            {archetype.name}
          </h3>
        </div>
        {scorePct ? (
          <div className="flex flex-shrink-0 flex-col items-end gap-0.5 text-right">
            <span className="font-mono text-xs text-growth">{scorePct}</span>
            <span className="text-[0.62rem] text-inkFaint">eval r{archetype.lastRound ?? "?"}</span>
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-1 text-[0.66rem]">
        {archetype.size ? (
          <Chip tone="muted">
            <span className="font-mono">{archetype.size}</span>
          </Chip>
        ) : null}
        {archetype.gpvBand ? (
          <Chip tone="muted">
            <span className="font-mono">{archetype.gpvBand}</span>
          </Chip>
        ) : null}
        {archetype.channel?.slice(0, 2).map((c) => (
          <Chip tone="muted" key={c}>
            <span className="font-mono">{c}</span>
          </Chip>
        ))}
      </div>

      {archetype.brandClass ? (
        <p className="line-clamp-2 text-[0.7rem] text-inkMuted">
          <span className="text-inkFaint">e.g.</span> {archetype.brandClass}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-2 rounded-md border border-rule bg-paper/40 px-2 py-1.5 text-center text-[0.66rem]">
        <div>
          <div className="font-mono text-ink">{archetype.jtbdCount}</div>
          <div className="text-inkFaint">JTBDs</div>
        </div>
        <div>
          <div className="font-mono text-ink">{archetype.fullJtbdCount}</div>
          <div className="text-inkFaint">full</div>
        </div>
        <div>
          <div className={cn("font-mono", archetype.p0JtbdCount > 0 ? "text-alert" : "text-inkFaint")}>
            {archetype.p0JtbdCount}
          </div>
          <div className="text-inkFaint">P0</div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onUse(archetype)}
          className="rounded-md border border-accent/40 bg-accentSoft/40 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accentSoft/60"
        >
          Use archetype
        </button>
        <button
          type="button"
          onClick={() => onDrill(archetype)}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-rule bg-paper/40 px-3 py-2 text-xs text-inkMuted transition-colors hover:border-accent/30 hover:text-ink"
        >
          Browse {archetype.fullJtbdCount} <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}
