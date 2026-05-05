import type {
  DeliveryArtifact,
  DesignArtifact,
  DiscoveryArtifact,
  LaunchArtifact,
  PrioritizationArtifact,
  StageId,
  SupportArtifact,
} from "./types";

export function previewLine(stage: StageId, artifact: unknown): string {
  if (!artifact) return "Awaiting prior-stage handoff…";
  switch (stage) {
    case "discovery": {
      const a = artifact as DiscoveryArtifact;
      return `${a.archetypeName} · ${a.painsRanked.length} pains · ${a.jtbd.id}`;
    }
    case "prioritization": {
      const a = artifact as PrioritizationArtifact;
      const top = a.driverTree[0]?.lift ?? "";
      return `RICE ${a.rice.score.toFixed(1)} · ${a.recommendation}${top ? ` · top driver ${top}` : ""}`;
    }
    case "design": {
      const a = artifact as DesignArtifact;
      return `${a.apmCode} · ${a.pattern} · ${a.fieldMappings.length} fields, ${a.unmappableFields.length} unmappable`;
    }
    case "delivery": {
      const a = artifact as DeliveryArtifact;
      const cases = a.testStubs.reduce((acc, s) => acc + s.cases.length, 0);
      const ready = a.readinessChecklist.filter((r) => r.status === "ready").length;
      return `${a.tickets.length} tickets · ${cases} test cases · ${ready}/${a.readinessChecklist.length} ready`;
    }
    case "launch": {
      const a = artifact as LaunchArtifact;
      const top = a.successMetrics[0]?.target ?? "";
      return `${a.pilotMerchants.length} pilots · ${top}${a.competitive.length ? ` · ${a.competitive.length} competitors` : ""}`;
    }
    case "support": {
      const a = artifact as SupportArtifact;
      return `${a.triageRules.length} triage rules · ${a.riskMonitors.length} risk monitors · loop closes ↻`;
    }
    default:
      return "";
  }
}
