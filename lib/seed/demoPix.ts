import type { ChristensenJtbd, DiscoveryArtifact, MerchantBrain } from "../types";
import { buildEvalLog } from "../karpathy-rubric";
import { sign } from "../sign";

const DISCOVERY_HASH_PARENTS: string[] = [];

const pixJtbd: ChristensenJtbd = {
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
    failureFrequency: "~30% of regional APM rollouts produce a >1 pp regression in week 1 that goes undiagnosed for 5–10 days.",
    agentTarget: "IntegrationAgent (primary) + AnomalyAgent (post-launch watch) + ReconciliationAgent (GL feed).",
    autonomyEnvelope: "draft-and-approve (IntegrationAgent); act-with-audit (AnomalyAgent); draft-and-approve (ReconciliationAgent).",
    source: "inferred-with-flag (industry data: McKinsey 2024 cost-of-acceptance survey + LATAM regional narrative + Slice A killer demo).",
    priority: "P0 — V1-gating: Slice A pilot success metric (30/50/40/NPS≥50) requires regional-APM addition path.",
  },
};

const discoveryArtifact: DiscoveryArtifact = {
  archetypeId: "A1",
  archetypeName: "Mid-Market Fashion D2C + Omnichannel",
  archetypeBrandClass:
    "Indigo Road / Marine Layer / Outdoor Voices / Reformation / Buck Mason / Allbirds-class brand. ~$50M GPV, 60–75% D2C, 5–25 retail stores, 1 Director of Payments + 1 PM.",
  jtbd: pixJtbd,
  painsRanked: [
    {
      rank: 1,
      pain: "31% checkout abandonment on BR-IP traffic vs. 12% global baseline — buyers reach 'pay' and bounce when no local instant rail appears.",
      severity: "high" as const,
    },
    {
      rank: 2,
      pain: "18% BR card decline rate (installments-only) on AOV > R$300 — high-AOV cohorts abandon at the highest revenue points.",
      severity: "high" as const,
    },
    {
      rank: 3,
      pain: "Finance reconciles BR settlement on a separate spreadsheet — mapping drift goes undetected ~1× per quarter.",
      severity: "medium" as const,
    },
  ],
  segmentEvidence: [
    "Slice A (mid-market fashion D2C) = highest-leverage archetype: lean team, multi-channel complexity, BFCM seasonality (mvp-scope.md§slice-a).",
    "BR is 24% of the brand's 2025 D2C volume; growing 18% YoY but capped by the local-rail gap.",
    "QBR Q1 2026: 'regional APM addition' is the #1 inbound from A1-class brands with international DTC exposure.",
  ],
};

const discoveryEval = buildEvalLog("discovery", [
  {
    id: "evidence-cited",
    label: "Evidence cited (every claim links to brain artifact)",
    weight: 0.5,
    score: 0.95,
    rationale: "3 source citations: archetypes/, QBR notes, regional narrative.",
  },
  {
    id: "archetype-matched",
    label: "Merchant archetype matched",
    weight: 0.3,
    score: 0.92,
    rationale: "Pain pattern (BR regression, regional-APM gap) maps to canonical archetype A1 §3.1-06 JTBD.",
  },
  {
    id: "handoff-complete",
    label: "Handoff payload writes back into the merchant brain",
    weight: 0.2,
    score: 0.9,
    rationale: "Discovery artifact persisted with archetype, JTBD, ranked pains.",
  },
]);

const discoveryAudit = sign({
  stage: "discovery",
  agent: "user-research-synthesis@pmos",
  artifactName: "discovery.json",
  artifact: discoveryArtifact,
  evalScore: discoveryEval.finalScore,
  evalVerdict: discoveryEval.finalVerdict,
  citations: [
    {
      label: "LATAM marketplace archetype",
      path: "Documents/Work/Projects/APM/Fiserv Brain/merchant-research/archetypes/",
    },
    {
      label: "Trust-system paradox concept",
      path: "Documents/Work/Projects/APM/wiki/concept/trust-system-paradox.md",
    },
    {
      label: "LATAM regional APM narrative",
      path: "Documents/Work/Projects/APM/wiki/region/latam.md",
    },
  ],
  parentHashes: DISCOVERY_HASH_PARENTS,
  timestampISO: "2026-05-04T16:00:00.000Z",
});

