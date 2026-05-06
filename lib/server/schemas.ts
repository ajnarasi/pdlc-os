import { z } from "zod";
import jtbdCatalog from "@/state/jtbd-catalog.json";

// Defensive coercion: some Anthropic responses return an array field as a
// JSON-stringified array (e.g. driverTree: "[{...}]") even under tool_use
// enforcement. A second observed failure mode is the model emitting a
// non-JSON prose string ("see the driver tree above…") for an array field.
// Behavior:
//   - real arrays: pass through
//   - JSON-stringified arrays: parse and use
//   - non-JSON strings / null / undefined: tolerate as empty array so the
//     rest of the artifact still validates (the cell renders empty rather
//     than the whole stage stalling). Fail-soft, not silent-corrupt.
function coerceJsonArray<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.preprocess((val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // not JSON — fall through to empty-array tolerance
      }
      return [];
    }
    if (val == null) return [];
    return val;
  }, z.array(itemSchema));
}

// Tolerant string. Live LLMs under tool_use occasionally:
//   (a) emit ordinal-like values as numbers (`tier: 1` instead of `"1"`)
//   (b) drop a required field entirely (undefined) when uncertain
//   (c) return null for "not applicable" values
// All three should not fail the whole stage. Numbers / booleans are
// String()-coerced; null / undefined become an empty string. The Zod
// schema itself stays z.string(), so callers can still chain `.min(1)`
// when they want strictness.
const looseString = z.preprocess((val) => {
  if (val == null) return "";
  if (typeof val === "string") return val;
  return String(val);
}, z.string());

// Tolerant enum. The model regularly emits enum values that aren't in
// the allowed set ("feature" / "epic" / "in-progress" / "Go" instead of
// the canonical labels). Match case-insensitively but always return the
// canonical casing from the schema, so downstream consumers see the
// expected literal. Falls back to a sensible default instead of failing
// the whole stage. The fallback IS visible in the rendered card so the
// gap stays honest.
function looseEnum<T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number],
) {
  return z.preprocess((val) => {
    if (typeof val !== "string") return fallback;
    const normalized = val.trim().toLowerCase();
    const match = (values as readonly string[]).find(
      (v) => v.toLowerCase() === normalized,
    );
    return match ?? fallback;
  }, z.enum(values));
}

// Source of truth for valid archetype IDs is the bundled JTBD catalog.
// Any archetypeId returned by the Discovery stage must exist in the catalog —
// otherwise the model has invented a fake archetype and the audit chain is
// no longer honest.
const KNOWN_ARCHETYPE_IDS = new Set<string>(
  (jtbdCatalog as { archetypes: { id: string }[] }).archetypes.map(
    (a) => a.id,
  ),
);
const ArchetypeIdSchema = z.string().refine(
  (id) => KNOWN_ARCHETYPE_IDS.has(id),
  (id) => ({
    message: `archetypeId '${id}' is not in the bundled JTBD catalog. Valid IDs: ${[...KNOWN_ARCHETYPE_IDS].sort().join(", ")}.`,
  }),
);

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
  archetypeId: ArchetypeIdSchema,
  archetypeName: z.string(),
  archetypeBrandClass: z.string(),
  jtbd: ChristensenJtbdSchema,
  painsRanked: coerceJsonArray(
    z.object({
      rank: z.coerce.number(),
      pain: looseString,
      severity: looseEnum(["high", "medium", "low"] as const, "medium"),
    }),
  ),
  segmentEvidence: coerceJsonArray(z.string()),
});

export const PrioritizationArtifactSchema = z.object({
  rice: z.object({
    reach: z.number(),
    impact: z.number(),
    confidence: z.number(),
    effort: z.number(),
    score: z.number(),
  }),
  driverTree: coerceJsonArray(
    z.object({
      driver: z.string(),
      lift: z.string(),
      assumption: z.string(),
    }),
  ),
  recommendation: looseEnum(
    ["GO", "NO-GO", "CONDITIONAL"] as const,
    "CONDITIONAL",
  ),
  rationale: looseString,
});

export const DesignArtifactSchema = z.object({
  apmCode: z.string(),
  pattern: z.string(),
  endpoints: coerceJsonArray(
    z.object({ method: z.string(), path: z.string() }),
  ),
  fieldMappings: coerceJsonArray(
    z.object({
      chField: looseString,
      chType: looseString,
      apmField: looseString,
      apmType: looseString,
      transform: looseString,
      tier: looseString,
      notes: looseString,
    }),
  ),
  isoEnvelope: coerceJsonArray(
    z.object({ messageType: looseString, sample: looseString }),
  ),
  unmappableFields: coerceJsonArray(
    z.object({
      field: looseString,
      reason: looseString,
      mitigation: looseString,
    }),
  ),
  napkinSketch: z.string().optional(),
  prototypePrompt: z.string().optional(),
});

