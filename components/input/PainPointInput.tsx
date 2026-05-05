"use client";

import { useState } from "react";
import { Sparkles, Play, Library, X, Layers, KeyRound } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CatalogArchetype, CatalogJtbd } from "@/lib/jtbdCatalog";
import { ScenarioPicker } from "@/components/scenarios/ScenarioPicker";
import {
  archetypeAsPainPoint,
  jtbdAsPainPoint,
} from "@/lib/jtbdCatalog";
import type { Executor } from "@/lib/settings";

interface PainPointInputProps {
  initialValue: string;
  onRun: (
    input: string,
    pick?: { jtbd?: CatalogJtbd; archetype?: CatalogArchetype },
  ) => void;
  onLoadDemo: () => void;
  isRunning: boolean;
  executor: Executor;
  hasApiKey: boolean;
  onChangeExecutor: (next: Executor) => void;
  onOpenSettings: () => void;
}

const PRESET_PAINS = [
  "Brazilian buyers abandon at checkout — we don't accept Pix.",
  "Mexican merchants need OXXO cash voucher acceptance.",
  "DACH merchants want Klarna BNPL for high-AOV carts.",
  "APAC merchants need GrabPay for cross-border SEA traffic.",
];

const EXECUTOR_OPTIONS: { id: Executor; label: string; sub: string }[] = [
  { id: "cached", label: "Cached demo", sub: "offline · no key needed" },
  { id: "anthropic", label: "Live · Anthropic", sub: "real LLM · key required" },
];

