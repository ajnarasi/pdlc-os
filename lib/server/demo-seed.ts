import type {
  ChristensenJtbd,
  DeliveryArtifact,
  DesignArtifact,
  DiscoveryArtifact,
  LaunchArtifact,
  MerchantBrain,
  PrioritizationArtifact,
  StageId,
  SupportArtifact,
} from "./schemas";
import { defaultPassEval, buildEvalLog } from "./karpathy";
import { sign } from "./sign";
import { bindingFor } from "./skill-registry";

interface DemoSeedArgs {
  merchantId: string;
  merchantName: string;
  inputPainPoint: string;
}

interface StageSeed<T> {
  artifact: T;
  agent: string;
  artifactName: string;
  citations: { label: string; path: string }[];
  evalRationale: string;
}

export function buildDemoPixBrain(args: DemoSeedArgs): MerchantBrain {
  const createdAt = new Date().toISOString();
  const runId = `demo-pix-${args.merchantId}`;

  const stages: Record<StageId, StageSeed<unknown>> = {
    discovery: discoverySeed(),
    prioritization: prioritizationSeed(),
    design: designSeed(),
    delivery: deliverySeed(),
    launch: launchSeed(),
    support: supportSeed(),
  };

  const order: StageId[] = [
    "discovery",
    "prioritization",
    "design",
    "delivery",
    "launch",
    "support",
  ];

  const audit: MerchantBrain["audit"] = [];
  const evals: MerchantBrain["evals"] = {};
  const artifacts: MerchantBrain["artifacts"] = {};

  let parentHashes: string[] = [];
  for (const stage of order) {
    const seed = stages[stage];
    const evalLog = defaultPassEval(stage, seed.evalRationale);
    const entry = sign({
      stage,
      agent: seed.agent,
      artifactName: seed.artifactName,
      artifact: seed.artifact,
      evalScore: evalLog.finalScore,
      evalVerdict: evalLog.finalVerdict,
      citations: seed.citations,
      parentHashes,
    });
    audit.push(entry);
    evals[stage] = evalLog;
    (artifacts as Record<string, unknown>)[stage] = seed.artifact;
    parentHashes = [entry.hash];
  }

  return {
    runId,
    merchantId: args.merchantId,
    merchantName: args.merchantName,
    inputPainPoint: args.inputPainPoint,
    createdAt,
    artifacts,
    audit,
    evals,
  };
}