export const DeliveryArtifactSchema = z.object({
  tickets: coerceJsonArray(
    z.object({
      key: looseString,
      title: looseString,
      type: looseEnum(["story", "task", "spike"] as const, "task"),
      estimate: looseString,
      acceptance: coerceJsonArray(looseString),
    }),
  ),
  testStubs: coerceJsonArray(
    z.object({ suite: looseString, cases: coerceJsonArray(looseString) }),
  ),
  readinessChecklist: coerceJsonArray(
    z.object({
      item: looseString,
      status: looseEnum(["ready", "wip", "blocked"] as const, "wip"),
      owner: looseString,
    }),
  ),
});

export const LaunchArtifactSchema = z.object({
  pilotMerchants: coerceJsonArray(
    z.object({ name: z.string(), archetype: z.string(), rationale: z.string() }),
  ),
  successMetrics: coerceJsonArray(
    z.object({ metric: z.string(), target: looseString, rationale: z.string() }),
  ),
  competitive: coerceJsonArray(
    z.object({
      competitor: z.string(),
      positioning: z.string(),
      gap: z.string(),
    }),
  ),
  gtmBrief: z.string(),
});

export const SupportArtifactSchema = z.object({
  triageRules: coerceJsonArray(
    z.object({ signal: z.string(), route: z.string(), sla: looseString }),
  ),
  riskMonitors: coerceJsonArray(
    z.object({ risk: z.string(), threshold: looseString, alert: z.string() }),
  ),
  loopback: z.object({
    nextDiscoverySeed: z.string(),
    rationale: z.string(),
  }),
});

export const MarketingArtifactSchema = z.object({
  positioningStatement: z.string(),
  headlineOptions: coerceJsonArray(z.string()),
  subheadOptions: coerceJsonArray(z.string()),
  audienceMessages: coerceJsonArray(
    z.object({
      audience: z.string(),
      painSentence: z.string(),
      reliefSentence: z.string(),
      cta: z.string(),
    }),
  ),
  proofPoints: coerceJsonArray(z.string()),
  channelMix: coerceJsonArray(
    z.object({
      channel: z.string(),
      hook: z.string(),
      sequencingDay: z.string(),
    }),
  ),
  launchSequence: coerceJsonArray(
    z.object({
      milestone: z.string(),
      timing: z.string(),
    }),
  ),
  antiMessages: coerceJsonArray(z.string()),
});

export const SalesEnablementArtifactSchema = z.object({
  icp: z.object({
    archetypeId: z.string(),
    archetypeName: z.string(),
    sizeBand: z.string(),
    channel: z.string(),
    vertical: z.string(),
    qualifyingSignals: coerceJsonArray(z.string()),
    disqualifyingSignals: coerceJsonArray(z.string()),
  }),
  discoveryQuestions: coerceJsonArray(
    z.object({
      question: z.string(),
      listenFor: z.string(),
    }),
  ),
  objectionHandling: coerceJsonArray(
    z.object({
      objection: z.string(),
      reframe: z.string(),
      evidence: z.string(),
    }),
  ),
  demoScript: coerceJsonArray(
    z.object({
      step: z.string(),
      whatTheySee: z.string(),
      whatToSay: z.string(),
    }),
  ),
  competitiveBattlecard: coerceJsonArray(
    z.object({
      competitor: z.string(),
      whereWeWin: z.string(),
      whereTheyWin: z.string(),
      tieBreaker: z.string(),
    }),
  ),
  roiInputs: coerceJsonArray(
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
  criticalJourneys: coerceJsonArray(
    z.object({
      id: z.string(),
      title: z.string(),
      persona: z.string(),
      steps: coerceJsonArray(z.string()),
      successCriterion: z.string(),
    }),
  ),
  regressionMatrix: coerceJsonArray(
    z.object({
      dimension: z.string(),
      values: coerceJsonArray(z.string()),
      mustHold: z.string(),
    }),
  ),
  edgeCases: coerceJsonArray(
    z.object({
      name: z.string(),
      trigger: z.string(),
      expectedBehavior: z.string(),
      detectionSignal: z.string(),
    }),
  ),
  performanceTargets: coerceJsonArray(
    z.object({
      metric: z.string(),
      target: looseString,
      source: z.string(),
      blocking: z.coerce.boolean(),
    }),
  ),
  launchBlockers: coerceJsonArray(
    z.object({
      blocker: z.string(),
      owner: z.string(),
      howVerified: z.string(),
    }),
  ),
  rollbackCriteria: coerceJsonArray(
    z.object({
      signal: looseString,
      threshold: looseString,
      rollbackAction: looseString,
      autoOrManual: looseEnum(
        ["auto", "manual", "auto-with-human-cancel"] as const,
        "manual",
      ),
    }),
  ),
  claimsValidation: coerceJsonArray(
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