export function PainPointInput({
  initialValue,
  onRun,
  onLoadDemo,
  isRunning,
  executor,
  hasApiKey,
  onChangeExecutor,
  onOpenSettings,
}: PainPointInputProps) {
  const [value, setValue] = useState(initialValue);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedJtbd, setPickedJtbd] = useState<CatalogJtbd | null>(null);
  const [pickedArchetype, setPickedArchetype] = useState<CatalogArchetype | null>(null);

  function handlePickJtbd(jtbd: CatalogJtbd) {
    setPickedJtbd(jtbd);
    setPickedArchetype(null);
    setValue(jtbdAsPainPoint(jtbd));
    setPickerOpen(false);
  }

  function handlePickArchetype(archetype: CatalogArchetype) {
    setPickedArchetype(archetype);
    setPickedJtbd(null);
    setValue(archetypeAsPainPoint(archetype));
    setPickerOpen(false);
  }

  function clearPicks() {
    setPickedJtbd(null);
    setPickedArchetype(null);
  }

  const liveNeedsKey = executor === "anthropic" && !hasApiKey;

  return (
    <aside className="flex h-full flex-col gap-6 border-r border-rule bg-paperDeep p-6 md:p-8">
      <div className="space-y-2">
        <div className="eyebrow text-inkMuted">Merchant pain point</div>
        <h2 className="font-display text-3xl tracking-tight">
          Pick an archetype.<br />Watch six stages compose.
        </h2>
        <p className="text-sm leading-relaxed text-inkMuted">
          PDLC-OS runs Discovery through Support as one continuous,
          evidence-anchored agent run. Every artifact is signed and traceable
          to your brain.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex items-center justify-between gap-3 rounded-md border border-accent/40 bg-accentSoft px-3 py-2.5 text-left transition-colors hover:border-accent/60 hover:bg-accentSoft/80"
      >
        <span className="flex items-center gap-2 text-xs">
          <Library className="h-4 w-4 text-accent" />
          <span className="text-ink">Browse the scenario library</span>
        </span>
        <span className="text-[0.72rem] text-accent">
          17 archetypes · 628 JTBDs →
        </span>
      </button>

      {pickedArchetype ? (
        <div className="rounded-md border border-accent/30 bg-accentSoft/60 p-3 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-accent" />
                <span className="text-[0.72rem] text-accent">
                  {pickedArchetype.id} · archetype
                </span>
              </div>
              <div className="mt-1 line-clamp-2 text-ink">
                {pickedArchetype.name}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[0.7rem] text-inkMuted">
                {pickedArchetype.fullJtbdCount} JTBDs · {pickedArchetype.size}
                {pickedArchetype.gpvBand ? ` · ${pickedArchetype.gpvBand}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={clearPicks}
              className="rounded-md p-1 text-inkMuted hover:bg-paperAlt hover:text-ink"
              aria-label="Clear picked archetype"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {pickedJtbd ? (
        <div className="rounded-md border border-accent/30 bg-accentSoft/60 p-3 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[0.72rem] text-accent">
                  {pickedJtbd.id}
                </span>
                <span className="rounded-md border border-rule bg-paper px-1.5 py-0.5 text-[0.66rem] text-inkMuted">
                  {pickedJtbd.archetypeId}
                </span>
                <span className="rounded-md border border-rule bg-paper px-1.5 py-0.5 text-[0.66rem] text-inkMuted">
                  §{pickedJtbd.phaseId}
                </span>
              </div>
              <div className="mt-1 line-clamp-2 text-ink">{pickedJtbd.title}</div>
            </div>
            <button
              type="button"
              onClick={clearPicks}
              className="rounded-md p-1 text-inkMuted hover:bg-paperAlt hover:text-ink"
              aria-label="Clear picked JTBD"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="eyebrow text-inkMuted">Pain</span>
          {executor !== "cached" ? (
            <span className="text-inkFaint">live mode · ~$0.30 / run</span>
          ) : null}
        </div>
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (pickedJtbd || pickedArchetype) clearPicks();
          }}
          rows={4}
          className={cn(
            "w-full resize-none rounded-md border border-rule bg-paperAlt p-3 font-sans text-sm text-ink",
            "placeholder:text-inkFaint",
            "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40",
          )}
          placeholder="A real merchant complaint, ticket, QBR note — or pick from the scenario library above."
        />

        <div className="flex flex-wrap gap-1.5">
          {PRESET_PAINS.map((pain) => (
            <button
              key={pain}
              type="button"
              onClick={() => {
                clearPicks();
                setValue(pain);
              }}
              className="rounded-md border border-rule bg-paper px-2.5 py-1 text-xs text-inkMuted transition-colors hover:border-accent/40 hover:text-ink"
            >
              {pain.length > 56 ? `${pain.slice(0, 53)}…` : pain}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="eyebrow text-inkMuted">Run mode</span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1 text-[0.72rem] text-inkFaint hover:text-accent"
          >
            <KeyRound className="h-3 w-3" /> manage key
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-md border border-rule bg-paper p-1">
          {EXECUTOR_OPTIONS.map((opt) => {
            const active = executor === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeExecutor(opt.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded px-2 py-1.5 text-center text-[0.7rem] transition-colors",
                  active
                    ? "bg-accent text-paper"
                    : "text-inkMuted hover:bg-paperAlt hover:text-ink",
                )}
              >
                <span className={cn("font-medium", active ? "" : "text-ink")}>
                  {opt.label}
                </span>
                <span className={cn("text-[0.62rem]", active ? "text-paper/80" : "text-inkFaint")}>
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>
        {liveNeedsKey ? (
          <div className="rounded-md border border-alert/30 bg-alertSoft px-3 py-2 text-[0.7rem] text-alert">
            Live · Anthropic needs an API key.{" "}
            <button
              type="button"
              onClick={onOpenSettings}
              className="underline"
            >
              Add one in settings.
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={isRunning || value.trim().length < 8 || liveNeedsKey}
          onClick={() =>
            onRun(value.trim(), {
              jtbd: pickedJtbd ?? undefined,
              archetype: pickedArchetype ?? undefined,
            })
          }
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium",
            "bg-accent text-paper transition-colors hover:bg-accentBright",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent",
          )}
        >
          <Play className="h-4 w-4" />
          {isRunning ? "Running…" : "Run all six stages"}
        </button>

        <button
          type="button"
          onClick={() => {
            clearPicks();
            onLoadDemo();
          }}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium",
            "border border-rule bg-paper text-ink transition-colors hover:border-accent/40",
          )}
        >
          <Sparkles className="h-4 w-4 text-accent" />
          Load Pix demo
        </button>
      </div>

      <div className="mt-auto rounded-md border border-rule bg-paper p-4 text-xs text-inkMuted">
        <div className="eyebrow mb-2 text-inkFaint">Brain seed</div>
        <ul className="space-y-1">
          <li>17 merchant archetypes (all locked)</li>
          <li>628 JTBDs (550 full + 78 partial)</li>
          <li>55-APM coverage matrix</li>
          <li>Klarna ↔ Commerce Hub field mapping</li>
        </ul>
      </div>

      <ScenarioPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPickJtbd={handlePickJtbd}
        onPickArchetype={handlePickArchetype}
      />
    </aside>
  );
}
