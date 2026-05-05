"use client";

import { Chip } from "@/components/ui/Chip";
import type {
  DeliveryArtifact,
  DesignArtifact,
  DiscoveryArtifact,
  E2eTestPlanArtifact,
  LaunchArtifact,
  MarketingArtifact,
  PrioritizationArtifact,
  SalesEnablementArtifact,
  StageId,
  SupportArtifact,
} from "@/lib/types";

interface StageArtifactBodyProps {
  stage: StageId;
  artifact: unknown;
}

export function StageArtifactBody({ stage, artifact }: StageArtifactBodyProps) {
  if (!artifact) {
    return (
      <div className="rounded-md border border-dashed border-rule bg-paper/30 p-4 text-xs text-inkFaint">
        Awaiting handoff from prior stage…
      </div>
    );
  }
  switch (stage) {
    case "discovery":
      return <DiscoveryView a={artifact as DiscoveryArtifact} />;
    case "prioritization":
      return <PrioritizationView a={artifact as PrioritizationArtifact} />;
    case "design":
      return <DesignView a={artifact as DesignArtifact} />;
    case "delivery":
      return <DeliveryView a={artifact as DeliveryArtifact} />;
    case "launch":
      return <LaunchView a={artifact as LaunchArtifact} />;
    case "support":
      return <SupportView a={artifact as SupportArtifact} />;
    case "marketing":
      return <MarketingView a={artifact as MarketingArtifact} />;
    case "sales-enablement":
      return <SalesEnablementView a={artifact as SalesEnablementArtifact} />;
    case "e2e-test-plan":
      return <E2eTestPlanView a={artifact as E2eTestPlanArtifact} />;
    default:
      return null;
  }
}