function discoverySeed(): StageSeed<DiscoveryArtifact> {
  const jtbd: ChristensenJtbd = {
    id: "JTBD-A1-3.1-06",
    title: "Add a regional APM (Pix) to BR DTC traffic without conversion regression",
    when: "the brand sees a sustained checkout-abandonment delta on BR traffic vs. its 30-day baseline and finance has approved adding a new APM,",
    iWantTo:
      "stand up Pix as a new payment method on the live drop-in checkout in a controlled rollout, mapped to our existing chart of accounts and reconciled to our settlement file with measurable approval-rate parity (or lift) on BR traffic vs. the prior 30 days,",
    soICan:
      "capture the BR conversion lift the local rail unlocks without taking a one-time approval-rate hit elsewhere or breaking finance's monthly close.",
    metadata: {
      trigger:
        "Sustained checkout-abandonment delta ≥ 5 pp on BR-IP traffic for 14 consecutive days vs. 30-day baseline (state transition: `region.br.regression_status = 'sustained'`).",
      frequency: "1× per regional APM addition (typical interval: 6–18 months per region).",
      actor: "Director of Payments + Backend dev lead + Finance Controller (sign-off).",
      workaround:
        "Daily approval-rate dashboard comparison across regions; manual rollback if BR delta < −1.5 pp; finance reconciles new APM on a separate spreadsheet for the first 60 days.",
      successMetric:
        "BR approval rate within ±0.5 pp of 30-day baseline by end of week 1 post-launch; +20 pp BR conversion lift sustained at day 90; settlement reconciles to GL within 0.05% variance.",
      failureMode:
        "Silent approval-rate drop on a non-BR BIN range that masks BR lift → revenue loss = (delta-pp × monthly volume × AOV) for the duration before detection (typical: $30K–$200K for a fashion D2C in the $50M GPV band before a 7-day-late detection).",
      failureFrequency:
        "~30% of regional APM rollouts produce a >1 pp regression in week 1 that goes undiagnosed for 5–10 days.",
      agentTarget:
        "IntegrationAgent (primary) + AnomalyAgent (post-launch watch) + ReconciliationAgent (GL feed).",
      autonomyEnvelope:
        "draft-and-approve (IntegrationAgent); act-with-audit (AnomalyAgent); draft-and-approve (ReconciliationAgent).",
      source:
        "inferred-with-flag (industry data: McKinsey 2024 cost-of-acceptance survey + LATAM regional narrative + Slice A killer demo).",
      priority:
        "P0 — V1-gating: Slice A pilot success metric (30/50/40/NPS≥50) requires regional-APM addition path.",
    },
  };

  const artifact: DiscoveryArtifact = {
    archetypeId: "A1",
    archetypeName: "Mid-Market Fashion D2C + Omnichannel",
    archetypeBrandClass:
      "Indigo Road / Marine Layer / Outdoor Voices / Reformation / Buck Mason / Allbirds-class brand. ~$50M GPV, 60–75% D2C, 5–25 retail stores, 1 Director of Payments + 1 PM.",
    jtbd,
    painsRanked: [
      {
        rank: 1,
        pain: "31% checkout abandonment on BR-IP traffic vs. 12% global baseline — buyers reach 'pay' and bounce when no local instant rail appears.",
        severity: "high",
      },
      {
        rank: 2,
        pain: "18% BR card decline rate (installments-only) on AOV > R$300 — high-AOV cohorts abandon at the highest revenue points.",
        severity: "high",
      },
      {
        rank: 3,
        pain: "Finance reconciles BR settlement on a separate spreadsheet — mapping drift goes undetected ~1× per quarter.",
        severity: "medium",
      },
    ],
    segmentEvidence: [
      "Slice A (mid-market fashion D2C) = highest-leverage archetype: lean team, multi-channel complexity, BFCM seasonality (mvp-scope.md§slice-a).",
      "BR is 24% of the brand's 2025 D2C volume; growing 18% YoY but capped by the local-rail gap.",
      "QBR Q1 2026: 'regional APM addition' is the #1 inbound from A1-class brands with international DTC exposure.",
    ],
  };

  return {
    artifact,
    agent: bindingFor("discovery").agentLabel,
    artifactName: "discovery.json",
    citations: [
      {
        label: "Archetype A1 — Mid-Market Fashion D2C + Omnichannel",
        path: "Documents/Work/Projects/APM/Fiserv Brain/merchant-research/archetypes/archetype-A1-midmarket-fashion-direct-d2c-omnichannel.md",
      },
      {
        label: "Slice A MVP scope (production-pilot rubric)",
        path: "Documents/Work/Projects/APM/Fiserv Brain/04-prd/mvp-scope.md",
      },
      {
        label: "LATAM regional APM narrative",
        path: "Documents/Work/Projects/APM/wiki/region/latam.md",
      },
    ],
    evalRationale:
      "Discovery cited 3 brain artifacts (archetype A1, MVP scope, LATAM narrative); JTBD follows canonical Christensen format with full metadata block.",
  };
}

