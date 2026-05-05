import { z } from "zod";

export const StageIdSchema = z.enum([
  "discovery",
  "prioritization",
  "design",
  "delivery",
  "launch",
  "support",
  "marketing",
  "sales-enablement",
  "e2e-test-plan",
]);
export type StageId = z.infer<typeof StageIdSchema>;

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

export const EvalVerdictSchema = z.enum(["PASS", "WARN", "FAIL", "PENDING"]);
export type EvalVerdict = z.infer<typeof EvalVerdictSchema>;

export const CitationSchema = z.object({
  label: z.string(),
  path: z.string(),
  excerpt: z.string().optional(),
});

export const EvalCriterionResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  weight: z.number(),
  score: z.number(),
  verdict: EvalVerdictSchema,
  rationale: z.string(),
});

export const KarpathyRoundSchema = z.object({
  round: z.number(),
  criteria: z.array(EvalCriterionResultSchema),
  score: z.number(),
  verdict: EvalVerdictSchema,
  notes: z.string(),
});

export const KarpathyEvalLogSchema = z.object({
  rubricVersion: z.string(),
  rounds: z.array(KarpathyRoundSchema),
  finalScore: z.number(),
  finalVerdict: EvalVerdictSchema,
});

export const AuditEntrySchema = z.object({
  stage: StageIdSchema,
  agent: z.string(),
  artifactName: z.string(),
  evalScore: z.number(),
  evalVerdict: EvalVerdictSchema,
  citations: z.array(CitationSchema),
  hash: z.string(),
  parentHashes: z.array(z.string()),
  timestampISO: z.string(),
});

export const JtbdMetadataSchema = z.object({
  trigger: z.string(),
  frequency: z.string(),
  actor: z.string(),
  workaround: z.string(),
  successMetric: z.string(),
  failureMode: z.string(),
  failureFrequency: z.string(),
  agentTarget: z.string(),
  autonomyEnvelope: z.string(),
  source: z.string(),
  priority: z.string(),
});

export const ChristensenJtbdSchema = z.object({
  id: z.string(),
  title: z.string(),
  when: z.string(),
  iWantTo: z.string(),
  soICan: z.string(),
  metadata: JtbdMetadataSchema,
});

export const DiscoveryArtifactSchema = z.object({
  archetypeId: z.string(),
  archetypeName: z.string(),
  archetypeBrandClass: z.string(),
  jtbd: ChristensenJtbdSchema,
  painsRanked: z.array(
    z.object({
      rank: z.number(),
      pain: z.string(),
      severity: z.enum(["high", "medium", "low"]),
    }),
  ),
  segmentEvidence: z.array(z.string()),
});

export const PrioritizationArtifactSchema = z.object({
  rice: z.object({
    reach: z.number(),
    impact: z.number(),
    confidence: z.number(),
    effort: z.number(),
    score: z.number(),
  }),
  driverTree: z.array(
    z.object({
      driver: z.string(),
      lift: z.string(),
      assumption: z.string(),
    }),
  ),
  recommendation: z.enum(["GO", "NO-GO", "CONDITIONAL"]),
  rationale: z.string(),
});

export const DesignArtifactSchema = z.object({
  apmCode: z.string(),
  pattern: z.string(),
  endpoints: z.array(z.object({ method: z.string(), path: z.string() })),
  fieldMappings: z.array(
    z.object({
      chField: z.string(),
      chType: z.string(),
      apmField: z.string(),
      apmType: z.string(),
      transform: z.string(),
      tier: z.string(),
      notes: z.string(),
    }),
  ),
  isoEnvelope: z.array(z.object({ messageType: z.string(), sample: z.string() })),
  unmappableFields: z.array(
    z.object({ field: z.string(), reason: z.string(), mitigation: z.string() }),
  ),
  napkinSketch: z.string().optional(),
  prototypePrompt: z.string().optional(),
});

export const DeliveryArtifactSchema = z.object({
  tickets: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      type: z.enum(["story", "task", "spike"]),
      estimate: z.string(),
      acceptance: z.array(z.string()),
    }),
  ),
  testStubs: z.array(z.object({ suite: z.string(), cases: z.array(z.string()) })),
  readinessChecklist: z.array(
    z.object({
      item: z.string(),
      status: z.enum(["ready", "wip", "blocked"]),
      owner: z.string(),
    }),
  ),
});

export const LaunchArtifactSchema = z.object({
  pilotMerchants: z.array(
    z.object({ name: z.string(), archetype: z.string(), rationale: z.string() }),
  ),
  successMetrics: z.array(
    z.object({ metric: z.string(), target: z.string(), rationale: z.string() }),
  ),
  competitive: z.array(
    z.object({
      competitor: z.string(),
      positioning: z.string(),
      gap: z.string(),
    }),
  ),
  gtmBrief: z.string(),
});

export const SupportArtifactSchema = z.object({
  triageRules: z.array(
    z.object({ signal: z.string(), route: z.string(), sla: z.string() }),
  ),
  riskMonitors: z.array(
    z.object({ risk: z.string(), threshold: z.string(), alert: z.string() }),
  ),
  loopback: z.object({
    nextDiscoverySeed: z.string(),
    rationale: z.string(),
  }),
});

