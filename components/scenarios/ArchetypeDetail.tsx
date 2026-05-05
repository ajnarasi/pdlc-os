"use client";

import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { CatalogArchetype, CatalogJtbd } from "@/lib/jtbdCatalog";
import { Chip } from "@/components/ui/Chip";

interface ArchetypeDetailProps {
  archetypeId: string;
  query: string;
  includePartial: boolean;
  onBack: () => void;
  onPickJtbd: (jtbd: CatalogJtbd) => void;
  onUseArchetype: (a: CatalogArchetype) => void;
}

interface DetailResponse {
  archetype: CatalogArchetype;
  jtbdsByPhase: { phaseId: string; phaseLabel: string; jtbds: CatalogJtbd[] }[];
}

export function ArchetypeDetail({
  archetypeId,
  query,
  includePartial,
  onBack,
  onPickJtbd,
  onUseArchetype,
}: ArchetypeDetailProps) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/archetypes/${archetypeId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: DetailResponse) => {
        setData(d);
        // Open §3.1 by default
        setOpenPhases({ "3.1": true });
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [archetypeId]);

  const filteredPhases = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.jtbdsByPhase
      .map((g) => ({
        ...g,
        jtbds: g.jtbds.filter((j) => {
          if (!includePartial && j.partial) return false;
          if (!q) return true;
          return matchesQuery(j, q);
        }),
      }))
      .filter((g) => g.jtbds.length > 0);
  }, [data, query, includePartial]);

  function togglePhase(phaseId: string) {
    setOpenPhases((s) => ({ ...s, [phaseId]: !s[phaseId] }));
  }

  if (loading || !data) {
    return (
      <div className="px-6 py-8 text-xs text-inkMuted">Loading archetype…</div>
    );
  }

  const a = data.archetype;
  return (
    <div className="flex flex-col">
      <header className="space-y-3 border-b border-rule bg-paperAlt/40 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-md border border-rule bg-paper/40 px-2 py-1 text-xs text-inkMuted transition-colors hover:border-accent/30 hover:text-ink"
          >
            <ChevronLeft className="h-3 w-3" />
            All archetypes
          </button>
          <button
            type="button"
            onClick={() => onUseArchetype(a)}
            className="rounded-md border border-accent/40 bg-accentSoft/40 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accentSoft/60"
          >
            Use archetype (no specific JTBD) →
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-accent">{a.id}</span>
          {a.tier !== null ? (
            <Chip tone={a.tier === 0 ? "accent" : "muted"}>
              <span className="font-mono text-[0.62rem]">tier {a.tier}</span>
            </Chip>
          ) : null}
          {a.mvpSlice ? (
            <Chip tone="growth">
              <span className="font-mono text-[0.62rem]">slice {a.mvpSlice}</span>
            </Chip>
          ) : null}
          {a.status ? (
            <Chip tone="growth">
              <span className="font-mono text-[0.62rem]">{a.status}</span>
            </Chip>
          ) : null}
          {a.lastScore != null ? (
            <span className="font-mono text-[0.66rem] text-growth">
              eval {(a.lastScore * 100).toFixed(1)}%
            </span>
          ) : null}
        </div>
        <h2 className="font-display text-2xl tracking-tight">{a.name}</h2>
        {a.brandClass ? (
          <p className="text-xs text-inkMuted">
            <span className="text-inkFaint">brand-class:</span> {a.brandClass}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5 text-[0.66rem]">
          {a.size ? (
            <Chip tone="muted">
              <span className="font-mono">size: {a.size}</span>
            </Chip>
          ) : null}
          {a.gpvBand ? (
            <Chip tone="muted">
              <span className="font-mono">{a.gpvBand}</span>
            </Chip>
          ) : null}
          {a.channel?.map((c) => (
            <Chip tone="muted" key={c}>
              <span className="font-mono">{c}</span>
            </Chip>
          ))}
          {a.vertical?.map((v) => (
            <Chip tone="muted" key={v}>
              <span className="font-mono">{v}</span>
            </Chip>
          ))}
          {a.businessModel?.map((b) => (
            <Chip tone="muted" key={b}>
              <span className="font-mono">{b}</span>
            </Chip>
          ))}
          {a.brainPosture ? (
            <Chip tone="accent">
              <span className="font-mono">{a.brainPosture}</span>
            </Chip>
          ) : null}
        </div>
        {a.regulatoryOverlay?.length ? (
          <div className="flex flex-wrap items-center gap-1.5 text-[0.66rem]">
            <span className="text-inkFaint">regulatory:</span>
            {a.regulatoryOverlay.map((r) => (
              <Chip tone="alert" key={r}>
                <span className="font-mono">{r}</span>
              </Chip>
            ))}
          </div>
        ) : null}
      </header>

      <div className="divide-y divide-rule">
        {filteredPhases.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-inkMuted">
            No JTBDs match the search in this archetype.
          </div>
        ) : null}
        {filteredPhases.map((g) => {
          const isOpen = openPhases[g.phaseId] ?? false;
          return (
            <section key={g.phaseId}>
              <button
                type="button"
                onClick={() => togglePhase(g.phaseId)}
                className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-paperAlt/60"
              >
                <div className="flex items-center gap-2 text-sm">
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-inkMuted" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-inkMuted" />
                  )}
                  <span className="font-mono text-xs text-accent">§{g.phaseId}</span>
                  <span className="text-ink">{g.phaseLabel}</span>
                </div>
                <span className="font-mono text-[0.7rem] text-inkFaint">
                  {g.jtbds.length} JTBD{g.jtbds.length === 1 ? "" : "s"}
                </span>
              </button>
              {isOpen ? (
                <ul className="divide-y divide-rule/50 border-t border-rule/50 bg-paper/20">
                  {g.jtbds.map((j) => (
                    <li key={j.id}>
                      <button
                        type="button"
                        onClick={() => onPickJtbd(j)}
                        className="w-full px-8 py-3 text-left transition-colors hover:bg-paperAlt/60"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[0.7rem] text-accent">
                            {j.id}
                          </span>
                          {j.metadata.agentTarget ? (
                            <Chip tone="accent">
                              <span className="font-mono text-[0.62rem]">
                                {j.metadata.agentTarget.split(/[,(]/)[0].trim()}
                              </span>
                            </Chip>
                          ) : null}
                          {j.metadata.priority ? (
                            <Chip
                              tone={
                                /^P0/.test(j.metadata.priority) ? "alert" : "muted"
                              }
                            >
                              <span className="font-mono text-[0.62rem]">
                                {j.metadata.priority.split(" — ")[0]}
                              </span>
                            </Chip>
                          ) : null}
                          {j.partial ? <Chip tone="muted">partial</Chip> : null}
                        </div>
                        <div className="mt-1 text-sm font-medium text-ink">
                          {j.title}
                        </div>
                        {j.when ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-inkMuted">
                            <span className="text-accent">When</span> {j.when} ·{" "}
                            <span className="text-accent">I want to</span>{" "}
                            {j.iWantTo} ·{" "}
                            <span className="text-accent">so I can</span> {j.soICan}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs italic text-inkFaint">
                            Title-only entry — no Christensen body in the source.
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function matchesQuery(j: CatalogJtbd, q: string): boolean {
  return (
    j.id.toLowerCase().includes(q) ||
    j.title.toLowerCase().includes(q) ||
    j.when.toLowerCase().includes(q) ||
    j.iWantTo.toLowerCase().includes(q) ||
    j.soICan.toLowerCase().includes(q) ||
    (j.metadata.agentTarget?.toLowerCase().includes(q) ?? false) ||
    (j.metadata.actor?.toLowerCase().includes(q) ?? false)
  );
}