function prioritizationSeed(): StageSeed<PrioritizationArtifact> {
  const artifact: PrioritizationArtifact = {
    rice: {
      reach: 8,
      impact: 3,
      confidence: 0.85,
      effort: 2,
      score: 10.2,
    },
    driverTree: [
      {
        driver: "BR checkout conversion",
        lift: "+18-24%",
        assumption:
          "Pix recovers ~70% of abandoning bank-only buyers (LATAM 2024 baselines).",
      },
      {
        driver: "Card decline avoidance",
        lift: "+8-12%",
        assumption:
          "Pix replaces 1/3 of currently declined BR card auths above R$300.",
      },
      {
        driver: "Reconciliation labor",
        lift: "-40 hrs/mo",
        assumption:
          "Pix instant settlement removes manual Boleto matching for new traffic.",
      },
    ],
    recommendation: "GO",
    rationale:
      "RICE 10.2, BR GMV exposure $10.1M ARR, 6-week effort against Q3 launch window. Production-pilot rubric (30% approval lift / 50% dispute time / NPS≥50) is reachable within 90 days post-pilot.",
  };
  return {
    artifact,
    agent: bindingFor("prioritization").agentLabel,
    artifactName: "priority.json",
    citations: [
      {
        label: "APM coverage matrix (PIX row, LATAM, qr-code, 5/5 callbacks)",
        path: "Documents/Work/Projects/APM/output/APM-Checkout-SDK-Tracker.csv",
      },
      {
        label: "MVP scope + production-pilot rubric (30/50/40/NPS≥50)",
        path: "Documents/Work/Projects/APM/Fiserv Brain/04-prd/mvp-scope.md",
      },
      {
        label: "Country matrix (BR coverage)",
        path: "Documents/Work/Projects/APM/CommerceHub_Global_APM_Country_Matrix.xlsx",
      },
    ],
    evalRationale:
      "RICE inputs scoped to A1 archetype + APM catalog; metrics ladder to production-pilot rubric.",
  };
}

function designSeed(): StageSeed<DesignArtifact> {
  const artifact: DesignArtifact = {
    apmCode: "PIX",
    pattern: "qr-code (instant bank-rail)",
    endpoints: [
      { method: "POST", path: "/checkouts/v1/orders" },
      { method: "POST", path: "/payments/v1/pix-charges" },
      { method: "GET", path: "/payments/v1/pix-charges/{txid}/qr" },
    ],
    fieldMappings: [
      {
        chField: "amount.total",
        chType: "number (decimal)",
        apmField: "valor.original",
        apmType: "string (decimal-2)",
        transform: "TO_STRING_DEC2",
        tier: "1",
        notes: "BACEN PIX requires '0.00' string format; reject 0",
      },
      {
        chField: "amount.currency",
        chType: "string",
        apmField: "n/a",
        apmType: "n/a",
        transform: "ENFORCE_BRL",
        tier: "1",
        notes: "Pix is BRL-only; reject non-BRL at adapter boundary",
      },
      {
        chField: "transactionDetails.merchantTransactionId",
        chType: "string",
        apmField: "txid",
        apmType: "string [26..35] alphanumeric",
        transform: "ALPHANUMERIC_PAD",
        tier: "1",
        notes: "BACEN regex ^[a-zA-Z0-9]{26,35}$",
      },
      {
        chField: "merchantDetails.pixKey",
        chType: "string",
        apmField: "chave",
        apmType: "string (DICT alias)",
        transform: "PASSTHROUGH",
        tier: "1",
        notes: "DICT key (CPF/CNPJ/email/phone/EVP); resolved via PSP",
      },
      {
        chField: "expirationSeconds",
        chType: "integer",
        apmField: "calendario.expiracao",
        apmType: "integer (seconds)",
        transform: "PASSTHROUGH",
        tier: "1",
        notes: "Default 3600s; max 86400s per BACEN",
      },
      {
        chField: "transactionDetails.merchantOrderId",
        chType: "string",
        apmField: "infoAdicionais[0].valor",
        apmType: "string [≤200]",
        transform: "TRUNCATE_200",
        tier: "2",
        notes: "Extra info, key='merchantOrderId'",
      },
      {
        chField: "customer.email",
        chType: "string",
        apmField: "n/a",
        apmType: "n/a",
        transform: "DROP",
        tier: "n/a",
        notes:
          "Pix is buyer-anonymous at charge creation; PII flows back via response only",
      },
    ],
    isoEnvelope: [
      {
        messageType: "pacs.008.001.10",
        sample:
          "<FIToFICstmrCdtTrf>\n  <GrpHdr><MsgId>PIX-{run}-{txid}</MsgId>...</GrpHdr>\n  <CdtTrfTxInf>\n    <PmtId><EndToEndId>E18236120{txid}</EndToEndId></PmtId>\n    <IntrBkSttlmAmt Ccy='BRL'>{valor.original}</IntrBkSttlmAmt>\n    <Cdtr><Nm>{merchant.legalName}</Nm></Cdtr>\n  </CdtTrfTxInf>\n</FIToFICstmrCdtTrf>",
      },
    ],
    unmappableFields: [
      {
        field: "billingAddress.*",
        reason:
          "Pix charge creation does not accept billing address; payer revealed only after settlement.",
        mitigation:
          "Capture billing post-confirmation via Commerce Hub address service if AVS required for downstream rails.",
      },
      {
        field: "amountComponents.taxAmounts[]",
        reason: "BACEN PIX-DICT does not carry tax breakdown.",
        mitigation:
          "Persist taxes on CH order; re-attach for fiscal export only, not Pix payload.",
      },
      {
        field: "orderData.itemDetails[]",
        reason: "Line-item array unsupported on instant Pix.",
        mitigation:
          "Pack as 'infoAdicionais' max 50 entries, ≤200 chars each; truncate with safety-check report.",
      },
    ],
  };
  return {
    artifact,
    agent: bindingFor("design").agentLabel,
    artifactName: "design.json",
    citations: [
      {
        label: "Klarna ↔ Commerce Hub field mapping (template)",
        path: "Documents/Work/Projects/APM/output/klarna/mapping-ch-to-klarna.md",
      },
      {
        label: "Wallet pattern (qr-code variant)",
        path: "Documents/Work/Projects/APM/wiki/concept/wallet-pattern.md",
      },
      {
        label: "Commerce Hub APM normalized mapping",
        path: "Documents/Work/Projects/APM/CommerceHub_APM_Normalized_Mapping.xlsx",
      },
    ],
    evalRationale:
      "ISO 20022 envelope conforms to BACEN PIX-DICT spec; 7 fields mapped, 3 unmappables documented with mitigations.",
  };
}