const prioritizationArtifact = {
  rice: { reach: 8, impact: 3, confidence: 0.85, effort: 2, score: 10.2 },
  driverTree: [
    {
      driver: "BR checkout conversion",
      lift: "+18-24%",
      assumption: "Pix recovers ~70% of abandoning bank-only buyers (Stripe BR 2024 baseline).",
    },
    {
      driver: "Card decline avoidance",
      lift: "+8-12%",
      assumption: "Pix replaces 1/3 of currently declined BR card auths above R$300.",
    },
    {
      driver: "Reconciliation labor",
      lift: "-40 hrs/mo",
      assumption: "Pix instant settlement removes manual Boleto matching for new traffic.",
    },
  ],
  recommendation: "GO" as const,
  rationale:
    "RICE 10.2, BR GMV exposure $10.1M ARR, 6-week effort against Q3 launch window. Production-pilot rubric (30% approval lift / 50% dispute time / NPS≥50) is reachable within 90 days post-pilot.",
};

const prioritizationEval = buildEvalLog("prioritization", [
  {
    id: "evidence-cited",
    label: "Evidence cited",
    weight: 0.4,
    score: 0.93,
    rationale: "APM tracker + Stripe BR 2024 baseline + MVP scope rubric cited.",
  },
  {
    id: "archetype-matched",
    label: "Archetype matched",
    weight: 0.2,
    score: 0.94,
    rationale: "RICE inputs scoped to LATAM marketplace mid-market only.",
  },
  {
    id: "metric-bound",
    label: "Tied to production-pilot rubric",
    weight: 0.3,
    score: 0.91,
    rationale: "30/50/40/NPS≥50 metrics ladder enforced in rationale.",
  },
  {
    id: "handoff-complete",
    label: "Handoff complete",
    weight: 0.1,
    score: 0.92,
    rationale: "GO decision + driver tree carry into Design scope.",
  },
]);

const prioritizationAudit = sign({
  stage: "prioritization",
  agent: "impact-sizing@pmos",
  artifactName: "priority.json",
  artifact: prioritizationArtifact,
  evalScore: prioritizationEval.finalScore,
  evalVerdict: prioritizationEval.finalVerdict,
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
  parentHashes: [discoveryAudit.hash],
  timestampISO: "2026-05-04T16:00:08.000Z",
});

const designArtifact = {
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
      notes: "Pix is buyer-anonymous at charge creation; PII flows back via response only",
    },
  ],
  isoEnvelope: [
    {
      messageType: "pacs.008.001.10",
      sample:
        "<FIToFICstmrCdtTrf>\n  <GrpHdr><MsgId>PIX-2026-05-04-{txid}</MsgId>...</GrpHdr>\n  <CdtTrfTxInf>\n    <PmtId><EndToEndId>E18236120202605041500{txid}</EndToEndId></PmtId>\n    <IntrBkSttlmAmt Ccy='BRL'>{valor.original}</IntrBkSttlmAmt>\n    <Cdtr><Nm>{merchant.legalName}</Nm></Cdtr>\n  </CdtTrfTxInf>\n</FIToFICstmrCdtTrf>",
    },
  ],
  unmappableFields: [
    {
      field: "billingAddress.*",
      reason: "Pix charge creation does not accept billing address; payer revealed only after settlement.",
      mitigation: "Capture billing post-confirmation via Commerce Hub address service if AVS required for downstream rails.",
    },
    {
      field: "amountComponents.taxAmounts[]",
      reason: "BACEN PIX-DICT does not carry tax breakdown.",
      mitigation: "Persist taxes on CH order; re-attach for fiscal export only, not Pix payload.",
    },
    {
      field: "orderData.itemDetails[]",
      reason: "Line-item array unsupported on instant Pix.",
      mitigation: "Pack as 'infoAdicionais' max 50 entries, ≤200 chars each; truncate with safety-check report.",
    },
  ],
};

