import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { StageId } from "./schemas";

export interface SubAgent {
  id: string;
  label: string;
  filename: string;
  systemPromptFragment: string;
}

const SUB_AGENT_DEFS: Array<Omit<SubAgent, "systemPromptFragment">> = [
  { id: "executive", label: "Executive", filename: "executive-reviewer.md" },
  { id: "engineer", label: "Engineer", filename: "engineer-reviewer.md" },
  { id: "designer", label: "Designer", filename: "designer-reviewer.md" },
  { id: "uxr-analyst", label: "UXR Analyst", filename: "uxr-analyst.md" },
  { id: "customer-voice", label: "Customer Voice", filename: "customer-voice.md" },
  { id: "legal-advisor", label: "Legal Advisor", filename: "legal-advisor.md" },
  { id: "skeptic", label: "Skeptic", filename: "skeptic.md" },
];

function bundledRoot(): string {
  return join(process.cwd(), "lib", "server", "sub-agents-md");
}

function searchRoots(): string[] {
  return [
    bundledRoot(),
    join(homedir(), "Documents", "Work", "PM-OS", "sub-agents"),
    join(
      homedir(),
      "Documents",
      "Work",
      "Projects",
      "APM",
      "PM-OS",
      "sub-agents",
    ),
  ];
}

function loadFragment(filename: string): string {
  for (const root of searchRoots()) {
    const candidate = join(root, filename);
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf8");
    }
  }
  return `# ${filename}\n\n(reviewer markdown not found; use the role label as your perspective)`;
}

export function loadSubAgents(): SubAgent[] {
  return SUB_AGENT_DEFS.map((def) => ({
    ...def,
    systemPromptFragment: loadFragment(def.filename),
  }));
}

export function buildPanelReviewerPrompt(
  agent: SubAgent,
  stage: StageId,
  artifactJson: string,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = [
    `You are the ${agent.label} reviewer in a 7-perspective panel for PDLC-OS.`,
    ``,
    `## Your role`,
    agent.systemPromptFragment,
    ``,
    `## Hard constraints`,
    `- You MUST submit your review via the submit_review tool. Do not return prose.`,
    `- Be specific. "Looks good" is not a critique. Cite a field, a number, or a missing piece.`,
    `- Score 0–100 honestly. 70 = acceptable, 85 = strong, 95+ = exceptional.`,
    `- Limit recommendations to 3 — the highest-leverage changes only.`,
  ].join("\n");

  const userPrompt = [
    `## Stage being reviewed`,
    stage,
    ``,
    `## Artifact JSON`,
    "```json",
    artifactJson,
    "```",
    ``,
    `Submit your review now via the submit_review tool. Single concrete critique, ≤3 recommendations, honest 0–100 score.`,
  ].join("\n");

  return { systemPrompt, userPrompt };
}