function deliverySeed(): StageSeed<DeliveryArtifact> {
  const artifact: DeliveryArtifact = {
    tickets: [
      {
        key: "PDLC-101",
        title: "Wire merchant Pix DICT key into Commerce Hub merchant config",
        type: "story",
        estimate: "3d",
        acceptance: [
          "Merchant config accepts CPF/CNPJ/email/phone/EVP DICT alias",
          "Validation rejects malformed alias with 422",
          "Sandbox round-trip resolves alias via PSP",
        ],
      },
      {
        key: "PDLC-102",
        title: "Adapter: Commerce Hub → Pix charge create (POST /pix-charges)",
        type: "story",
        estimate: "5d",
        acceptance: [
          "TO_STRING_DEC2 transform on amount.total",
          "ALPHANUMERIC_PAD on merchantTransactionId (26-35)",
          "BRL-only enforcement at adapter boundary",
          "Map 7 Tier-1 fields; emit safety-check report for 3 unmappables",
        ],
      },
      {
        key: "PDLC-103",
        title: "QR retrieval + 5-event callback contract",
        type: "story",
        estimate: "3d",
        acceptance: [
          "GET /pix-charges/{txid}/qr returns base64 PNG + EMV payload",
          "Emit PAYMENT_METHOD_READY → QR_DISPLAYED → PAYMENT_AUTHORIZED | EXPIRED | CANCELLED",
          "Match existing 55-APM callback sweep parity (5/5)",
        ],
      },
      {
        key: "PDLC-104",
        title: "Reconciliation: pacs.002 webhook → Commerce Hub settlement",
        type: "task",
        estimate: "2d",
        acceptance: [
          "Idempotent on (txid, endToEndId)",
          "Persist BACEN settlement timestamp",
          "Emit Carat ledger entry",
        ],
      },
    ],
    testStubs: [
      {
        suite: "pix-adapter.spec.ts",
        cases: [
          "maps amount.total to valor.original as decimal-2 string",
          "rejects non-BRL currency at adapter boundary",
          "pads merchantTransactionId to 26-35 alphanumeric",
          "emits 5/5 callback events on happy path",
          "drops billingAddress with documented mitigation",
        ],
      },
      {
        suite: "pix-iso-envelope.spec.ts",
        cases: [
          "produces valid pacs.008.001.10 envelope",
          "validates EndToEndId regex per BACEN",
          "rejects expirationSeconds > 86400",
        ],
      },
      {
        suite: "pix-callback-sweep.spec.ts",
        cases: [
          "QR_DISPLAYED fires before AUTHORIZED",
          "EXPIRED fires after expirationSeconds elapse",
          "CANCELLED is terminal and idempotent",
          "duplicate webhooks deduplicate on endToEndId",
        ],
      },
    ],
    readinessChecklist: [
      { item: "Sandbox DICT alias resolves end-to-end", status: "ready", owner: "platform-eng" },
      {
        item: "Production-pilot rubric metrics instrumented (30/50/40)",
        status: "wip",
        owner: "data-eng",
      },
      {
        item: "BACEN compliance review attached to PR",
        status: "wip",
        owner: "compliance",
      },
      { item: "A1 anchor merchant UAT signoff", status: "blocked", owner: "merchant-success" },
      {
        item: "Carat ledger reconciliation parity",
        status: "ready",
        owner: "Nashville back-end",
      },
    ],
  };
  return {
    artifact,
    agent: bindingFor("delivery").agentLabel,
    artifactName: "delivery.json",
    citations: [
      {
        label: "APM Checkout SDK browser package (TS adapters)",
        path: "Documents/Work/Projects/APM/checkout-sdk-v2/packages/checkout-sdk-browser/",
      },
      {
        label: "Klarna safety-check report (template)",
        path: "Documents/Work/Projects/APM/output/klarna/safety-check-report.md",
      },
      {
        label: "239/239 E2E callback sweep results",
        path: "Documents/Work/Projects/APM/output/full-e2e-results.json",
      },
    ],
    evalRationale:
      "12/13 acceptance bullets directly map to a Vitest case; readiness checklist tied to compliance + Nashville back-end.",
  };
}

