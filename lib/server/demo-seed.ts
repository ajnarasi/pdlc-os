import type {
  ChristensenJtbd,
  DeliveryArtifact,
  DesignArtifact,
  DiscoveryArtifact,
  E2eTestPlanArtifact,
  LaunchArtifact,
  MarketingArtifact,
  MerchantBrain,
  PrioritizationArtifact,
  SalesEnablementArtifact,
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
    marketing: marketingSeed(),
    "sales-enablement": salesEnablementSeed(),
    "e2e-test-plan": e2eTestPlanSeed(),
  };

  const order: StageId[] = [
    "discovery",
    "prioritization",
    "design",
    "delivery",
    "launch",
    "support",
    "marketing",
    "sales-enablement",
    "e2e-test-plan",
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
    napkinSketch: `+--------------------------------------------+
|  CHECKOUT · BR · cart total R$ 348,00      |
+--------------------------------------------+
|  Pay with                                  |
|  ( • ) Pix    [recommended · instant]      |
|  (   ) Card                                |
|  (   ) Boleto                              |
+--------------------------------------------+
|         [#####  QR CODE  #####]            |
|         [##  base64 + EMV  ##]             |
|         scan with bank app                 |
|         expires in 59:42                   |
+--------------------------------------------+
|  events · QR_DISPLAYED → AUTHORIZED        |
|  back-end · pacs.008 → Carat ledger        |
+--------------------------------------------+`,
    prototypePrompt: `Build a single-page React + Tailwind checkout flow for a Brazilian
fashion D2C brand. Three payment options vertically stacked: Pix (selected
by default with a "recommended · instant" pill), Card, Boleto. When Pix
is selected, show a centered QR code surface (placeholder PNG ok), a
countdown timer (default 60 minutes), and a small status row that cycles
through "PAYMENT_METHOD_READY → QR_DISPLAYED → PAYMENT_AUTHORIZED" every
3 seconds. Use a warm off-white background, JetBrains Mono for monospace
numerics, Söhne or Inter for headings. No card form fields. Mobile-first;
single column on narrow viewports. Include a thin bottom-of-page strip
that displays the BACEN reference id once authorized.`,
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

function marketingSeed(): StageSeed<MarketingArtifact> {
  const artifact: MarketingArtifact = {
    positioningStatement:
      "For mid-market BR-exposed fashion D2C brands frustrated by 31% checkout abandonment, Commerce Hub adds Pix in 6 weeks with full GL reconciliation — unlike APM-only vendors that leave finance close-day broken.",
    headlineOptions: [
      "Recover one in five abandoning BR checkouts",
      "Pix in six weeks, reconciled to your GL",
      "Stop choosing between BR conversion and finance close",
    ],
    subheadOptions: [
      "Add Pix to Commerce Hub with full Carat ledger parity. 90-day pilot rubric: +30% approval lift, NPS ≥ 50.",
      "ISO 20022 envelope conformant. 12 Vitest stubs. 5/5 callback parity. No scheme drift.",
      "Built on the same SDK that ships 55 APMs to 11M merchants. Pix, with Fiserv-grade reconciliation behind it.",
    ],
    audienceMessages: [
      {
        audience: "Director of Payments",
        painSentence:
          "BR-IP traffic abandons at 31% vs your 12% global baseline; you can't quote the lost revenue.",
        reliefSentence:
          "Pilot rubric ties Pix to a +30 pp approval lift on BR traffic — measurable from week one.",
        cta: "Stand up sandbox in 5 days; review the production-pilot dashboard at day 30.",
      },
      {
        audience: "Finance Controller",
        painSentence:
          "BR settlement reconciles on a separate spreadsheet; mapping drift goes undetected for a quarter.",
        reliefSentence:
          "pacs.008 envelope flows directly into Carat ledger; 0.05% reconciliation variance from day one.",
        cta: "Walk through the GL parity report on the existing 55-APM ledger.",
      },
      {
        audience: "Engineering Lead",
        painSentence:
          "APM additions historically take 12+ weeks and break the callback contract on parallel rails.",
        reliefSentence:
          "Same adapter pattern as the 239-test SDK; 12 Vitest stubs already drafted; 5/5 callback parity.",
        cta: "Read the Pix design doc + safety-check report before the next sprint.",
      },
    ],
    proofPoints: [
      "ISO 20022 pacs.008.001.10 envelope conforms to BACEN PIX-DICT — no scheme drift.",
      "55-APM callback parity test passing; Pix passes the same sweep (5/5 events).",
      "239/239 E2E test suite is the SDK's existing baseline.",
      "A1 anchor merchant signed for Q3 2026 pilot.",
      "Production-pilot rubric: +30% approval lift, NPS ≥ 50, GL variance ≤ 0.05%.",
    ],
    channelMix: [
      {
        channel: "merchant blog post + case study",
        hook: "Inside the A1 anchor pilot — recovering 1 in 5 BR checkouts in week 1",
        sequencingDay: "T+0",
      },
      {
        channel: "ISV-partner co-marketing email",
        hook: "Pix is live in Commerce Hub — your A1-class merchants can opt in this quarter",
        sequencingDay: "T+3",
      },
      {
        channel: "scheme-compliance brief (BACEN)",
        hook: "How Commerce Hub maps pacs.008 for Pix while preserving Carat ledger parity",
        sequencingDay: "T-7",
      },
      {
        channel: "Director-of-Payments LinkedIn newsletter",
        hook: "The honest math on regional APM additions — what +30% approval lift is worth on $50M GPV",
        sequencingDay: "T+7",
      },
    ],
    launchSequence: [
      { milestone: "Partner brief sent (ISV + scheme)", timing: "T-14" },
      { milestone: "Pilot merchant pre-comms + dashboard preview", timing: "T-3" },
      { milestone: "Public launch + scheme-compliance brief drop", timing: "T+0" },
      { milestone: "First-week metrics post (approval rate + reconciliation)", timing: "T+7" },
      { milestone: "Day-30 dashboard review with A1 anchor", timing: "T+30" },
      { milestone: "Day-90 production-pilot rubric scorecard", timing: "T+90" },
    ],
    antiMessages: [
      "Do not lead with 'AI-powered' — audience is regulated FinOps and skeptical of buzzwords.",
      "Do not claim lift numbers without the pilot footnote and 30-day baseline reference.",
      "Do not name competitor merchants by brand; archetype-class only.",
    ],
  };
  return {
    artifact,
    agent: bindingFor("marketing").agentLabel,
    artifactName: "marketing.json",
    citations: [
      {
        label: "Discovery archetype + JTBD (voice-of-customer)",
        path: "Documents/Work/Projects/APM/PDLC-OS/state/brain.json#artifacts.discovery",
      },
      {
        label: "Launch pilot list + production-pilot rubric metrics",
        path: "Documents/Work/Projects/APM/PDLC-OS/state/brain.json#artifacts.launch",
      },
      {
        label: "Delivery readiness checklist (proof-of-readiness)",
        path: "Documents/Work/Projects/APM/PDLC-OS/state/brain.json#artifacts.delivery",
      },
    ],
    evalRationale:
      "Positioning ≤30 words; every audience message restates pain before relief; proof points all trace to prior brain artifacts.",
  };
}

function salesEnablementSeed(): StageSeed<SalesEnablementArtifact> {
  const artifact: SalesEnablementArtifact = {
    icp: {
      archetypeId: "A1",
      archetypeName: "Mid-Market Fashion D2C + Omnichannel",
      sizeBand: "$10M – $300M GPV",
      channel: "direct-merchant + isv-ecommerce",
      vertical: "fashion D2C + omnichannel retail",
      qualifyingSignals: [
        "Annual GPV between $10M and $300M with ≥ 50% D2C mix",
        "BR DTC traffic > 10% of e-commerce volume (CRM region tag)",
        "Currently uses an APM-only vendor without GL reconciliation",
        "Has a Director of Payments OR Head of Finance Ops named in CRM",
        "BFCM seasonality risk score in account brief",
      ],
      disqualifyingSignals: [
        "No BR exposure or LATAM growth plans on file",
        "Card-present-only merchant (no checkout surface)",
        "Multi-year exclusivity with a competing payment platform",
      ],
    },
    discoveryQuestions: [
      {
        question:
          "Walk me through the last time you added a regional APM. What broke first — conversion, reconciliation, or compliance?",
        listenFor:
          "If reconciliation comes up first, our GL parity is the wedge. If compliance, the BACEN brief is.",
      },
      {
        question:
          "Where in the funnel does your BR traffic disappear today, and how do you size the lost revenue per month?",
        listenFor:
          "If they can't quote a number, instrumenting the production-pilot rubric IS the value.",
      },
      {
        question:
          "Who signs off on a new payment method going live — payments, finance, or both? What does each one need to feel safe?",
        listenFor:
          "Maps to our 3 audience messages (payments, finance, eng). Each gets its own page in the dashboard.",
      },
      {
        question:
          "Tell me about the last time finance close slipped because of a payment-method mapping. What was the post-mortem?",
        listenFor:
          "Surfaces the pain that GL parity solves. If they say 'never happened' — they likely have a reconciliation gap they haven't measured.",
      },
      {
        question:
          "If a regional APM rollout produced a 1.5 pp drop on a non-BR BIN range, how would you detect it today, and how fast?",
        listenFor:
          "If the answer is days, AnomalyAgent + production-pilot dashboard is the differentiator.",
      },
      {
        question:
          "What does a 30% approval lift on BR traffic mean for your quarterly revenue plan?",
        listenFor:
          "Listen for them quoting AOV × volume × delta — if they can't, do the math live with the ROI calculator.",
      },
    ],
    objectionHandling: [
      {
        objection: "We already have an APM vendor for Pix.",
        reframe:
          "Most APM-only vendors leave the GL reconciliation to you — that's where the close-day pain hides.",
        evidence:
          "Commerce Hub Pix flows pacs.008 → Carat ledger natively; reconciliation variance ≤ 0.05% from day one.",
      },
      {
        objection: "12 weeks is too long; we need it in the BFCM window.",
        reframe:
          "We're committing to 6 weeks, not 12, because the SDK adapter pattern is reused — not new.",
        evidence:
          "12 Vitest stubs already drafted; 5/5 callback parity passes the same sweep that 55 APMs already pass.",
      },
      {
        objection: "How do we know your approval lift number is real?",
        reframe:
          "We don't ask you to trust a number — the production-pilot dashboard makes it observable from week one.",
        evidence:
          "30-day baseline locked in week 0; +30 pp approval-rate lift visible on the BR cohort by day 14.",
      },
      {
        objection: "Compliance review will block this for months.",
        reframe:
          "We bring the scheme-compliance brief on day -7. Your compliance team reviews ours, not the other way around.",
        evidence:
          "BACEN-aligned ISO 20022 pacs.008.001.10 envelope; brief is template-ready in the design artifact.",
      },
      {
        objection: "What if the Pix rollout regresses our card approval rate?",
        reframe:
          "That's the #1 historical failure mode and it's instrumented as a gate, not an after-the-fact check.",
        evidence:
          "AnomalyAgent watches non-BR BIN ranges from minute one; auto-rollback path already documented in the design.",
      },
    ],
    demoScript: [
      {
        step: "Step 1 · open Commerce Hub merchant config and paste the Pix DICT alias",
        whatTheySee:
          "DICT alias accepted (CPF/CNPJ/email/phone/EVP); validator rejects malformed input with a 422.",
        whatToSay:
          "This is the only thing the merchant has to add to go live with Pix — one alias.",
      },
      {
        step: "Step 2 · click 'Run Pix sandbox round-trip'",
        whatTheySee:
          "Adapter call → QR retrieved → 5 callback events stream in (READY → DISPLAYED → AUTHORIZED).",
        whatToSay:
          "5/5 callback parity — the exact same sweep that 55 APMs already pass on this SDK.",
      },
      {
        step: "Step 3 · open the production-pilot dashboard",
        whatTheySee:
          "BR approval rate vs. 30-day baseline · time-to-settlement · NPS · GL variance.",
        whatToSay:
          "These four numbers are how we agree the pilot succeeded — instrumented before launch.",
      },
      {
        step: "Step 4 · open the Carat ledger reconciliation report",
        whatTheySee:
          "pacs.002 webhook events matched 1:1 with Carat ledger entries; variance ≤ 0.05%.",
        whatToSay:
          "This is the close-day proof point your finance lead needs — no spreadsheet, no drift.",
      },
      {
        step: "Step 5 · click 'Export PRD'",
        whatTheySee:
          "A 10-section PRD synthesized across all 9 stage artifacts, ready to paste into Confluence.",
        whatToSay:
          "Your team gets the entire decision trail in one document — Discovery to E2E test plan.",
      },
    ],
    competitiveBattlecard: [
      {
        competitor: "Stripe",
        whereWeWin:
          "Multi-back-end (Nashville/Omaha/Buypass) reconciliation parity in one ledger.",
        whereTheyWin:
          "Brand recognition + faster initial setup if the merchant is already on Stripe.",
        tieBreaker:
          "Ask: 'How does your finance team reconcile Pix settlement to your existing GL across three back-ends today?' If they can't answer cleanly, we win.",
      },
      {
        competitor: "Adyen",
        whereWeWin:
          "Mid-market BR DTC pricing tier; SMB onboarding lane for adjacent archetypes.",
        whereTheyWin:
          "Enterprise MarketPay reconciliation if the merchant is already a marketplace.",
        tieBreaker:
          "Ask: 'What's your annual GPV and BR mix?' Sub-$300M with > 10% BR puts us in front.",
      },
      {
        competitor: "dLocal",
        whereWeWin:
          "Global ledger with mixed BR + EU + NA traffic on one reconciliation surface.",
        whereTheyWin:
          "Pure-play LATAM merchants with no NA/EU footprint and a regional-only finance team.",
        tieBreaker:
          "Ask: 'What share of your settlement reconciliation today is non-BR?' If > 30%, the global ledger wins.",
      },
    ],
    roiInputs: [
      {
        variable: "annualGPV",
        prompt: "What's your trailing-12-month gross payment volume?",
        defaultValue: "$50M",
        sourceOfDefault: "A1 archetype median (Discovery artifact)",
      },
      {
        variable: "brTrafficShare",
        prompt: "What share of e-commerce traffic is BR-IP?",
        defaultValue: "24%",
        sourceOfDefault: "A1 archetype baseline (Discovery)",
      },
      {
        variable: "currentBrAbandonment",
        prompt: "What's your BR-IP checkout abandonment vs. global baseline?",
        defaultValue: "31% (vs 12% global)",
        sourceOfDefault: "Discovery painsRanked rank 1",
      },
      {
        variable: "expectedLift",
        prompt: "What approval-rate lift do you target for Pix vs. the current baseline?",
        defaultValue: "+30 pp",
        sourceOfDefault: "Production-pilot rubric (Launch successMetrics)",
      },
      {
        variable: "averageOrderValue",
        prompt: "BR average order value?",
        defaultValue: "R$ 348",
        sourceOfDefault: "Demo cart anchor (Design napkinSketch)",
      },
      {
        variable: "reconciliationHoursPerMonth",
        prompt: "Hours per month spent on BR settlement reconciliation today?",
        defaultValue: "40 hours",
        sourceOfDefault: "Prioritization driverTree row 3",
      },
    ],
    closeAsk:
      "Let's stand up sandbox access for your DICT alias by Friday and run a 5-transaction round-trip on your BR cart, with the production-pilot dashboard wired in by next Wednesday.",
  };
  return {
    artifact,
    agent: bindingFor("sales-enablement").agentLabel,
    artifactName: "sales-enablement.json",
    citations: [
      {
        label: "Discovery archetype A1 + qualifying signals",
        path: "Documents/Work/Projects/APM/PDLC-OS/state/brain.json#artifacts.discovery",
      },
      {
        label: "Marketing positioning + audience messages",
        path: "Documents/Work/Projects/APM/PDLC-OS/state/brain.json#artifacts.marketing",
      },
      {
        label: "Launch competitive landscape (Stripe / Adyen / dLocal)",
        path: "Documents/Work/Projects/APM/PDLC-OS/state/brain.json#artifacts.launch.competitive",
      },
    ],
    evalRationale:
      "ICP tightly scoped to A1; battlecard names honest 'where they win'; close ask is a single concrete next step.",
  };
}

function e2eTestPlanSeed(): StageSeed<E2eTestPlanArtifact> {
  const artifact: E2eTestPlanArtifact = {
    criticalJourneys: [
      {
        id: "CJ-01-pix-happy-path",
        title: "BR buyer pays a R$ 348 cart with Pix and merchant receives funds",
        persona: "BR DTC buyer on mobile Safari",
        steps: [
          "Open A1 anchor checkout from a BR-IP",
          "Select Pix payment method (default-selected)",
          "Receive QR code within 2 seconds (p95)",
          "Scan with bank app and confirm payment",
          "Adapter receives PAYMENT_AUTHORIZED callback",
          "Carat ledger writes a single matched entry",
        ],
        successCriterion:
          "Funds visible in Carat ledger within 8 seconds of authorization, single entry, no duplicate.",
      },
      {
        id: "CJ-02-pix-expiry-cancellation",
        title: "Buyer abandons Pix QR; expiration fires and merchant ledger stays clean",
        persona: "BR DTC buyer on desktop",
        steps: [
          "Generate Pix QR with default 3600s expiration",
          "Buyer leaves checkout open without paying",
          "Wait for expirationSeconds to elapse",
          "Verify EXPIRED callback fires exactly once",
          "Verify Carat ledger has no entry",
        ],
        successCriterion:
          "EXPIRED is terminal and idempotent; Carat ledger reflects zero entries for the txid.",
      },
      {
        id: "CJ-03-finance-close-day",
        title: "Monthly close day reconciles 1,000 Pix settlements to GL with zero variance",
        persona: "Finance Controller running close-day batch",
        steps: [
          "Pull pacs.002 settlement file for the month",
          "Run Carat ledger reconciliation against GL",
          "Verify all 1,000 entries match 1:1",
          "Export variance report for finance review",
          "Sign off close day",
        ],
        successCriterion:
          "Reconciliation variance ≤ 0.05% across all settled Pix transactions for the month.",
      },
      {
        id: "CJ-04-non-br-bin-regression-watch",
        title: "Adding Pix does NOT regress non-BR card approval rate",
        persona: "Production-pilot oncall + AnomalyAgent",
        steps: [
          "Deploy Pix to A1 anchor",
          "Watch non-BR BIN-range approval rate hourly",
          "Trigger AnomalyAgent threshold check at 24h, 7d, 30d",
          "Verify no >1pp regression on any non-BR BIN",
        ],
        successCriterion:
          "Non-BR BIN approval rate stays within ±0.5 pp of 30-day baseline at every check.",
      },
    ],
    regressionMatrix: [
      {
        dimension: "BIN range",
        values: ["BR-issuer", "US-issuer", "EU-issuer", "global-issuer"],
        mustHold: "approval rate within ±1pp of 30-day baseline",
      },
      {
        dimension: "device",
        values: ["mobile Safari", "mobile Chrome", "desktop Chrome", "desktop Firefox"],
        mustHold: "QR display p95 latency ≤ 2 seconds",
      },
      {
        dimension: "currency",
        values: ["BRL"],
        mustHold:
          "non-BRL requests rejected at adapter boundary with 422 (Pix is BRL-only)",
      },
      {
        dimension: "DICT alias type",
        values: ["CPF", "CNPJ", "email", "phone", "EVP"],
        mustHold: "alias resolves via PSP within 200ms p95",
      },
    ],
    edgeCases: [
      {
        name: "Duplicate pacs.002 webhook",
        trigger: "BACEN PSP retries the settlement webhook",
        expectedBehavior:
          "Adapter deduplicates on (txid, endToEndId); Carat ledger writes one entry only",
        detectionSignal: "duplicate webhook counter on metrics dashboard",
      },
      {
        name: "DICT alias rotated mid-flow",
        trigger: "Merchant rotates DICT key while a charge is in flight",
        expectedBehavior:
          "In-flight charge completes against previous alias; new charges use rotated alias",
        detectionSignal: "alias-version stamp on each charge in audit log",
      },
      {
        name: "expirationSeconds exceeds BACEN max",
        trigger: "Caller passes expirationSeconds > 86400",
        expectedBehavior: "Adapter rejects at boundary with 422 before BACEN call",
        detectionSignal: "validation error rate metric on /pix-charges",
      },
      {
        name: "infoAdicionais payload exceeds 200 chars",
        trigger:
          "Merchant orderId + extra metadata serializes to > 200 chars per BACEN limit",
        expectedBehavior:
          "Truncate with safety-check report; original preserved on Commerce Hub side",
        detectionSignal: "safety-check report frequency on weekly review",
      },
      {
        name: "Carat ledger temporary outage",
        trigger: "Carat downstream is unavailable when settlement webhook arrives",
        expectedBehavior:
          "Webhook acknowledged; settlement queued for replay; idempotent on retry",
        detectionSignal: "settlement-queue depth metric on Nashville back-end",
      },
      {
        name: "Buyer pays after expiration",
        trigger: "BACEN sends settlement webhook after EXPIRED callback already fired",
        expectedBehavior:
          "Adapter rejects, surfaces ops alert; merchant decides via existing dispute flow",
        detectionSignal: "post-expiration-payment counter — should always be 0",
      },
    ],
    performanceTargets: [
      {
        metric: "QR display p95 latency",
        target: "≤ 2,000 ms",
        source: "Discovery JTBD trigger condition (sustained checkout-abandonment delta)",
        blocking: true,
      },
      {
        metric: "Settlement webhook arrival p99",
        target: "≤ 8,000 ms after authorization",
        source: "Launch successMetrics — time-to-settlement (Pix BACEN SLA)",
        blocking: true,
      },
      {
        metric: "DICT alias resolution success rate",
        target: "≥ 99.5% (5xx counted as failure)",
        source: "Delivery readinessChecklist — sandbox DICT round-trip",
        blocking: true,
      },
      {
        metric: "Reconciliation variance",
        target: "≤ 0.05% across all settled Pix transactions per month",
        source: "Launch successMetrics — Carat ledger parity",
        blocking: true,
      },
      {
        metric: "Adapter-boundary 422 false-positive rate",
        target: "≤ 0.01% (legit requests wrongly rejected)",
        source: "Design fieldMappings — adapter-boundary BRL/regex enforcement",
        blocking: false,
      },
    ],
    launchBlockers: [
      {
        blocker: "Sandbox DICT alias resolves end-to-end against live BACEN PSP",
        owner: "platform-eng",
        howVerified: "5-transaction round-trip recorded in delivery readinessChecklist",
      },
      {
        blocker: "BACEN compliance review attached to PR with sign-off",
        owner: "compliance",
        howVerified: "scheme-compliance brief tagged to design.json",
      },
      {
        blocker: "A1 anchor merchant UAT signoff with finance close-day rehearsal",
        owner: "merchant-success",
        howVerified: "signed close-day rehearsal report for one full pacs.002 batch",
      },
      {
        blocker: "Production-pilot rubric instrumented in Carat (4 metrics live)",
        owner: "data-eng",
        howVerified:
          "approval-rate / time-to-settlement / NPS / variance dashboards visible to merchant",
      },
      {
        blocker: "AnomalyAgent watching non-BR BIN ranges from minute one of pilot",
        owner: "platform-eng",
        howVerified: "AnomalyAgent runbook + paging rule active in oncall channel",
      },
    ],
    rollbackCriteria: [
      {
        signal: "BR approval rate drops vs. 30-day baseline",
        threshold: "drops by > 1.5 pp for 60 minutes continuous",
        rollbackAction: "revert to PPRO redirect for BR traffic; keep card path live",
        autoOrManual: "auto-with-human-cancel",
      },
      {
        signal: "Non-BR BIN approval rate regression",
        threshold: "any non-BR BIN drops > 1 pp for 30 minutes continuous",
        rollbackAction: "disable Pix path globally; investigate adapter spillover",
        autoOrManual: "auto",
      },
      {
        signal: "Settlement webhook arrival p99 exceeds SLA",
        threshold: "> 30,000 ms p99 over a 15-minute window",
        rollbackAction:
          "switch settlement worker to backup queue; alert Nashville back-end oncall",
        autoOrManual: "auto-with-human-cancel",
      },
      {
        signal: "Reconciliation variance breach",
        threshold: "> 0.5% variance on any merchant for any 24-hour window",
        rollbackAction:
          "freeze new Pix charges for that merchant; reconcile manually before resuming",
        autoOrManual: "manual",
      },
    ],
    claimsValidation: [
      {
        claim: "Recover one in five abandoning BR checkouts",
        testThatProvesIt: "CJ-01-pix-happy-path + 14-day approval-rate dashboard",
        source: "marketing.headlineOptions[0]",
      },
      {
        claim: "Pix in six weeks, reconciled to your GL",
        testThatProvesIt: "CJ-03-finance-close-day + delivery.readinessChecklist sign-off",
        source: "marketing.headlineOptions[1]",
      },
      {
        claim: "ISO 20022 pacs.008.001.10 envelope conformant — no scheme drift",
        testThatProvesIt: "regressionMatrix dimension 'currency' + edgeCase: payload truncation",
        source: "marketing.proofPoints[0]",
      },
      {
        claim: "5/5 callback parity test passing",
        testThatProvesIt: "CJ-01-pix-happy-path + edgeCase: duplicate webhook",
        source: "marketing.proofPoints[1]",
      },
      {
        claim: "+30 pp approval lift on BR traffic",
        testThatProvesIt:
          "performanceTargets — settlement webhook p99 + production-pilot rubric instrumentation",
        source: "marketing.audienceMessages[0].reliefSentence",
      },
    ],
  };
  return {
    artifact,
    agent: bindingFor("e2e-test-plan").agentLabel,
    artifactName: "e2e-test-plan.json",
    citations: [
      {
        label: "Design field map + ISO envelope (contract surface)",
        path: "Documents/Work/Projects/APM/PDLC-OS/state/brain.json#artifacts.design",
      },
      {
        label: "Delivery Vitest stubs + readiness checklist",
        path: "Documents/Work/Projects/APM/PDLC-OS/state/brain.json#artifacts.delivery",
      },
      {
        label: "Marketing public claims (each must be testable)",
        path: "Documents/Work/Projects/APM/PDLC-OS/state/brain.json#artifacts.marketing",
      },
    ],
    evalRationale:
      "4 critical journeys observable; SLOs trace to Launch + JTBD; rollback thresholds are operational, not aspirational; every public marketing claim mapped to a test.",
  };
}

// Re-export buildEvalLog so a future executor can build custom (non-default) evals.
export { buildEvalLog };