const designEval = buildEvalLog("design", [
  {
    id: "evidence-cited",
    label: "Evidence cited",
    weight: 0.3,
    score: 0.94,
    rationale: "Klarna template, wallet-pattern, normalized mapping all cited.",
  },
  {
    id: "iso-valid",
    label: "ISO 8583 / 20022 valid",
    weight: 0.5,
    score: 0.93,
    rationale: "pacs.008.001.10 envelope conforms to BACEN PIX-DICT spec; 7 fields mapped, 3 unmappables documented.",
  },
  {
    id: "handoff-complete",
    label: "Handoff complete",
    weight: 0.2,
    score: 0.92,
    rationale: "Field map + envelope + unmappables ready for Delivery test stubs.",
  },
]);

const designAudit = sign({
  stage: "design",
  agent: "iso-payments@pmos",
  artifactName: "design.md",
  artifact: designArtifact,
  evalScore: designEval.finalScore,
  evalVerdict: designEval.finalVerdict,
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
  parentHashes: [prioritizationAudit.hash],
  timestampISO: "2026-05-04T16:00:21.000Z",
});

const deliveryArtifact = {
  tickets: [
    {
      key: "PDLC-101",
      title: "Wire Indigo Road-class A1 merchant Pix DICT key into Commerce Hub merchant config",
      type: "story" as const,
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
      type: "story" as const,
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
      type: "story" as const,
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
      type: "task" as const,
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
    { item: "Sandbox DICT alias resolves end-to-end", status: "ready" as const, owner: "platform-eng" },
    { item: "Production-pilot rubric metrics instrumented (30/50/40)", status: "wip" as const, owner: "data-eng" },
    { item: "BACEN compliance review attached to PR", status: "wip" as const, owner: "compliance" },
    { item: "Indigo Road-class A1 merchant UAT signoff", status: "blocked" as const, owner: "merchant-success" },
    { item: "Carat ledger reconciliation parity", status: "ready" as const, owner: "Nashville back-end" },
  ],
};

const deliveryEval = buildEvalLog("delivery", [
  {
    id: "evidence-cited",
    label: "Evidence cited",
    weight: 0.3,
    score: 0.92,
    rationale: "Cites checkout-sdk-v2 callback sweep + Klarna safety-check pattern.",
  },
  {
    id: "test-coverable",
    label: "Acceptance test-coverable",
    weight: 0.5,
    score: 0.93,
    rationale: "12/13 acceptance bullets directly map to a Vitest case (92%).",
  },
  {
    id: "handoff-complete",
    label: "Handoff complete",
    weight: 0.2,
    score: 0.9,
    rationale: "Tickets + tests + readiness ready for Launch readiness review.",
  },
]);

const deliveryAudit = sign({
  stage: "delivery",
  agent: "create-tickets@pmos",
  artifactName: "delivery.json",
  artifact: deliveryArtifact,
  evalScore: deliveryEval.finalScore,
  evalVerdict: deliveryEval.finalVerdict,
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
  parentHashes: [designAudit.hash],
  timestampISO: "2026-05-04T16:00:34.000Z",
});

const launchArtifact = {
  pilotMerchants: [
    {
      name: "A1 anchor — mid-market fashion D2C + omnichannel",
      archetype: "A1",
      rationale: "Slice A canonical brand (~$50M GPV, ~24% BR exposure, 60–75% D2C). Lean team + BFCM seasonality = highest leverage for the Brain.",
    },
    {
      name: "A2-adjacent — mid-market subscription DTC, BR-curious",
      archetype: "A2",
      rationale: "Validates recurring-billing reconciliation against the same Pix settlement file pattern.",
    },
    {
      name: "M2 — mid-market marketplace-enabled retailer",
      archetype: "M2",
      rationale: "Validates marketplace-submerchant onboarding lane for the same APM addition flow.",
    },
  ],
  successMetrics: [
    {
      metric: "BR checkout approval rate",
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
      positioning: "Pix shipped 2024, embedded in Stripe Payments dashboard, no Carat parity.",
      gap: "No multi-back-end (Nashville/Omaha/Buypass) reconciliation; merchants on Stripe-only.",
    },
    {
      competitor: "Adyen",
      positioning: "Pix via local acquirer, MarketPay reconciliation, EU enterprise focus.",
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

const launchEval = buildEvalLog("launch", [
  {
    id: "evidence-cited",
    label: "Evidence cited",
    weight: 0.3,
    score: 0.93,
    rationale: "StripeConf 2026 synthesis + LATAM regional + production-pilot rubric all cited.",
  },
  {
    id: "metric-bound",
    label: "Metric-bound to production-pilot rubric",
    weight: 0.25,
    score: 0.94,
    rationale: "30/50/40/NPS≥50 explicit in success metrics.",
  },
  {
    id: "competitor-aware",
    label: "Competitive landscape",
    weight: 0.25,
    score: 0.93,
    rationale: "Stripe/Adyen/dLocal positioning + named gaps.",
  },
  {
    id: "handoff-complete",
    label: "Handoff complete",
    weight: 0.2,
    score: 0.9,
    rationale: "Pilot list + metrics carry to Support triage rules.",
  },
]);

const launchAudit = sign({
  stage: "launch",
  agent: "launch-checklist+competitor-analysis@pmos",
  artifactName: "launch.md",
  artifact: launchArtifact,
  evalScore: launchEval.finalScore,
  evalVerdict: launchEval.finalVerdict,
  citations: [
    {
      label: "StripeConf 2026 competitive synthesis (eval-verified, 7/7 PASS)",
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
  parentHashes: [deliveryAudit.hash],
  timestampISO: "2026-05-04T16:00:46.000Z",
});

const supportArtifact = {
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

const supportEval = buildEvalLog("support", [
  {
    id: "evidence-cited",
    label: "Evidence cited",
    weight: 0.3,
    score: 0.91,
    rationale: "Aha-Jira sync kit + PM-OS feature-results skill + sub-agents all cited.",
  },
  {
    id: "metric-bound",
    label: "Metric-bound",
    weight: 0.3,
    score: 0.92,
    rationale: "Risk thresholds tied to production-pilot rubric numbers.",
  },
  {
    id: "handoff-complete",
    label: "Handoff complete (loop closes)",
    weight: 0.4,
    score: 0.95,
    rationale: "Loopback writes nextDiscoverySeed back into the merchant brain.",
  },
]);

const supportAudit = sign({
  stage: "support",
  agent: "feature-results+retention-analysis@pmos",
  artifactName: "support.json",
  artifact: supportArtifact,
  evalScore: supportEval.finalScore,
  evalVerdict: supportEval.finalVerdict,
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
  parentHashes: [launchAudit.hash],
  timestampISO: "2026-05-04T16:00:58.000Z",
});

export const DEMO_PIX_BRAIN: MerchantBrain = {
  runId: "demo-pix-a1",
  merchantName: "A1 · Mid-Market Fashion D2C (Indigo Road-class)",
  inputPainPoint:
    "Brazilian buyers abandon at checkout — we don't accept Pix.",
  createdAt: "2026-05-04T16:00:00.000Z",
  artifacts: {
    discovery: discoveryArtifact,
    prioritization: prioritizationArtifact,
    design: designArtifact,
    delivery: deliveryArtifact,
    launch: launchArtifact,
    support: supportArtifact,
  },
  audit: [
    discoveryAudit,
    prioritizationAudit,
    designAudit,
    deliveryAudit,
    launchAudit,
    supportAudit,
  ],
  evals: {
    discovery: discoveryEval,
    prioritization: prioritizationEval,
    design: designEval,
    delivery: deliveryEval,
    launch: launchEval,
    support: supportEval,
  },
};

// Re-export under a new name for the server brain-store fallback path —
// keeps the import surface explicit so refactors are easy to spot.
export const DEMO_PIX_BRAIN_FALLBACK = DEMO_PIX_BRAIN;
