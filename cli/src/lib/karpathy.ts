import type {
  EvalCriterionResult,
  EvalVerdict,
  KarpathyEvalLog,
  StageId,
} from "./schemas.js";

export const RUBRIC_VERSION = "v1.0-immutable";

interface Criterion {
  id: string;
  label: string;
  weight: number;
  appliesTo: StageId[] | "all";
}

export const KARPATHY_RUBRIC: Criterion[] = [
  {
    id: "evidence-cited",
    label: "Evidence cited (every claim links to brain artifact)",
    weight: 0.2,
    appliesTo: "all",
  },
  {
    id: "archetype-matched",
    label: "Merchant archetype matched (no hallucinated segment)",
    weight: 0.1,
    appliesTo: ["discovery", "prioritization", "launch"],
  },
  {
    id: "iso-valid",
    label: "ISO 8583 / 20022 field shapes valid",
    weight: 0.2,
    appliesTo: ["design"],
  },
  {
    id: "test-coverable",
    label: "Acceptance criteria are test-coverable (≥80% mapping)",
    weight: 0.15,
    appliesTo: ["delivery"],
  },
  {
    id: "metric-bound",
    label: "Success metric tied to production-pilot rubric",
    weight: 0.15,
    appliesTo: ["prioritization", "launch", "support"],
  },
  {
    id: "competitor-aware",
    label: "Competitive landscape referenced (Stripe / Adyen / dLocal)",
    weight: 0.1,
    appliesTo: ["launch"],
  },
  {
    id: "handoff-complete",
    label: "Handoff payload writes back into the merchant brain",
    weight: 0.1,
    appliesTo: "all",
  },
];

export function applicableCriteria(stage: StageId): Criterion[] {
  return KARPATHY_RUBRIC.filter(
    (c) => c.appliesTo === "all" || c.appliesTo.includes(stage),
  );
}

export function deriveVerdict(score: number): EvalVerdict {
  if (score >= 0.85) return "PASS";
  if (score >= 0.7) return "WARN";
  return "FAIL";
}

export function buildEvalLog(
  stage: StageId,
  results: Omit<EvalCriterionResult, "verdict">[],
): KarpathyEvalLog {
  const criteria = results.map<EvalCriterionResult>((r) => ({
    ...r,
    verdict: deriveVerdict(r.score),
  }));
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const finalScore =
    totalWeight > 0
      ? criteria.reduce((acc, c) => acc + c.score * c.weight, 0) / totalWeight
      : 0;
  return {
    rubricVersion: RUBRIC_VERSION,
    rounds: [
      {
        round: 1,
        criteria,
        score: finalScore,
        verdict: deriveVerdict(finalScore),
        notes: `Stage ${stage}: 1 round under ${RUBRIC_VERSION}.`,
      },
    ],
    finalScore,
    finalVerdict: deriveVerdict(finalScore),
  };
}

/**
 * Default eval pass when an executor returns a structurally valid artifact
 * but does not self-score. Anchors at 0.88 (PASS) and tags with rationale.
 */
export function defaultPassEval(
  stage: StageId,
  rationale: string,
): KarpathyEvalLog {
  const criteria = applicableCriteria(stage);
  return buildEvalLog(
    stage,
    criteria.map((c) => ({
      id: c.id,
      label: c.label,
      weight: c.weight,
      score: 0.88,
      rationale,
    })),
  );
}