function launchSeed(): StageSeed<LaunchArtifact> {
  const artifact: LaunchArtifact = {
    pilotMerchants: [
      {
        name: "A1 anchor — mid-market fashion D2C + omnichannel",
        archetype: "A1",
        rationale:
          "Slice A canonical brand (~$50M GPV, ~24% BR exposure, 60–75% D2C). Lean team + BFCM seasonality = highest leverage for the Brain.",
      },
      {
        name: "A2-adjacent — mid-market subscription DTC, BR-curious",
        archetype: "A2",
        rationale:
          "Validates recurring-billing reconciliation against the same Pix settlement file pattern.",
      },
      {
        name: "M2 — mid-market marketplace-enabled retailer",
        archetype: "M2",
        rationale:
          "Validates marketplace-submerchant onboarding lane for the same APM addition flow.",
      },
    ],
    successMetrics: [
      {
        metric: "BR approval rate",
        target: "+30% lift over current PPRO redirect baseline (90 days)",
        rationale: "Production-pilot rubric, A1 anchor merchant.",
      },
      {
        metric: "Time-to-settlement (mean)",
        target: "≤8 seconds (Pix BACEN SLA)",
        rationale: "Direct rail vs T+2 card settlement.",
      },
      {
        metric: "Merchant NPS",
        target: "≥50 at day 90",
        rationale: "Production-pilot rubric NPS≥50 threshold.",
      },
      {
        metric: "Ops dispute time",
        target: "-50% Boleto reconciliation hours",
        rationale: "Replaces manual Boleto matching with instant Pix settlement.",
      },
    ],
    competitive: [
      {
        competitor: "Stripe",
        positioning: "Pix shipped 2024, embedded in Stripe Payments dashboard.",
        gap: "No multi-back-end (Nashville/Omaha/Buypass) reconciliation parity.",
      },
      {
        competitor: "Adyen",
        positioning: "Pix via local acquirer, MarketPay reconciliation.",
        gap: "No SMB onboarding play; pricing tier excludes mid-market BR DTC.",
      },
      {
        competitor: "dLocal",
        positioning: "BR-native, broad LATAM coverage, weak NA/EU footprint.",
        gap: "Cannot serve global merchants with mixed BR + EU traffic on one ledger.",
      },
    ],
    gtmBrief:
      "Lead with A1 anchor pilot. Q3 2026 launch window. Position regional-APM addition with full GL reconciliation as the differentiator vs. APM-vendor-only offerings. Prepare scheme-compliance brief for BACEN review. Co-marketing with the ISV partner network covering this archetype.",
  };
  return {
    artifact,
    agent: bindingFor("launch").agentLabel,
    artifactName: "launch.json",
    citations: [
      {
        label: "StripeConf 2026 competitive synthesis (Karpathy-verified 7/7 PASS)",
        path: "Documents/Work/Projects/APM/StripeConf-2026/output/stripe-sessions-2026-rundown.md",
      },
      {
        label: "LATAM regional APM narrative",
        path: "Documents/Work/Projects/APM/wiki/region/latam.md",
      },
      {
        label: "Production-pilot rubric (30/50/40/NPS≥50)",
        path: "Documents/Work/Projects/APM/Fiserv Brain/04-prd/mvp-scope.md",
      },
    ],
    evalRationale:
      "Pilot list spans 3 archetypes; metrics directly bound to the production-pilot rubric; Stripe / Adyen / dLocal landscape with named gaps.",
  };
}

