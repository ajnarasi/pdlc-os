import { z } from "zod";
import {
  ARTIFACT_SCHEMA,
  type StageId,
} from "./schemas.js";

export interface SkillBinding {
  id: string;
  stage: StageId;
  noun: string;
  verb: string;
  version: "v1";
  pmosSkillFiles: string[];
  outputSchema: z.ZodTypeAny;
  rubricCriteriaIds: string[];
  agentLabel: string;
  defaultAutonomy: "draft-and-approve" | "act-with-audit" | "suggest-only";
  description: string;
}

export const SKILL_REGISTRY: Record<StageId, SkillBinding> = {
  discovery: {
    id: "discovery.synthesize",
    stage: "discovery",
    noun: "discovery",
    verb: "synthesize",
    version: "v1",
    pmosSkillFiles: ["user-research-synthesis", "journey-map", "interview-guide"],
    outputSchema: ARTIFACT_SCHEMA.discovery,
    rubricCriteriaIds: ["evidence-cited", "archetype-matched", "handoff-complete"],
    agentLabel: "user-research-synthesis@pmos",
    defaultAutonomy: "draft-and-approve",
    description: "Classify pain → archetype + canonical Christensen JTBD",
  },
  prioritization: {
    id: "prioritization.size",
    stage: "prioritization",
    noun: "prioritization",
    verb: "size",
    version: "v1",
    pmosSkillFiles: ["impact-sizing", "prioritize", "define-north-star"],
    outputSchema: ARTIFACT_SCHEMA.prioritization,
    rubricCriteriaIds: [
      "evidence-cited",
      "archetype-matched",
      "metric-bound",
      "handoff-complete",
    ],
    agentLabel: "impact-sizing@pmos",
    defaultAutonomy: "draft-and-approve",
    description: "Build driver tree + RICE + GO/NO-GO bound to production-pilot rubric",
  },
  design: {
    id: "design.iso-map",
    stage: "design",
    noun: "design",
    verb: "iso-map",
    version: "v1",
    pmosSkillFiles: ["iso-payments", "enable-apm", "api-design"],
    outputSchema: ARTIFACT_SCHEMA.design,
    rubricCriteriaIds: ["evidence-cited", "iso-valid", "handoff-complete"],
    agentLabel: "iso-payments@pmos",
    defaultAutonomy: "draft-and-approve",
    description:
      "Generate Commerce Hub ↔ APM field map + ISO 20022 envelope + unmappables",
  },
  delivery: {
    id: "delivery.tickets",
    stage: "delivery",
    noun: "delivery",
    verb: "tickets",
    version: "v1",
    pmosSkillFiles: ["create-tickets", "code-first-draft"],
    outputSchema: ARTIFACT_SCHEMA.delivery,
    rubricCriteriaIds: ["evidence-cited", "test-coverable", "handoff-complete"],
    agentLabel: "create-tickets@pmos",
    defaultAutonomy: "draft-and-approve",
    description: "Generate Linear-shaped tickets + Vitest stubs + readiness checklist",
  },
  launch: {
    id: "launch.checklist",
    stage: "launch",
    noun: "launch",
    verb: "checklist",
    version: "v1",
    pmosSkillFiles: [
      "launch-checklist",
      "competitor-analysis",
      "experiment-metrics",
    ],
    outputSchema: ARTIFACT_SCHEMA.launch,
    rubricCriteriaIds: [
      "evidence-cited",
      "metric-bound",
      "competitor-aware",
      "handoff-complete",
    ],
    agentLabel: "launch-checklist+competitor-analysis@pmos",
    defaultAutonomy: "draft-and-approve",
    description: "Build GTM brief + pilot list + competitive landscape + metrics",
  },
  support: {
    id: "support.triage",
    stage: "support",
    noun: "support",
    verb: "triage",
    version: "v1",
    pmosSkillFiles: ["feature-results", "retention-analysis", "weekly-review"],
    outputSchema: ARTIFACT_SCHEMA.support,
    rubricCriteriaIds: ["evidence-cited", "metric-bound", "handoff-complete"],
    agentLabel: "feature-results+retention-analysis@pmos",
    defaultAutonomy: "draft-and-approve",
    description: "Triage rules + risk monitors + loopback to next Discovery seed",
  },
};

export function bindingFor(stage: StageId): SkillBinding {
  return SKILL_REGISTRY[stage];
}
