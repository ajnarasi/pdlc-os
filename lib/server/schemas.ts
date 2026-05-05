import { z } from "zod";

export const StageIdSchema = z.enum([
  "discovery",
  "prioritization",
  "design",
  "delivery",
  "launch",
  "support",
]);
export type StageId = z.infer<typeof StageIdSchema>;

export const STAGE_ORDER: StageId[] = [
  "discovery",
  "prioritization",
  "design",
  "delivery",
  "launch",
  "support",
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
};
