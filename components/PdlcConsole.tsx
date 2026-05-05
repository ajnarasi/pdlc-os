"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PainPointInput } from "@/components/input/PainPointInput";
import { Header } from "@/components/header/Header";
import { StageCard } from "@/components/stage/StageCard";
import { HandoffArrow } from "@/components/handoff/HandoffArrow";
import { AuditRibbon } from "@/components/audit/AuditRibbon";
import { BrainView } from "@/components/brain/BrainView";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { STAGES, STAGE_ORDER } from "@/lib/types";
import type { MerchantBrain, StageId } from "@/lib/types";
import { DEMO_PIX_BRAIN } from "@/lib/seed/demoPix";
import {
  readSettings,
  writeSettings,
  type Executor,
  type PdlcSettings,
} from "@/lib/settings";

type StageStatus = "pending" | "running" | "complete";

interface PdlcConsoleProps {
  initialBrain: MerchantBrain;
  brainSource?: "file" | "fallback-demo";
  brainPath?: string;
  activeMerchantId?: string;
}

export function PdlcConsole({
  initialBrain,
  brainSource = "fallback-demo",
  brainPath,
  activeMerchantId,
}: PdlcConsoleProps) {
  const [brain, setBrain] = useState<MerchantBrain>(initialBrain);
  const [stageStatus, setStageStatus] = useState<Record<StageId, StageStatus>>(
    () => buildStatuses(initialBrain),
  );
  const [currentBrainSource, setCurrentBrainSource] = useState<
    "file" | "fallback-demo"
  >(brainSource);
  const [currentBrainPath, setCurrentBrainPath] = useState<string | undefined>(
    brainPath,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PdlcSettings>({ executor: "cached" });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const merchantId = activeMerchantId ?? brain.merchantId ?? "A1";
  const handoffLabels = useMemo(buildHandoffLabels, []);
  const stopFlag = useRef(false);

  useEffect(() => {
    setSettings(readSettings());
  }, []);

  function loadDemo() {
    setBrain(DEMO_PIX_BRAIN);
    setStageStatus(buildStatuses(DEMO_PIX_BRAIN));
    setCurrentBrainSource("fallback-demo");
    setCurrentBrainPath(undefined);
    setIsRunning(false);
    setRunError(null);
  }

  async function runAll(
    painPoint: string,
    _pick?: {
      jtbd?: import("@/lib/jtbdCatalog").CatalogJtbd;
      archetype?: import("@/lib/jtbdCatalog").CatalogArchetype;
    },
  ) {
    if (isRunning) return;
    setIsRunning(true);
    setRunError(null);
    stopFlag.current = false;
    // Note: pick is currently encoded into painPoint via *AsPainPoint helpers.
    // Future: forward archetype/jtbd ids to the API for executor context.

    if (settings.executor === "anthropic" && !settings.apiKey) {
      setRunError(
        "anthropic executor requires an API key. Click the gear icon to add one.",
      );
      setIsRunning(false);
      return;
    }

    setBrain((prev) => ({
      ...prev,
      inputPainPoint: painPoint,
      artifacts: {},
      audit: [],
      evals: {},
      runId: `live-${Date.now().toString(36)}`,
    }));
    setStageStatus(allPending());
    setStageStatus((prev) => ({ ...prev, discovery: "running" }));

    const stopPolling = startBrainPolling(merchantId, (next) => {
      if (stopFlag.current) return;
      setBrain(next.brain);
      setCurrentBrainSource(next.source);
      setCurrentBrainPath(next.path);
      setStageStatus(buildStatusesWithRunning(next.brain));
    });

    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchantId,
          painPoint,
          executor: settings.executor,
          model: settings.model,
          apiKey: settings.apiKey,
          autoInit: true,
        }),
      });
      const data = (await res.json()) as ApiRunResponse;
      if (!res.ok || !("ok" in data) || !data.ok) {
        const message = "error" in data ? data.error : "pipeline run failed";
        setRunError(message);
      }
    } catch (err) {
      setRunError((err as Error).message);
    } finally {
      stopFlag.current = true;
      stopPolling();
      // Final fetch in case the last stage's poll missed
      try {
        const finalRes = await fetch(`/api/brain/${merchantId}`, {
          cache: "no-store",
        });
        const final = (await finalRes.json()) as ApiBrainResponse;
        setBrain(final.brain);
        setCurrentBrainSource(final.source);
        setCurrentBrainPath(final.path);
        setStageStatus(buildStatuses(final.brain));
      } catch {
        // ignore — UI already shows the last polled state
      }
      setIsRunning(false);
    }
  }

  function handleChangeExecutor(next: Executor) {
    const updated: PdlcSettings = { ...settings, executor: next };
    setSettings(updated);
    writeSettings(updated);
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="lg:w-[420px] lg:flex-shrink-0">
          <PainPointInput
            initialValue={brain.inputPainPoint}
            onRun={runAll}
            onLoadDemo={loadDemo}
            isRunning={isRunning}
            executor={settings.executor}
            hasApiKey={Boolean(settings.apiKey)}
            onChangeExecutor={handleChangeExecutor}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>

        <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-6 max-w-frame"
          >
            <p className="text-sm text-inkMuted">
              <span className="text-ink">Pain</span> ·{" "}
              <span className="font-mono text-xs">{brain.inputPainPoint}</span>
            </p>
          </motion.div>

          {runError ? (
            <div className="mb-4 rounded-md border border-alert/40 bg-alertSoft/40 p-3 text-xs text-alert">
              <span className="font-mono">run-error</span> · {runError}
            </div>
          ) : null}

          <div className="space-y-3">
            {STAGE_ORDER.map((stageId, idx) => {
              const stage = STAGES[stageId];
              const artifact = brain.artifacts[stageId];
              const evalLog = brain.evals[stageId];
              const status = stageStatus[stageId];
              return (
                <div key={stageId}>
                  <StageCard
                    stage={stage}
                    status={status}
                    artifact={artifact}
                    evalLog={evalLog}
                    defaultExpanded={idx === 0}
                  />
                  {idx < STAGE_ORDER.length - 1 ? (
                    <HandoffArrow
                      active={status === "complete"}
                      label={handoffLabels[idx]}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <BrainView brain={brain} />
      <AuditRibbon audit={brain.audit} />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onChange={(next) => setSettings(next)}
      />
    </div>
  );
}

interface ApiRunSuccess {
  ok: true;
  merchantId: string;
  executor: string;
  durationMs: number;
}
interface ApiRunFailure {
  error: string;
  exitCode?: number;
}
type ApiRunResponse = ApiRunSuccess | ApiRunFailure;

interface ApiBrainResponse {
  brain: MerchantBrain;
  source: "file" | "fallback-demo";
  path?: string;
}

function startBrainPolling(
  merchantId: string,
  onTick: (next: ApiBrainResponse) => void,
): () => void {
  let cancelled = false;
  const interval = setInterval(async () => {
    if (cancelled) return;
    try {
      const res = await fetch(`/api/brain/${merchantId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as ApiBrainResponse;
      if (cancelled) return;
      onTick(data);
    } catch {
      // swallow — next tick will retry
    }
  }, 600);
  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

function buildStatuses(b: MerchantBrain): Record<StageId, StageStatus> {
  const out: Record<StageId, StageStatus> = {
    discovery: "pending",
    prioritization: "pending",
    design: "pending",
    delivery: "pending",
    launch: "pending",
    support: "pending",
  };
  STAGE_ORDER.forEach((s) => {
    if (b.artifacts[s]) out[s] = "complete";
  });
  return out;
}

function buildStatusesWithRunning(
  b: MerchantBrain,
): Record<StageId, StageStatus> {
  const completed = buildStatuses(b);
  for (const stage of STAGE_ORDER) {
    if (completed[stage] === "pending") {
      completed[stage] = "running";
      break;
    }
  }
  return completed;
}

function allPending(): Record<StageId, StageStatus> {
  return {
    discovery: "pending",
    prioritization: "pending",
    design: "pending",
    delivery: "pending",
    launch: "pending",
    support: "pending",
  };
}

function buildHandoffLabels(): string[] {
  return [
    "discovery → prioritization · pain + archetype",
    "prioritization → design · GO + driver tree",
    "design → delivery · field map + envelope",
    "delivery → launch · tickets + readiness",
    "launch → support · pilots + metrics",
  ];
}
