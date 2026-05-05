"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type {
  CatalogArchetype,
  CatalogJtbd,
} from "@/lib/jtbdCatalog";
import { Chip } from "@/components/ui/Chip";
import { ArchetypeCard } from "./ArchetypeCard";
import { ArchetypeDetail } from "./ArchetypeDetail";

interface ScenarioPickerProps {
  open: boolean;
  onClose: () => void;
  onPickJtbd: (jtbd: CatalogJtbd) => void;
  onPickArchetype: (archetype: CatalogArchetype) => void;
}

interface CatalogResponse {
  total: number;
  matched: number;
  offset: number;
  limit: number;
  jtbds: CatalogJtbd[];
  archetypes: CatalogArchetype[];
  catalog: {
    totalJtbds: number;
    fullJtbds: number;
    partialJtbds: number;
    archetypeCount: number;
    generatedAt: string;
  };
}

type View =
  | { kind: "grid" }
  | { kind: "detail"; archetypeId: string }
  | { kind: "flat" };

const FLAT_PAGE_SIZE = 60;

export function ScenarioPicker({
  open,
  onClose,
  onPickJtbd,
  onPickArchetype,
}: ScenarioPickerProps) {
  const [view, setView] = useState<View>({ kind: "grid" });
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [includePartial, setIncludePartial] = useState(false);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [flatLoading, setFlatLoading] = useState(false);
  const [flatOffset, setFlatOffset] = useState(0);

  // Fetch catalog metadata once when picker opens; refetch flat list when filters change in flat view.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (view.kind === "flat") {
      if (query) params.set("q", query);
      if (!includePartial) params.set("includePartial", "false");
      params.set("limit", String(FLAT_PAGE_SIZE));
      params.set("offset", String(flatOffset));
      setFlatLoading(true);
    } else {
      params.set("limit", "1");
    }
    fetch(`/api/jtbds?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: CatalogResponse) => setData(d))
      .catch(() => {})
      .finally(() => setFlatLoading(false));
    return () => controller.abort();
  }, [open, view.kind, query, includePartial, flatOffset]);

  useEffect(() => {
    if (open) {
      setView({ kind: "grid" });
      setFlatOffset(0);
    }
  }, [open]);

  const archetypes = data?.archetypes ?? [];

  const filteredArchetypes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return archetypes.filter((a) => {
      if (tierFilter !== "" && String(a.tier) !== tierFilter) return false;
      if (!q) return true;
      return (
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.brandClass?.toLowerCase().includes(q) ?? false) ||
        (a.size?.toLowerCase().includes(q) ?? false) ||
        (a.channel ?? []).some((c) => c.toLowerCase().includes(q)) ||
        (a.vertical ?? []).some((v) => v.toLowerCase().includes(q)) ||
        (a.businessModel ?? []).some((b) => b.toLowerCase().includes(q))
      );
    });
  }, [archetypes, query, tierFilter]);

  function handlePickJtbd(j: CatalogJtbd) {
    onPickJtbd(j);
  }
  function handlePickArchetype(a: CatalogArchetype) {
    onPickArchetype(a);
  }
  function drillInto(a: CatalogArchetype) {
    setView({ kind: "detail", archetypeId: a.id });
  }
  function backToGrid() {
    setView({ kind: "grid" });
  }
  function toggleFlat() {
    setView((v) => (v.kind === "flat" ? { kind: "grid" } : { kind: "flat" }));
    setFlatOffset(0);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center bg-paper/70 px-4 py-10 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-rule bg-paper shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
              <div>
                <div className="eyebrow text-inkFaint">Scenario library</div>
                <h2 className="mt-1 font-display text-2xl tracking-tight">
                  {view.kind === "grid"
                    ? "Pick a merchant archetype"
                    : view.kind === "detail"
                      ? "Pick a JTBD inside this archetype"
                      : "All JTBDs (flat search)"}
                </h2>
                <p className="mt-1 text-xs text-inkMuted">
                  {data
                    ? `${data.catalog.archetypeCount} merchant archetypes (all status: locked) · ${data.catalog.fullJtbds} fully-specified JTBDs (+${data.catalog.partialJtbds} partial) — extracted from Fiserv Brain merchant-research.`
                    : "Loading catalog…"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 text-inkMuted hover:bg-paperAlt hover:text-ink"
                aria-label="Close picker"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-3 border-b border-rule bg-paperAlt/40 px-6 py-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-inkFaint" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setFlatOffset(0);
                  }}
                  placeholder={
                    view.kind === "grid"
                      ? "Search archetype id / name / size / channel / vertical / brand-class…"
                      : "Search JTBD id / title / Christensen / agent / actor…"
                  }
                  className="flex-1 rounded-md border border-rule bg-paper/60 px-3 py-2 text-sm text-ink placeholder:text-inkFaint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  autoFocus
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded-md border border-rule px-2 py-1 text-xs text-inkMuted hover:border-accent/30 hover:text-ink"
                  >
                    clear
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {view.kind === "grid" ? (
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="rounded-md border border-rule bg-paper/60 px-2 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
                  >
                    <option value="">All tiers</option>
                    <option value="0">Tier 0 (MVP-canonical)</option>
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                  </select>
                ) : null}

                <label className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-paper/40 px-2 py-1.5 text-inkMuted">
                  <input
                    type="checkbox"
                    checked={includePartial}
                    onChange={(e) => setIncludePartial(e.target.checked)}
                    className="accent-accent"
                  />
                  include partial JTBDs
                </label>

                <button
                  type="button"
                  onClick={toggleFlat}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs transition-colors",
                    view.kind === "flat"
                      ? "border-accent bg-accentSoft text-accent"
                      : "border-rule bg-paper/40 text-inkMuted hover:border-accent/30 hover:text-ink",
                  )}
                >
                  {view.kind === "flat"
                    ? "← Back to archetypes"
                    : "Flatten 628 JTBDs →"}
                </button>

                <span className="ml-auto font-mono text-[0.7rem] text-inkFaint">
                  {view.kind === "grid"
                    ? `${filteredArchetypes.length} of ${archetypes.length} archetypes`
                    : view.kind === "flat" && data
                      ? `${data.matched} JTBDs matched · showing ${Math.min(data.limit, data.jtbds.length)}`
                      : ""}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {view.kind === "grid" ? (
                <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredArchetypes.map((a) => (
                    <ArchetypeCard
                      key={a.id}
                      archetype={a}
                      onUse={handlePickArchetype}
                      onDrill={drillInto}
                    />
                  ))}
                  {filteredArchetypes.length === 0 ? (
                    <div className="col-span-full px-6 py-8 text-center text-sm text-inkMuted">
                      No archetypes match. Clear search or change tier filter.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {view.kind === "detail" ? (
                <ArchetypeDetail
                  archetypeId={view.archetypeId}
                  query={query}
                  includePartial={includePartial}
                  onBack={backToGrid}
                  onPickJtbd={handlePickJtbd}
                  onUseArchetype={handlePickArchetype}
                />
              ) : null}

              {view.kind === "flat" ? (
                <FlatJtbdList
                  data={data}
                  loading={flatLoading}
                  onPick={handlePickJtbd}
                />
              ) : null}
            </div>

            <footer className="flex items-center justify-between border-t border-rule bg-paperAlt/40 px-6 py-3 text-xs">
              <div className="text-inkMuted">
                {data ? (
                  <span className="font-mono text-[0.7rem]">
                    catalog generated {new Date(data.catalog.generatedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>
              {view.kind === "flat" && data ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={flatOffset === 0}
                    onClick={() => setFlatOffset(Math.max(0, flatOffset - FLAT_PAGE_SIZE))}
                    className={cn(
                      "rounded-md border border-rule bg-paper/40 px-3 py-1.5 text-xs",
                      flatOffset === 0
                        ? "cursor-not-allowed text-inkFaint"
                        : "text-ink hover:border-accent/30",
                    )}
                  >
                    ← prev
                  </button>
                  <span className="font-mono text-[0.7rem] text-inkFaint">
                    offset {flatOffset}
                  </span>
                  <button
                    type="button"
                    disabled={flatOffset + FLAT_PAGE_SIZE >= data.matched}
                    onClick={() => setFlatOffset(flatOffset + FLAT_PAGE_SIZE)}
                    className={cn(
                      "rounded-md border border-rule bg-paper/40 px-3 py-1.5 text-xs",
                      flatOffset + FLAT_PAGE_SIZE >= data.matched
                        ? "cursor-not-allowed text-inkFaint"
                        : "text-ink hover:border-accent/30",
                    )}
                  >
                    next →
                  </button>
                </div>
              ) : null}
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface FlatJtbdListProps {
  data: CatalogResponse | null;
  loading: boolean;
  onPick: (j: CatalogJtbd) => void;
}

function FlatJtbdList({ data, loading, onPick }: FlatJtbdListProps) {
  return (
    <>
      {loading ? (
        <div className="px-6 py-4 text-xs text-inkMuted">Loading…</div>
      ) : null}
      {data && data.jtbds.length === 0 && !loading ? (
        <div className="px-6 py-8 text-center text-sm text-inkMuted">
          No JTBDs match these filters.
        </div>
      ) : null}
      <ul className="divide-y divide-rule">
        {(data?.jtbds ?? []).map((j) => (
          <li key={j.id}>
            <button
              type="button"
              onClick={() => onPick(j)}
              className="w-full px-6 py-3 text-left transition-colors hover:bg-paperAlt/60"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[0.7rem] text-accent">{j.id}</span>
                <Chip tone="muted">{j.archetypeId}</Chip>
                <Chip tone="muted">
                  §{j.phaseId} · {j.phaseLabel}
                </Chip>
                {j.metadata.agentTarget ? (
                  <Chip tone="accent">
                    <span className="font-mono text-[0.62rem]">
                      {j.metadata.agentTarget.split(/[,(]/)[0].trim()}
                    </span>
                  </Chip>
                ) : null}
                {j.metadata.priority ? (
                  <Chip
                    tone={/^P0/.test(j.metadata.priority) ? "alert" : "muted"}
                  >
                    <span className="font-mono text-[0.62rem]">
                      {j.metadata.priority.split(" — ")[0]}
                    </span>
                  </Chip>
                ) : null}
                {j.partial ? <Chip tone="muted">partial</Chip> : null}
              </div>
              <div className="mt-1 text-sm font-medium text-ink">{j.title}</div>
              {j.when ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-inkMuted">
                  <span className="text-accent">When</span> {j.when} ·{" "}
                  <span className="text-accent">I want to</span> {j.iWantTo} ·{" "}
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
    </>
  );
}