export const MarketingArtifactSchema = z.object({
  positioningStatement: z.string(),
  headlineOptions: z.array(z.string()),
  subheadOptions: z.array(z.string()),
  audienceMessages: z.array(
    z.object({
      audience: z.string(),
      painSentence: z.string(),
      reliefSentence: z.string(),
      cta: z.string(),
    }),
  ),
  proofPoints: z.array(z.string()),
  channelMix: z.array(
    z.object({
      channel: z.string(),
      hook: z.string(),
      sequencingDay: z.string(),
    }),
  ),
  launchSequence: z.array(
    z.object({
      milestone: z.string(),
      timing: z.string(),
    }),
  ),
  antiMessages: z.array(z.string()),
});

export const SalesEnablementArtifactSchema = z.object({
  icp: z.object({
    archetypeId: z.string(),
    archetypeName: z.string(),
    sizeBand: z.string(),
    channel: z.string(),
    vertical: z.string(),
    qualifyingSignals: z.array(z.string()),
    disqualifyingSignals: z.array(z.string()),
  }),
  discoveryQuestions: z.array(
    z.object({
      question: z.string(),
      listenFor: z.string(),
    }),
  ),
  objectionHandling: z.array(
    z.object({
      objection: z.string(),
      reframe: z.string(),
      evidence: z.string(),
    }),
  ),
  demoScript: z.array(
    z.object({
      step: z.string(),
      whatTheySee: z.string(),
      whatToSay: z.string(),
    }),
  ),
  competitiveBattlecard: z.array(
    z.object({
      competitor: z.string(),
      whereWeWin: z.string(),
      whereTheyWin: z.string(),
      tieBreaker: z.string(),
    }),
  ),
  roiInputs: z.array(
    z.object({
      variable: z.string(),
      prompt: z.string(),
      defaultValue: z.string(),
      sourceOfDefault: z.string(),
    }),
  ),
  closeAsk: z.string(),
});

export const E2eTestPlanArtifactSchema = z.object({
  criticalJourneys: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      persona: z.string(),
      steps: z.array(z.string()),
      successCriterion: z.string(),
    }),
  ),
  regressionMatrix: z.array(
    z.object({
      dimension: z.string(),
      values: z.array(z.string()),
      mustHold: z.string(),
    }),
  ),
  edgeCases: z.array(
    z.object({
      name: z.string(),
      trigger: z.string(),
      expectedBehavior: z.string(),
      detectionSignal: z.string(),
    }),
  ),
  performanceTargets: z.array(
    z.object({
      metric: z.string(),
      target: z.string(),
      source: z.string(),
      blocking: z.boolean(),
    }),
  ),
  launchBlockers: z.array(
    z.object({
      blocker: z.string(),
      owner: z.string(),
      howVerified: z.string(),
    }),
  ),
  rollbackCriteria: z.array(
    z.object({
      signal: z.string(),
      threshold: z.string(),
      rollbackAction: z.string(),
      autoOrManual: z.enum(["auto", "manual", "auto-with-human-cancel"]),
    }),
  ),
  claimsValidation: z.array(
    z.object({
      claim: z.string(),
      testThatProvesIt: z.string(),
      source: z.string(),
    }),
  ),
});

export const MerchantBrainSchema = z.object({
  runId: z.string(),
  merchantId: z.string(),
  merchantName: z.string(),
  inputPainPoint: z.string(),
  createdAt: z.string(),
  artifacts: z.object({
    discovery: DiscoveryArtifactSchema.optional(),
    prioritization: PrioritizationArtifactSchema.optional(),
    design: DesignArtifactSchema.optional(),
    delivery: DeliveryArtifactSchema.optional(),
    launch: LaunchArtifactSchema.optional(),
    support: SupportArtifactSchema.optional(),
    marketing: MarketingArtifactSchema.optional(),
    "sales-enablement": SalesEnablementArtifactSchema.optional(),
    "e2e-test-plan": E2eTestPlanArtifactSchema.optional(),
  }),
  audit: z.array(AuditEntrySchema),
  evals: z.record(StageIdSchema, KarpathyEvalLogSchema),
});

export type DiscoveryArtifact = z.infer<typeof DiscoveryArtifactSchema>;
export type PrioritizationArtifact = z.infer<typeof PrioritizationArtifactSchema>;
export type DesignArtifact = z.infer<typeof DesignArtifactSchema>;
export type DeliveryArtifact = z.infer<typeof DeliveryArtifactSchema>;
export type LaunchArtifact = z.infer<typeof LaunchArtifactSchema>;
export type SupportArtifact = z.infer<typeof SupportArtifactSchema>;
export type MarketingArtifact = z.infer<typeof MarketingArtifactSchema>;
export type SalesEnablementArtifact = z.infer<typeof SalesEnablementArtifactSchema>;
export type E2eTestPlanArtifact = z.infer<typeof E2eTestPlanArtifactSchema>;
export type MerchantBrain = z.infer<typeof MerchantBrainSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type KarpathyEvalLog = z.infer<typeof KarpathyEvalLogSchema>;
export type KarpathyRound = z.infer<typeof KarpathyRoundSchema>;
export type EvalCriterionResult = z.infer<typeof EvalCriterionResultSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type ChristensenJtbd = z.infer<typeof ChristensenJtbdSchema>;
export type JtbdMetadata = z.infer<typeof JtbdMetadataSchema>;

export const ARTIFACT_SCHEMA: Record<StageId, z.ZodTypeAny> = {
  discovery: DiscoveryArtifactSchema,
  prioritization: PrioritizationArtifactSchema,
  design: DesignArtifactSchema,
  delivery: DeliveryArtifactSchema,
  launch: LaunchArtifactSchema,
  support: SupportArtifactSchema,
  marketing: MarketingArtifactSchema,
  "sales-enablement": SalesEnablementArtifactSchema,
  "e2e-test-plan": E2eTestPlanArtifactSchema,
};
