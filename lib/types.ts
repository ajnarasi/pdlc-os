export type StageId =
  | "discovery"
  | "prioritization"
  | "design"
  | "delivery"
  | "launch"
  | "support";

export const STAGE_ORDER: StageId[] = [
  "discovery",
  "prioritization",
  "design",
  "delivery",
  "launch",
  "support",
];

export interface StageMeta {
  id: StageId;
  num: string;
  title: string;
  subtitle: string;
  skill: string;
  endUser: string;
}

export const STAGES: Record<StageId, StageMeta> = {
  discovery: {
    id: "discovery",
    num: "01",
    title: "Discovery",
    subtitle: "Capture pain. Validate user.",
    skill: "user-research-synthesis + journey-map",
    endUser: "Product",
  },
  prioritization: {
    id: "prioritization",
    num: "02",
    title: "Prioritization",
    subtitle: "Quantify impact. Rank value vs. effort.",
    skill: "impact-sizing + prioritize",
    endUser: "Product",
  },
  design: {
    id: "design",
    num: "03",
    title: "Design",
    subtitle: "Map requirements. Define standards.",
    skill: "iso-payments + integration patterns",
    endUser: "Product + Developers",
  },
  delivery: {
    id: "delivery",
    num: "04",
    title: "Delivery",
    subtitle: "Manage scope. Verify integration.",
    skill: "create-tickets + checkout-sdk harness",
    endUser: "Developers",
  },
  launch: {
    id: "launch",
    num: "05",
    title: "Launch",
    subtitle: "Ensure readiness. Execute GTM.",
    skill: "launch-checklist + competitor-analysis",
    endUser: "Product + Marketing",
  },
  support: {
    id: "support",
    num: "06",
    title: "Support",
    subtitle: "Triage signal. Loop back to Discovery.",
    skill: "feature-results + retention-analysis",
    endUser: "Product + Support",
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
  };
  audit: AuditEntry[];
  evals: Partial<Record<StageId, KarpathyEvalLog>>;
}
