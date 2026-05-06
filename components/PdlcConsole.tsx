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
import { PrdExportModal } from "@/components/prd/PrdExportModal";
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
    "kv" | "file" | "fallback-demo"
  >(brainSource);
  const [currentBrainPath, setCurrentBrainPath] = useState<string | undefined>(
    brainPath,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PdlcSettings>({ executor: "cached" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prdOpen, setPrdOpen] = useState(false);
  const [prdLoading, setPrdLoading] = useState(false);
  const [prdError, setPrdError] = useState<string | null>(null);
  const [prdTitle, setPrdTitle] = useState<string | null>(null);
  const [prdBody, setPrdBody] = useState<string | null>(null);
  const [prdDurationMs, setPrdDurationMs] = useState<number | null>(null);

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

    try {
      // Step 1 — init: server resets the brain to empty + writes pain to KV.
      const initRes = await fetch("/api/pipeline/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ merchantId, painPoint }),
      });
      const initData = await readApiResponse<ApiInitSuccess>(initRes);
      if (!initRes.ok || !("ok" in initData) || !initData.ok) {
        const message = "error" in initData ? initData.error : "init failed";
        setRunError(message);
        return;
      }
      setBrain(initData.brain);

      // Track (a) the latest brain we have in hand to send back as a
      // snapshot to the next stage, and (b) the highest artifact count
      // we've successfully written. Both protect against Vercel KV
      // (Upstash) read-after-write replication lag — without them, stage
      // N can land on a replica that hasn't seen stage N-1's write,
      // silently dropping prior stages from the chain.
      let latestBrain = initData.brain;
      let highestArtifactCount = countArtifacts(initData.brain);

      // Step 2 — run each stage as its own request. Each call is ≤60s,
      // safely under any tier / proxy timeout. Audit ribbon updates after
      // each stage settles, so the demo visibly progresses.
      for (const stage of STAGE_ORDER) {
        if (stopFlag.current) break;
        setStageStatus((prev) => ({ ...prev, [stage]: "running" }));
        const stageRes = await fetch(
          `/api/pipeline/stage/${encodeURIComponent(stage)}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              merchantId,
              executor: settings.executor,
              model: settings.model,
              apiKey: settings.apiKey,
              // Send the latest brain so the server doesn't have to
              // re-read it from a possibly-stale KV replica.
              brainSnapshot: latestBrain,
            }),
          },
        );
        const stageData = await readApiResponse<ApiStageSuccess>(stageRes);
        if (!stageRes.ok || !("ok" in stageData) || !stageData.ok) {
          const message =
            "error" in stageData
              ? `Stage ${stage}: ${stageData.error}`
              : `Stage ${stage} failed`;
          setRunError(message);
          setStageStatus((prev) => ({ ...prev, [stage]: "pending" }));
          return;
        }
        setBrain(stageData.brain);
        setStageStatus(buildStatuses(stageData.brain));
        latestBrain = stageData.brain;
        highestArtifactCount = Math.max(
          highestArtifactCount,
          countArtifacts(stageData.brain),
        );
      }

      // Optional defensive final fetch — accept ONLY if (a) source is not
      // the demo fallback AND (b) the fetched brain has at least as many
      // populated artifacts as we wrote.
      //
      // Why the count guard: Vercel KV (Upstash) has read-after-write
      // replication lag on multi-region setups. Right after the last
      // stage's write, a fetch can return a stale snapshot from before
      // the most recent stages landed — source is still "kv", so the
      // fallback-demo guard alone does not catch it. Without this count
      // check, stages 7/8/9 silently reset after they completed
      // successfully (user-report 2026-05-06).
      try {
        const finalRes = await fetch(`/api/brain/${merchantId}`, {
          cache: "no-store",
        });
        const final = await readApiResponse<ApiBrainResponse>(finalRes);
        if (
          "brain" in final &&
          final.source !== "fallback-demo" &&
          countArtifacts(final.brain) >= highestArtifactCount
        ) {
          setBrain(final.brain);
          setCurrentBrainSource(final.source);
          setCurrentBrainPath(final.path);
          setStageStatus(buildStatuses(final.brain));
        }
      } catch {
        // ignore — UI already shows the last in-flight state.
      }
    } catch (err) {
      setRunError(describeFetchError(err));
    } finally {
      stopFlag.current = true;
      setIsRunning(false);
    }
  }

  function handleChangeExecutor(next: Executor) {
    const updated: PdlcSettings = { ...settings, executor: next };
    setSettings(updated);
    writeSettings(updated);
  }

  const stageCount = STAGE_ORDER.filter((s) => brain.artifacts[s]).length;
  const prdReady = stageCount >= STAGE_ORDER.length;

  async function exportPrd() {
    if (prdLoading) return;
    setPrdOpen(true);
    setPrdLoading(true);
    setPrdError(null);
    setPrdTitle(null);
    setPrdBody(null);
    setPrdDurationMs(null);
    try {
      const res = await fetch("/api/pipeline/export/prd", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchantId,
          apiKey: settings.apiKey,
          model: settings.model,
        }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        const text = await res.text();
        setPrdError(
          `Server returned ${res.status} ${res.statusText} (non-JSON). First chars: ${text.slice(0, 200).replace(/\s+/g, " ")}`,
        );
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPrdError(typeof data.error === "string" ? data.error : "PRD export failed.");
        return;
      }
      setPrdTitle(data.title);
      setPrdBody(data.prdMarkdown);
      setPrdDurationMs(data.durationMs ?? null);
    } catch (err) {
      setPrdError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setPrdLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onExportPrd={exportPrd}
        exportPrdDisabled={!prdReady || prdLoading}
        exportPrdLabel={
          prdLoading
            ? "synthesizing…"
            : prdReady
              ? "Export PRD"
              : `Export PRD (${stageCount}/${STAGE_ORDER.length})`
        }
      />

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
              const prevStage = idx > 0 ? STAGES[STAGE_ORDER[idx - 1]] : null;
              const showExtensionSeparator =
                prevStage?.kind === "canonical" && stage.kind === "extension";
              return (
                <div key={stageId}>
                  {showExtensionSeparator ? (
                    <div className="my-4 flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.18em] text-inkFaint">
                      <span className="h-px flex-1 bg-rule" />
                      <span>— extension stages —</span>
                      <span className="h-px flex-1 bg-rule" />
                    </div>
                  ) : null}
                  <StageCard
                    stage={stage}
                    status={status}
                    artifact={artifact}
                    evalLog={evalLog}
                    defaultExpanded={idx === 0}
                    merchantId={merchantId}
                    executor={settings.executor}
                    apiKey={settings.apiKey}
                    model={settings.model}
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

      <PrdExportModal
        open={prdOpen}
        loading={prdLoading}
        error={prdError}
        title={prdTitle}
        prdMarkdown={prdBody}
        durationMs={prdDurationMs}
        onClose={() => setPrdOpen(false)}
      />
    </div>
  );
}

interface ApiInitSuccess {
  ok: true;
  merchantId: string;
  runId: string;
  brain: MerchantBrain;
}

interface ApiStageSuccess {
  ok: true;
  merchantId: string;
  stage: StageId;
  hash: string;
  durationMs: number;
  brain: MerchantBrain;
}

interface ApiBrainResponse {
  brain: MerchantBrain;
  // Server returns "kv" when read from Vercel KV, "file" for filesystem
  // (local dev), and "fallback-demo" when both stores miss. The Header chip
  // collapses kv+file into "file" since either way it's a real persisted brain.
  source: "kv" | "file" | "fallback-demo";
  path?: string;
}

/**
 * Reads a fetch Response. If the body isn't JSON (server crash, gateway
 * timeout, Vercel platform error returning HTML), returns a structured error
 * with the HTTP status and the first 200 chars of the body — so the UI can
 * surface "Server returned 504 Gateway Timeout (non-JSON). First chars: An
 * error occurred…" instead of opaque "Unexpected token 'A'…" parse errors.
 */
async function readApiResponse<TSuccess>(
  res: Response,
): Promise<TSuccess | { error: string }> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return (await res.json()) as TSuccess | { error: string };
    } catch (err) {
      return {
        error: `Server claimed JSON but the body failed to parse (${res.status} ${res.statusText}): ${(err as Error).message}`,
      };
    }
  }
  let snippet = "";
  try {
    const text = await res.text();
    snippet = text.slice(0, 200).replace(/\s+/g, " ").trim();
  } catch {
    snippet = "(body unreadable)";
  }
  return {
    error: `Server returned ${res.status} ${res.statusText} (non-JSON). First chars: ${snippet}`,
  };
}

function describeFetchError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return "Request was aborted.";
    return `Network error: ${err.message}`;
  }
  return "Unknown error contacting /api/pipeline/run.";
}

function countArtifacts(b: MerchantBrain): number {
  return STAGE_ORDER.reduce((acc, s) => (b.artifacts[s] ? acc + 1 : acc), 0);
}

function buildStatuses(b: MerchantBrain): Record<StageId, StageStatus> {
  const out = allPending();
  STAGE_ORDER.forEach((s) => {
    if (b.artifacts[s]) out[s] = "complete";
  });
  return out;
}

function allPending(): Record<StageId, StageStatus> {
  return STAGE_ORDER.reduce(
    (acc, s) => {
      acc[s] = "pending";
      return acc;
    },
    {} as Record<StageId, StageStatus>,
  );
}

function buildHandoffLabels(): string[] {
  return [
    "discovery → prioritization · pain + archetype",
    "prioritization → design · GO + driver tree",
    "design → delivery · field map + envelope + sketch",
    "delivery → launch · tickets + readiness",
    "launch → support · pilots + metrics",
    "support → marketing · loopback + claims-ready proof points",
    "marketing → sales · positioning + audience messages",
    "sales → e2e-test-plan · claims to validate",
  ];
}