function DiscoveryView({ a }: { a: DiscoveryArtifact }) {
  const m = a.jtbd.metadata;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="accent">Archetype {a.archetypeId} · {a.archetypeName}</Chip>
        <span className="text-[0.66rem] text-inkFaint">{a.archetypeBrandClass}</span>
      </div>

      <div className="rounded-md border border-rule bg-paper/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-[0.66rem] text-inkFaint">{a.jtbd.id}</div>
          <Chip tone="muted">{m.priority.split(" — ")[0]}</Chip>
        </div>
        <h4 className="mt-1 font-display text-base text-ink">{a.jtbd.title}</h4>
        <div className="mt-2 space-y-1 text-sm leading-snug">
          <p>
            <span className="font-medium text-accent">When</span>{" "}
            <span className="text-ink">{a.jtbd.when}</span>
          </p>
          <p>
            <span className="font-medium text-accent">I want to</span>{" "}
            <span className="text-ink">{a.jtbd.iWantTo}</span>
          </p>
          <p>
            <span className="font-medium text-accent">so I can</span>{" "}
            <span className="text-ink">{a.jtbd.soICan}</span>
          </p>
        </div>
      </div>

      <details className="rounded-md border border-rule bg-paper/40">
        <summary className="eyebrow cursor-pointer list-none px-3 py-2 text-inkMuted hover:text-ink">
          JTBD metadata · trigger / actor / metrics / agent · click to expand
        </summary>
        <div className="grid grid-cols-1 gap-1.5 px-3 pb-3 text-xs sm:grid-cols-2">
          <Meta label="Trigger" value={m.trigger} />
          <Meta label="Frequency" value={m.frequency} />
          <Meta label="Actor" value={m.actor} />
          <Meta label="Workaround today" value={m.workaround} />
          <Meta label="Success metric" value={m.successMetric} />
          <Meta label="Failure mode" value={m.failureMode} />
          <Meta label="Failure freq today" value={m.failureFrequency} />
          <Meta label="Agent target" value={m.agentTarget} />
          <Meta label="Autonomy envelope" value={m.autonomyEnvelope} />
          <Meta label="Source" value={m.source} />
          <Meta label="Priority" value={m.priority} />
        </div>
      </details>

      <div>
        <div className="eyebrow text-inkFaint">Pains, ranked</div>
        <ul className="mt-1 space-y-1">
          {a.painsRanked.map((p) => (
            <li
              key={p.rank}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-2 text-xs"
            >
              <span className="font-mono text-inkFaint">#{p.rank}</span>
              <span className="text-ink">{p.pain}</span>
              <Chip
                tone={
                  p.severity === "high"
                    ? "alert"
                    : p.severity === "medium"
                      ? "muted"
                      : "neutral"
                }
              >
                {p.severity}
              </Chip>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Segment evidence</div>
        <ul className="mt-1 space-y-0.5 text-xs text-inkMuted">
          {a.segmentEvidence.map((e, i) => (
            <li key={i}>· {e}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-rule/60 bg-paper/40 p-2">
      <div className="eyebrow text-[0.66rem] text-inkFaint">{label}</div>
      <div className="text-ink">{value}</div>
    </div>
  );
}

function PrioritizationView({ a }: { a: PrioritizationArtifact }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {(["reach", "impact", "confidence", "effort"] as const).map((k) => (
          <div key={k} className="rounded-md border border-rule bg-paperAlt/40 p-2">
            <div className="eyebrow text-[0.62rem] text-inkFaint">{k}</div>
            <div className="font-mono text-base text-ink">
              {String(a.rice[k])}
            </div>
          </div>
        ))}
        <div className="rounded-md border border-accent/40 bg-accentSoft p-2">
          <div className="eyebrow text-[0.62rem] text-accent">RICE</div>
          <div className="font-mono text-base text-accent">
            {a.rice.score.toFixed(1)}
          </div>
        </div>
      </div>
      <div>
        <div className="eyebrow text-inkFaint">Driver tree</div>
        <ul className="mt-1 space-y-1.5 text-xs">
          {a.driverTree.map((d, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto] items-start gap-2 rounded-md border border-rule bg-paper/40 p-2"
            >
              <div>
                <div className="font-medium text-ink">{d.driver}</div>
                <div className="text-inkMuted">{d.assumption}</div>
              </div>
              <Chip tone="growth">{d.lift}</Chip>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border border-growth/30 bg-growthSoft/60 p-2 text-xs">
        <Chip tone="growth">{a.recommendation}</Chip>{" "}
        <span className="text-ink">{a.rationale}</span>
      </div>
    </div>
  );
}

function DesignView({ a }: { a: DesignArtifact }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Chip tone="accent">{a.apmCode}</Chip>
        <Chip tone="muted">{a.pattern}</Chip>
        {a.endpoints.map((e) => (
          <Chip tone="muted" key={`${e.method}-${e.path}`}>
            <span className="font-mono">
              {e.method} {e.path}
            </span>
          </Chip>
        ))}
      </div>
      <div>
        <div className="eyebrow mb-1 text-inkFaint">
          Field map · Commerce Hub → {a.apmCode}
        </div>
        <div className="overflow-x-auto rounded-md border border-rule">
          <table className="min-w-full font-mono text-[0.7rem]">
            <thead className="bg-paperAlt/60 text-inkMuted">
              <tr>
                <th className="px-2 py-1 text-left">CH field</th>
                <th className="px-2 py-1 text-left">{a.apmCode} field</th>
                <th className="px-2 py-1 text-left">Transform</th>
                <th className="px-2 py-1 text-left">Tier</th>
              </tr>
            </thead>
            <tbody>
              {a.fieldMappings.map((f) => (
                <tr key={f.chField} className="border-t border-rule">
                  <td className="px-2 py-1 text-ink">{f.chField}</td>
                  <td className="px-2 py-1 text-ink">{f.apmField}</td>
                  <td className="px-2 py-1 text-accent">{f.transform}</td>
                  <td className="px-2 py-1 text-inkMuted">{f.tier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div className="eyebrow text-inkFaint">ISO 20022 envelope</div>
        {a.isoEnvelope.map((env, i) => (
          <pre
            key={i}
            className="mt-1 overflow-x-auto rounded-md border border-rule bg-paper/60 p-2 font-mono text-[0.66rem] leading-relaxed text-ink"
          >
            <span className="text-accent">{env.messageType}</span>
            {"\n"}
            {env.sample}
          </pre>
        ))}
      </div>
      <div>
        <div className="eyebrow text-inkFaint">Unmappable fields (mitigated)</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.unmappableFields.map((u, i) => (
            <li
              key={i}
              className="rounded-md border border-alert/30 bg-alertSoft/40 p-2"
            >
              <span className="font-mono text-alert">{u.field}</span>{" "}
              <span className="text-ink">— {u.reason}</span>
              <div className="mt-0.5 text-inkMuted">→ {u.mitigation}</div>
            </li>
          ))}
        </ul>
      </div>
      {a.napkinSketch ? (
        <div>
          <div className="eyebrow text-inkFaint">Napkin sketch · checkout surface</div>
          <pre className="mt-1 overflow-x-auto rounded-md border border-rule bg-paper/60 p-3 font-mono text-[0.66rem] leading-snug text-ink">
            {a.napkinSketch}
          </pre>
        </div>
      ) : null}
      {a.prototypePrompt ? (
        <div>
          <div className="eyebrow text-inkFaint">
            v0 / Lovable / Bolt prompt · paste-ready
          </div>
          <pre className="mt-1 overflow-x-auto rounded-md border border-accent/30 bg-accentSoft/30 p-3 font-mono text-[0.7rem] leading-relaxed text-ink whitespace-pre-wrap">
            {a.prototypePrompt}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function DeliveryView({ a }: { a: DeliveryArtifact }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="eyebrow text-inkFaint">Tickets ({a.tickets.length})</div>
        <ul className="mt-1 space-y-1.5 text-xs">
          {a.tickets.map((t) => (
            <li
              key={t.key}
              className="rounded-md border border-rule bg-paper/40 p-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-accent">{t.key}</span>{" "}
                  <span className="text-ink">{t.title}</span>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <Chip tone="muted">{t.type}</Chip>
                  <Chip tone="muted">{t.estimate}</Chip>
                </div>
              </div>
              <ul className="mt-1.5 space-y-0.5 text-[0.7rem] text-inkMuted">
                {t.acceptance.map((c, i) => (
                  <li key={i}>· {c}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="eyebrow text-inkFaint">
          Vitest stubs ({a.testStubs.reduce((acc, s) => acc + s.cases.length, 0)} cases)
        </div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.testStubs.map((s) => (
            <li key={s.suite} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="font-mono text-accent">{s.suite}</div>
              <ul className="mt-0.5 ml-3 list-disc text-inkMuted">
                {s.cases.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="eyebrow text-inkFaint">Readiness checklist</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.readinessChecklist.map((r, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border border-rule bg-paper/40 p-2"
            >
              <span className="text-ink">{r.item}</span>
              <Chip
                tone={
                  r.status === "ready"
                    ? "growth"
                    : r.status === "wip"
                      ? "muted"
                      : "alert"
                }
              >
                {r.status}
              </Chip>
              <span className="font-mono text-[0.66rem] text-inkFaint">
                {r.owner}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LaunchView({ a }: { a: LaunchArtifact }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="eyebrow text-inkFaint">Pilot merchants</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.pilotMerchants.map((m) => (
            <li key={m.name} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="font-medium text-ink">{m.name}</div>
              <div className="text-inkMuted">
                {m.archetype} — {m.rationale}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="eyebrow text-inkFaint">Success metrics</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.successMetrics.map((m, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto] items-start gap-2 rounded-md border border-rule bg-paper/40 p-2"
            >
              <div>
                <div className="text-ink">{m.metric}</div>
                <div className="text-inkMuted">{m.rationale}</div>
              </div>
              <Chip tone="growth">{m.target}</Chip>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="eyebrow text-inkFaint">Competitive landscape</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.competitive.map((c) => (
            <li
              key={c.competitor}
              className="rounded-md border border-rule bg-paper/40 p-2"
            >
              <div className="font-medium text-ink">{c.competitor}</div>
              <div className="text-inkMuted">{c.positioning}</div>
              <div className="mt-0.5 text-accent">gap → {c.gap}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border border-accent/30 bg-accentSoft/40 p-2 text-xs text-ink">
        <span className="eyebrow text-accent">GTM brief</span>
        <p className="mt-1">{a.gtmBrief}</p>
      </div>
    </div>
  );
}

function SupportView({ a }: { a: SupportArtifact }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="eyebrow text-inkFaint">Triage rules</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.triageRules.map((r, i) => (
            <li key={i} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="font-mono text-[0.7rem] text-alert">
                signal · {r.signal}
              </div>
              <div className="mt-0.5 text-ink">→ {r.route}</div>
              <div className="mt-0.5 text-inkMuted">SLA: {r.sla}</div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="eyebrow text-inkFaint">Risk monitors</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.riskMonitors.map((r, i) => (
            <li key={i} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="text-ink">{r.risk}</div>
              <div className="text-inkMuted">threshold: {r.threshold}</div>
              <div className="text-accent">alert → {r.alert}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-md border border-growth/40 bg-growthSoft/60 p-3 text-xs">
        <div className="eyebrow text-growth">Loop closes ↻</div>
        <p className="mt-1 text-ink">{a.loopback.nextDiscoverySeed}</p>
        <p className="mt-1 text-inkMuted">{a.loopback.rationale}</p>
      </div>
    </div>
  );
}

function MarketingView({ a }: { a: MarketingArtifact }) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-accent/30 bg-accentSoft/40 p-3">
        <div className="eyebrow text-accent">Positioning · Post-it</div>
        <p className="mt-1 font-display text-base leading-snug text-ink">
          {a.positioningStatement}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <div className="eyebrow text-inkFaint">Headline candidates</div>
          <ul className="mt-1 space-y-1 text-xs">
            {a.headlineOptions.map((h, i) => (
              <li
                key={i}
                className="rounded-md border border-rule bg-paper/40 p-2 font-display text-sm text-ink"
              >
                {h}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow text-inkFaint">Subhead candidates</div>
          <ul className="mt-1 space-y-1 text-xs">
            {a.subheadOptions.map((s, i) => (
              <li
                key={i}
                className="rounded-md border border-rule bg-paper/40 p-2 text-ink"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Audience messages</div>
        <ul className="mt-1 space-y-1.5 text-xs">
          {a.audienceMessages.map((m, i) => (
            <li
              key={i}
              className="rounded-md border border-rule bg-paper/40 p-2"
            >
              <Chip tone="accent">{m.audience}</Chip>
              <div className="mt-1 text-alert">pain · {m.painSentence}</div>
              <div className="mt-0.5 text-growth">relief · {m.reliefSentence}</div>
              <div className="mt-0.5 font-medium text-ink">cta · {m.cta}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <div className="eyebrow text-inkFaint">Proof points</div>
          <ul className="mt-1 space-y-0.5 text-xs text-inkMuted">
            {a.proofPoints.map((p, i) => (
              <li key={i}>· {p}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow text-inkFaint">Anti-messages (do NOT say)</div>
          <ul className="mt-1 space-y-0.5 text-xs text-alert">
            {a.antiMessages.map((p, i) => (
              <li key={i}>× {p}</li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Channel mix</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.channelMix.map((c, i) => (
            <li
              key={i}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-2 rounded-md border border-rule bg-paper/40 p-2"
            >
              <Chip tone="muted">{c.sequencingDay}</Chip>
              <div>
                <div className="font-medium text-ink">{c.channel}</div>
                <div className="text-inkMuted">{c.hook}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Launch sequence</div>
        <ol className="mt-1 space-y-1 text-xs">
          {a.launchSequence.map((s, i) => (
            <li
              key={i}
              className="grid grid-cols-[auto_1fr] items-baseline gap-2 rounded-md border border-rule bg-paper/40 p-2"
            >
              <span className="font-mono text-accent">{s.timing}</span>
              <span className="text-ink">{s.milestone}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SalesEnablementView({ a }: { a: SalesEnablementArtifact }) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-accent/30 bg-accentSoft/30 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="accent">
            ICP · {a.icp.archetypeId} · {a.icp.archetypeName}
          </Chip>
          <Chip tone="muted">{a.icp.sizeBand}</Chip>
          <Chip tone="muted">{a.icp.channel}</Chip>
          <Chip tone="muted">{a.icp.vertical}</Chip>
        </div>
        <div className="mt-2 grid gap-2 text-xs lg:grid-cols-2">
          <div>
            <div className="eyebrow text-growth">Qualifying signals</div>
            <ul className="mt-0.5 space-y-0.5 text-inkMuted">
              {a.icp.qualifyingSignals.map((s, i) => (
                <li key={i}>+ {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="eyebrow text-alert">Disqualifying signals</div>
            <ul className="mt-0.5 space-y-0.5 text-inkMuted">
              {a.icp.disqualifyingSignals.map((s, i) => (
                <li key={i}>− {s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Discovery questions</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.discoveryQuestions.map((q, i) => (
            <li key={i} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="font-medium text-ink">Q{i + 1}. {q.question}</div>
              <div className="mt-0.5 text-inkMuted">listen for · {q.listenFor}</div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Objection handling</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.objectionHandling.map((o, i) => (
            <li key={i} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="text-alert">"{o.objection}"</div>
              <div className="mt-0.5 text-ink">reframe · {o.reframe}</div>
              <div className="mt-0.5 text-accent">evidence · {o.evidence}</div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Demo script · 5 steps</div>
        <ol className="mt-1 space-y-1 text-xs">
          {a.demoScript.map((s, i) => (
            <li key={i} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="font-medium text-ink">{s.step}</div>
              <div className="mt-0.5 text-inkMuted">they see · {s.whatTheySee}</div>
              <div className="mt-0.5 text-accent">say · "{s.whatToSay}"</div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Competitive battlecard</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.competitiveBattlecard.map((c) => (
            <li
              key={c.competitor}
              className="rounded-md border border-rule bg-paper/40 p-2"
            >
              <div className="font-medium text-ink">{c.competitor}</div>
              <div className="mt-0.5 grid gap-1 sm:grid-cols-2">
                <div className="text-growth">we win · {c.whereWeWin}</div>
                <div className="text-alert">they win · {c.whereTheyWin}</div>
              </div>
              <div className="mt-0.5 text-accent">tie-breaker · {c.tieBreaker}</div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">ROI inputs · gather from buyer</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.roiInputs.map((r, i) => (
            <li
              key={i}
              className="grid grid-cols-[auto_1fr] items-start gap-2 rounded-md border border-rule bg-paper/40 p-2"
            >
              <Chip tone="muted">{r.variable}</Chip>
              <div>
                <div className="text-ink">{r.prompt}</div>
                <div className="text-inkMuted">
                  default · {r.defaultValue}{" "}
                  <span className="text-inkFaint">({r.sourceOfDefault})</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-growth/40 bg-growthSoft/60 p-3 text-xs">
        <div className="eyebrow text-growth">Close ask · the literal sentence</div>
        <p className="mt-1 font-medium text-ink">"{a.closeAsk}"</p>
      </div>
    </div>
  );
}

function E2eTestPlanView({ a }: { a: E2eTestPlanArtifact }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="eyebrow text-inkFaint">
          Critical journeys · {a.criticalJourneys.length}
        </div>
        <ul className="mt-1 space-y-1.5 text-xs">
          {a.criticalJourneys.map((j) => (
            <li key={j.id} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-accent">{j.id}</span>{" "}
                  <span className="font-medium text-ink">{j.title}</span>
                </div>
                <Chip tone="muted">{j.persona}</Chip>
              </div>
              <ol className="mt-1 ml-4 list-decimal text-inkMuted">
                {j.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <div className="mt-1 text-growth">
                ✓ {j.successCriterion}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Regression matrix</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.regressionMatrix.map((r, i) => (
            <li key={i} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="font-medium text-ink">{r.dimension}</div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {r.values.map((v, j) => (
                  <Chip key={j} tone="muted">
                    {v}
                  </Chip>
                ))}
              </div>
              <div className="mt-0.5 text-accent">invariant · {r.mustHold}</div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Edge cases</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.edgeCases.map((e, i) => (
            <li key={i} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="font-medium text-ink">{e.name}</div>
              <div className="text-inkMuted">trigger · {e.trigger}</div>
              <div className="text-inkMuted">expect · {e.expectedBehavior}</div>
              <div className="text-accent">detect · {e.detectionSignal}</div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Performance targets · SLOs</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.performanceTargets.map((p, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto_auto] items-start gap-2 rounded-md border border-rule bg-paper/40 p-2"
            >
              <div>
                <div className="text-ink">{p.metric}</div>
                <div className="text-inkFaint">source · {p.source}</div>
              </div>
              <Chip tone="growth">{p.target}</Chip>
              <Chip tone={p.blocking ? "alert" : "muted"}>
                {p.blocking ? "blocking" : "non-blocking"}
              </Chip>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Launch blockers</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.launchBlockers.map((b, i) => (
            <li key={i} className="rounded-md border border-alert/30 bg-alertSoft/40 p-2">
              <div className="text-ink">{b.blocker}</div>
              <div className="mt-0.5 text-inkMuted">
                owner · {b.owner} · verified by · {b.howVerified}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Rollback criteria</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.rollbackCriteria.map((r, i) => (
            <li key={i} className="rounded-md border border-rule bg-paper/40 p-2">
              <div className="font-mono text-alert">signal · {r.signal}</div>
              <div className="text-inkMuted">threshold · {r.threshold}</div>
              <div className="text-ink">action · {r.rollbackAction}</div>
              <Chip tone="muted">{r.autoOrManual}</Chip>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="eyebrow text-inkFaint">Claims validation · public statement → test</div>
        <ul className="mt-1 space-y-1 text-xs">
          {a.claimsValidation.map((c, i) => (
            <li key={i} className="rounded-md border border-accent/30 bg-accentSoft/30 p-2">
              <div className="text-ink">"{c.claim}"</div>
              <div className="mt-0.5 text-accent">proven by · {c.testThatProvesIt}</div>
              <div className="text-inkFaint">source · {c.source}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
