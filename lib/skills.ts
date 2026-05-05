import type { StageId } from "./types";

export interface SkillBinding {
  stage: StageId;
  pmosSkills: string[];
  brainSeeds: { label: string; path: string }[];
}

const APM_ROOT = "Documents/Work/Projects/APM";
const PMOS_ROOT = "Documents/Work/PM-OS/.claude/skills";

export const SKILL_BINDINGS: Record<StageId, SkillBinding> = {
  discovery: {
    stage: "discovery",
    pmosSkills: ["user-research-synthesis", "journey-map", "interview-guide"],
    brainSeeds: [
      {
        label: "Merchant archetypes (Fiserv Brain)",
        path: `${APM_ROOT}/Fiserv Brain/merchant-research/archetypes/`,
      },
      {
        label: "Segmentation framework",
        path: `${APM_ROOT}/Fiserv Brain/01-personas/segmentation-framework.md`,
      },
      {
        label: "Trust-system paradox concept",
        path: `${APM_ROOT}/wiki/concept/trust-system-paradox.md`,
      },
    ],
  },
  prioritization: {
    stage: "prioritization",
    pmosSkills: ["impact-sizing", "prioritize", "define-north-star"],
    brainSeeds: [
      {
        label: "APM coverage matrix (55 APMs, region, GMV)",
        path: `${APM_ROOT}/output/APM-Checkout-SDK-Tracker.csv`,
      },
      {
        label: "MVP scope + production-pilot rubric",
        path: `${APM_ROOT}/Fiserv Brain/04-prd/mvp-scope.md`,
      },
      {
        label: "Country matrix (Commerce Hub APM)",
        path: `${APM_ROOT}/CommerceHub_Global_APM_Country_Matrix.xlsx`,
      },
    ],
  },
  design: {
    stage: "design",
    pmosSkills: ["iso-payments", "enable-apm", "api-design"],
    brainSeeds: [
      {
        label: "Klarna ↔ Commerce Hub field mapping (template)",
        path: `${APM_ROOT}/output/klarna/mapping-ch-to-klarna.md`,
      },
      {
        label: "Wallet pattern (qr-code, redirect, native)",
        path: `${APM_ROOT}/wiki/concept/wallet-pattern.md`,
      },
      {
        label: "Integration patterns (6 archetypes)",
        path: `${APM_ROOT}/wiki/concept/integration-patterns.md`,
      },
      {
        label: "Commerce Hub APM normalized mapping",
        path: `${APM_ROOT}/CommerceHub_APM_Normalized_Mapping.xlsx`,
      },
    ],
  },
  delivery: {
    stage: "delivery",
    pmosSkills: ["create-tickets", "code-first-draft"],
    brainSeeds: [
      {
        label: "APM Checkout SDK browser package (TS)",
        path: `${APM_ROOT}/checkout-sdk-v2/packages/checkout-sdk-browser/`,
      },
      {
        label: "239/239 E2E test results (callback sweep)",
        path: `${APM_ROOT}/output/full-e2e-results.json`,
      },
      {
        label: "Klarna safety check report (template)",
        path: `${APM_ROOT}/output/klarna/safety-check-report.md`,
      },
    ],
  },
  launch: {
    stage: "launch",
    pmosSkills: ["launch-checklist", "competitor-analysis", "experiment-metrics"],
    brainSeeds: [
      {
        label: "StripeConf 2026 competitive synthesis (eval-verified)",
        path: `${APM_ROOT}/StripeConf-2026/output/stripe-sessions-2026-rundown.md`,
      },
      {
        label: "LATAM regional APM narrative",
        path: `${APM_ROOT}/wiki/region/latam.md`,
      },
      {
        label: "Production-pilot success metrics (30/50/40/NPS≥50)",
        path: `${APM_ROOT}/Fiserv Brain/04-prd/mvp-scope.md`,
      },
    ],
  },
  support: {
    stage: "support",
    pmosSkills: ["feature-results", "retention-analysis", "weekly-review"],
    brainSeeds: [
      {
        label: "Aha ↔ Jira sync kit (insight-to-backlog routing)",
        path: `${APM_ROOT}/wiki/concept/aha-jira-sync-kit.md`,
      },
      {
        label: "Multi-perspective sub-agents (7)",
        path: `Documents/Work/PM-OS/sub-agents/`,
      },
      {
        label: "PM-OS feature-results skill",
        path: `${PMOS_ROOT}/feature-results/SKILL.md`,
      },
    ],
  },
};