function supportSeed(): StageSeed<SupportArtifact> {
  const artifact: SupportArtifact = {
    triageRules: [
      {
        signal: "QR display latency p95 > 2s (5 min window)",
        route: "platform-eng → BACEN PSP healthcheck → page on-call",
        sla: "Page in 5m; mitigate in 30m",
      },
      {
        signal: "Pix settlement webhook missing > 90s after authorization",
        route: "Nashville back-end ledger reconciliation → Carat alert",
        sla: "Reconcile in 2h; merchant-facing comms in 1h",
      },
      {
        signal: "A1 anchor merchant NPS drop > 5 points week-over-week",
        route: "merchant-success → product weekly review",
        sla: "Triage in 24h; post-mortem in 7d",
      },
    ],
    riskMonitors: [
      {
        risk: "BACEN regulation change (PIX-DICT key rotation cadence)",
        threshold: "Any BACEN circular update touching DICT or pacs.008",
        alert: "compliance + product weekly digest",
      },
      {
        risk: "Approval rate lift falls below +20% by day 60",
        threshold: "Trailing 14-day approval rate < +20%",
        alert: "production-pilot review meeting trigger",
      },
      {
        risk: "Carat ledger reconciliation drift",
        threshold: "Mismatch > 0.05% on any pilot merchant",
        alert: "ledger team + finance ops",
      },
    ],
    loopback: {
      nextDiscoverySeed:
        "Pilot data after Q3 2026 launch — feed BR approval-rate-by-archetype back into Discovery as evidence for the next LATAM PRD (Boleto-Pix unified merchant onboarding).",
      rationale:
        "Closes the loop: support insights become next quarter's Discovery seed. The brain compounds.",
    },
  };
  return {
    artifact,
    agent: bindingFor("support").agentLabel,
    artifactName: "support.json",
    citations: [
      {
        label: "Aha ↔ Jira sync kit (insight-to-backlog routing)",
        path: "Documents/Work/Projects/APM/wiki/concept/aha-jira-sync-kit.md",
      },
      {
        label: "Multi-perspective sub-agents (7 reviewers)",
        path: "Documents/Work/PM-OS/sub-agents/",
      },
      {
        label: "PM-OS feature-results skill",
        path: "Documents/Work/PM-OS/.claude/skills/feature-results/SKILL.md",
      },
    ],
    evalRationale:
      "Risk thresholds bound to production-pilot rubric; loopback writes nextDiscoverySeed back into the merchant brain.",
  };
}

// Re-export buildEvalLog so a future executor can build custom (non-default) evals.
export { buildEvalLog };
