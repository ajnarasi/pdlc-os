import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface JtbdMetadataLoose {
  trigger?: string;
  frequency?: string;
  actor?: string;
  workaround?: string;
  successMetric?: string;
  failureMode?: string;
  failureFrequency?: string;
  agentTarget?: string;
  autonomyEnvelope?: string;
  source?: string;
  priority?: string;
}

export interface CatalogJtbd {
  id: string;
  archetypeId: string;
  archetypeName: string;
  phaseId: string;
  phaseLabel: string;
  seq: number;
  title: string;
  when: string;
  iWantTo: string;
  soICan: string;
  metadata: JtbdMetadataLoose;
  partial: boolean;
  sourceFile: string;
}

export interface CatalogIndex {
  archetypes: Record<string, number>;
  phases: Record<string, number>;
  agents: Record<string, number>;
  autonomies: Record<string, number>;
}

export interface CatalogArchetype {
  id: string;
  name: string;
  tier: number | null;
  mvpSlice: string | null;
  status: string | null;
  lastScore: number | null;
  lastRound: number | null;
  brainPosture: string | null;
  size: string | null;
  gpvBand: string | null;
  channel: string[];
  vertical: string[];
  businessModel: string[];
  integrationModes: string[];
  regulatoryOverlay: string[];
  brandClass: string | null;
  jtbdCount: number;
  fullJtbdCount: number;
  p0JtbdCount: number;
  sourceFile: string;
}

export interface JtbdCatalogFile {
  generatedAt: string;
  totalJtbds: number;
  fullJtbds: number;
  partialJtbds: number;
  archetypeCount: number;
  archetypes: CatalogArchetype[];
  index: CatalogIndex;
  jtbds: CatalogJtbd[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATHS = [
  resolve(HERE, "..", "..", "..", "state", "jtbd-catalog.json"),
  resolve(HERE, "..", "..", "state", "jtbd-catalog.json"),
];

let cached: JtbdCatalogFile | null = null;

export function loadCatalog(): JtbdCatalogFile {
  if (cached) return cached;
  for (const p of CATALOG_PATHS) {
    if (existsSync(p)) {
      cached = JSON.parse(readFileSync(p, "utf8")) as JtbdCatalogFile;
      return cached;
    }
  }
  throw new Error(
    `JTBD catalog not found. Tried:\n  - ${CATALOG_PATHS.join("\n  - ")}\nRegenerate with \`npm run extract:jtbds\` from the PDLC-OS root.`,
  );
}

export interface JtbdQuery {
  q?: string;
  archetypeId?: string;
  phaseId?: string;
  includePartial?: boolean;
  limit?: number;
}

export function searchCatalog(query: JtbdQuery): CatalogJtbd[] {
  const cat = loadCatalog();
  const includePartial = query.includePartial ?? false;
  const q = query.q?.trim().toLowerCase();
  const filtered = cat.jtbds.filter((j) => {
    if (!includePartial && j.partial) return false;
    if (query.archetypeId && j.archetypeId !== query.archetypeId) return false;
    if (query.phaseId && j.phaseId !== query.phaseId) return false;
    if (!q) return true;
    return (
      j.id.toLowerCase().includes(q) ||
      j.title.toLowerCase().includes(q) ||
      j.when.toLowerCase().includes(q) ||
      j.iWantTo.toLowerCase().includes(q) ||
      j.soICan.toLowerCase().includes(q) ||
      j.archetypeName.toLowerCase().includes(q) ||
      (j.metadata.agentTarget?.toLowerCase().includes(q) ?? false) ||
      (j.metadata.actor?.toLowerCase().includes(q) ?? false)
    );
  });
  return query.limit ? filtered.slice(0, query.limit) : filtered;
}

export function findById(id: string): CatalogJtbd | undefined {
  return loadCatalog().jtbds.find((j) => j.id === id);
}

export function findArchetypeById(id: string): CatalogArchetype | undefined {
  return loadCatalog().archetypes.find((a) => a.id === id);
}

export function jtbdsForArchetype(id: string): CatalogJtbd[] {
  return loadCatalog().jtbds.filter((j) => j.archetypeId === id);
}

export function jtbdsByPhase(
  archetypeId: string,
): { phaseId: string; phaseLabel: string; jtbds: CatalogJtbd[] }[] {
  const list = jtbdsForArchetype(archetypeId);
  const groups = new Map<string, { phaseLabel: string; jtbds: CatalogJtbd[] }>();
  for (const j of list) {
    const key = j.phaseId || "unknown";
    const entry = groups.get(key) ?? { phaseLabel: j.phaseLabel, jtbds: [] };
    entry.jtbds.push(j);
    groups.set(key, entry);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([phaseId, { phaseLabel, jtbds }]) => ({
      phaseId,
      phaseLabel,
      jtbds: jtbds.sort((x, y) => x.seq - y.seq),
    }));
}

export function archetypeAsPainPoint(a: CatalogArchetype): string {
  const sizeAndChannel = [a.size, ...(a.channel ?? [])].filter(Boolean).join(" · ");
  const vertical = a.vertical?.length ? a.vertical.join(" / ") : "";
  const brand = a.brandClass ? ` (e.g., ${a.brandClass})` : "";
  return `Onboard / serve a ${sizeAndChannel} ${vertical} merchant matching archetype ${a.id} — ${a.name}${brand}. Pick the most impactful JTBD for this archetype's current quarter and run it through the full PDLC.`;
}

export function jtbdAsPainPoint(j: CatalogJtbd): string {
  if (!j.when) return `${j.id}: ${j.title}`;
  const stripTrailingPunct = (s: string) => s.replace(/[,;:]\s*$/, "");
  const ensureFinalPeriod = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
  return `When ${stripTrailingPunct(j.when)}, I want to ${stripTrailingPunct(j.iWantTo)}, so I can ${ensureFinalPeriod(j.soICan)}`;
}
