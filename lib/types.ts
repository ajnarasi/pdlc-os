export type StageId =
  | "discovery"
  | "prioritization"
  | "design"
  | "delivery"
  | "launch"
  | "support"
  | "marketing"
  | "sales-enablement"
  | "e2e-test-plan";

export const STAGE_ORDER: StageId[] = [
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

export const CANONICAL_STAGES: StageId[] = [
  "discovery",
  "prioritization",
  "design",
  "delivery",
  "launch",
  "support",
];

export const EXTENSION_STAGES: StageId[] = [
  "marketing",
  "sales-enablement",
  "e2e-test-plan",
];

export type StageKind = "canonical" | "extension";

export function stageKind(id: StageId): StageKind {
  return EXTENSION_STAGES.includes(id) ? "extension" : "canonical";
}

export interface StageMeta {
  id: StageId;
  num: string;
  title: string;
  subtitle: string;
  skill: string;
  endUser: string;
  kind: StageKind;
}

export const STAGES: Record<StageId, StageMeta> = {
  discovery: {
    id: "discovery",
    num: "01",
    title: "Discovery",
    subtitle: "Capture pain. Validate user.",
    skill: "user-research-synthesis + journey-map",
    endUser: "Product",
    kind: "canonical",
  },
  prioritization: {
    id: "prioritization",
    num: "02",
    title: "Prioritization",
    subtitle: "Quantify impact. Rank value vs. effort.",
    skill: "impact-sizing + prioritize",
    endUser: "Product",
    kind: "canonical",
  },
  design: {
    id: "design",
    num: "03",
    title: "Design",
    subtitle: "Map requirements. Sketch surface. Define standards.",
    skill: "iso-payments + prototype + integration patterns",
    endUser: "Product + Developers",
    kind: "canonical",
  },
  delivery: {
    id: "delivery",
    num: "04",
    title: "Delivery",
    subtitle: "Manage scope. Verify integration.",
    skill: "create-tickets + checkout-sdk harness",
    endUser: "Developers",
    kind: "canonical",
  },
  launch: {
    id: "launch",
    num: "05",
    title: "Launch",
    subtitle: "Ensure readiness. Execute GTM.",
    skill: "launch-checklist + competitor-analysis",
    endUser: "Product + Marketing",
    kind: "canonical",
  },
  support: {
    id: "support",
    num: "06",
    title: "Support",
    subtitle: "Triage signal. Loop back to Discovery.",
    skill: "feature-results + retention-analysis",
    endUser: "Product + Support",
    kind: "canonical",
  },
  marketing: {
    id: "marketing",
    num: "EXT 07",
    title: "Marketing",
    subtitle: "Position. Craft hero copy. Sequence the launch.",
    skill: "marketing-launch",
    endUser: "PMM + Copywriter",
    kind: "extension",
  },
  "sales-enablement": {
    id: "sales-enablement",
    num: "EXT 08",
    title: "Sales Enablement",
    subtitle: "Equip the rep. Battlecard. Close ask.",
    skill: "sales-enablement",
    endUser: "AE + SE",
    kind: "extension",
  },
  "e2e-test-plan": {
    id: "e2e-test-plan",
    num: "EXT 09",
    title: "E2E Test Plan",
    subtitle: "Critical journeys. SLOs. Rollback. Claims validation.",
    skill: "e2e-test-plan",
    endUser: "QA + Product",
    kind: "extension",
  },
};

export type EvalVerdict = "PASS" | "WARN" | "FAIL" | "PENDING";

export interface EvalCriterionResult {
  id: string;
  label: string;
  weight: number;
  score: number;
  verdict: EvalVerdict;
  rationale: string;
}

export interface KarpathyEvalLog {
  rubricVersion: string;
  rounds: KarpathyRound[];
  finalScore: number;
  finalVerdict: EvalVerdict;
}

export interface KarpathyRound {
  round: number;
  criteria: EvalCriterionResult[];
  score: number;
  verdict: EvalVerdict;
  notes: string;
}

export interface Citation {
  label: string;
  path: string;
  excerpt?: string;
}

export interface AuditEntry {
  stage: StageId;
  agent: string;
  artifactName: string;
  evalScore: number;
  evalVerdict: EvalVerdict;
  citations: Citation[];
  hash: string;
  parentHashes: string[];
  timestampISO: string;
}

export interface JtbdMetadata {
  trigger: string;
  frequency: string;
  actor: string;
  workaround: string;
  successMetric: string;
  failureMode: string;
  failureFrequency: string;
  agentTarget: string;
  autonomyEnvelope: string;
  source: string;
  priority: string;
}

export interface ChristensenJtbd {
  id: string;
  title: string;
  when: string;
  iWantTo: string;
  soICan: string;
  metadata: JtbdMetadata;
}

export interface DiscoveryArtifact {
  archetypeId: string;
  archetypeName: string;
  archetypeBrandClass: string;
  jtbd: ChristensenJtbd;
  painsRanked: { rank: number; pain: string; severity: "high" | "medium" | "low" }[];
  segmentEvidence: string[];
}

export interface PrioritizationArtifact {
  rice: { reach: number; impact: number; confidence: number; effort: number; score: number };
  driverTree: { driver: string; lift: string; assumption: string }[];
  recommendation: "GO" | "NO-GO" | "CONDITIONAL";
  rationale: string;
}

export interface DesignArtifact {
  apmCode: string;
  pattern: string;
  endpoints: { method: string; path: string }[];
  fieldMappings: {
    chField: string;
    chType: string;
    apmField: string;
    apmType: string;
    transform: string;
    tier: string;
    notes: string;
  }[];
  isoEnvelope: { messageType: string; sample: string }[];
  unmappableFields: { field: string; reason: string; mitigation: string }[];
  napkinSketch?: string;
  prototypePrompt?: string;
}

export interface DeliveryArtifact {
  tickets: {
    key: string;
    title: string;
    type: "story" | "task" | "spike";
    estimate: string;
    acceptance: string[];
  }[];
  testStubs: { suite: string; cases: string[] }[];
  readinessChecklist: { item: string; status: "ready" | "wip" | "blocked"; owner: string }[];
}

export interface LaunchArtifact {
  pilotMerchants: { name: string; archetype: string; rationale: string }[];
  successMetrics: { metric: string; target: string; rationale: string }[];
  competitive: { competitor: string; positioning: string; gap: string }[];
  gtmBrief: string;
}

export interface SupportArtifact {
  triageRules: { signal: string; route: string; sla: string }[];
  riskMonitors: { risk: string; threshold: string; alert: string }[];
  loopback: {
    nextDiscoverySeed: string;
    rationale: string;
  };
}

export interface MarketingArtifact {
  positioningStatement: string;
  headlineOptions: string[];
  subheadOptions: string[];
  audienceMessages: {
    audience: string;
    painSentence: string;
    reliefSentence: string;
    cta: string;
  }[];
  proofPoints: string[];
  channelMix: {
    channel: string;
    hook: string;
    sequencingDay: string;
  }[];
  launchSequence: {
    milestone: string;
    timing: string;
  }[];
  antiMessages: string[];
}

export interface SalesEnablementArtifact {
  icp: {
    archetypeId: string;
    archetypeName: string;
    sizeBand: string;
    channel: string;
    vertical: string;
    qualifyingSignals: string[];
    disqualifyingSignals: string[];
  };
  discoveryQuestions: { question: string; listenFor: string }[];
  objectionHandling: {
    objection: string;
    reframe: string;
    evidence: string;
  }[];
  demoScript: {
    step: string;
    whatTheySee: string;
    whatToSay: string;
  }[];
  competitiveBattlecard: {
    competitor: string;
    whereWeWin: string;
    whereTheyWin: string;
    tieBreaker: string;
  }[];
  roiInputs: {
    variable: string;
    prompt: string;
    defaultValue: string;
    sourceOfDefault: string;
  }[];
  closeAsk: string;
}

export interface E2eTestPlanArtifact {
  criticalJourneys: {
    id: string;
    title: string;
    persona: string;
    steps: string[];
    successCriterion: string;
  }[];
  regressionMatrix: {
    dimension: string;
    values: string[];
    mustHold: string;
  }[];
  edgeCases: {
    name: string;
    trigger: string;
    expectedBehavior: string;
    detectionSignal: string;
  }[];
  performanceTargets: {
    metric: string;
    target: string;
    source: string;
    blocking: boolean;
  }[];
  launchBlockers: {
    blocker: string;
    owner: string;
    howVerified: string;
  }[];
  rollbackCriteria: {
    signal: string;
    threshold: string;
    rollbackAction: string;
    autoOrManual: "auto" | "manual" | "auto-with-human-cancel";
  }[];
  claimsValidation: {
    claim: string;
    testThatProvesIt: string;
    source: string;
  }[];
}

export interface MerchantBrain {
  runId: string;
  merchantId?: string;
  merchantName: string;
  inputPainPoint: string;
  createdAt: string;
  artifacts: {
    discovery?: DiscoveryArtifact;
    prioritization?: PrioritizationArtifact;
    design?: DesignArtifact;
    delivery?: DeliveryArtifact;
    launch?: LaunchArtifact;
    support?: SupportArtifact;
    marketing?: MarketingArtifact;
    "sales-enablement"?: SalesEnablementArtifact;
    "e2e-test-plan"?: E2eTestPlanArtifact;
  };
  audit: AuditEntry[];
  evals: Partial<Record<StageId, KarpathyEvalLog>>;
}
