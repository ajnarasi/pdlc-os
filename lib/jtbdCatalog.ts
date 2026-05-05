import catalog from "@/state/jtbd-catalog.json";

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

export interface CatalogIndex {
  archetypes: Record<string, number>;
  phases: Record<string, number>;
  agents: Record<string, number>;
  autonomies: Record<string, number>;
}

export interface JtbdCatalog {
  generatedAt: string;
  totalJtbds: number;
  fullJtbds: number;
  partialJtbds: number;
  archetypeCount: number;
  archetypes: CatalogArchetype[];
  index: CatalogIndex;
  jtbds: CatalogJtbd[];
}

export const CATALOG = catalog as unknown as JtbdCatalog;

export interface JtbdQuery {
  q?: string;
  archetypeId?: string;
  phaseId?: string;
  agentTarget?: string;
  autonomyEnvelope?: string;
  includePartial?: boolean;
  limit?: number;
  offset?: number;
}

export interface JtbdQueryResult {
  total: number;
  matched: number;
  offset: number;
  limit: number;
  jtbds: CatalogJtbd[];
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export function queryJtbds(query: JtbdQuery): JtbdQueryResult {
  const limit = Math.max(1, Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT));
  const offset = Math.max(0, query.offset ?? 0);
  const includePartial = query.includePartial ?? true;
  const q = query.q?.trim().toLowerCase();
  const filtered = CATALOG.jtbds.filter((j) => {
    if (!includePartial && j.partial) return false;
    if (query.archetypeId && j.archetypeId !== query.archetypeId) return false;
    if (query.phaseId && j.phaseId !== query.phaseId) return false;
    if (query.agentTarget) {
      const tag = j.metadata.agentTarget?.split(/[,(]/)[0].trim();
      if (tag !== query.agentTarget) return false;
    }
    if (query.autonomyEnvelope) {
      const tag = j.metadata.autonomyEnvelope?.split(/[,(]/)[0].trim();
      if (tag !== query.autonomyEnvelope) return false;
    }
    if (!q) return true;
    return matchText(j, q);
  });
  return {
    total: CATALOG.jtbds.length,
    matched: filtered.length,
    offset,
    limit,
    jtbds: filtered.slice(offset, offset + limit),
  };
}

function matchText(j: CatalogJtbd, q: string): boolean {
  return (
    j.id.toLowerCase().includes(q) ||
    j.title.toLowerCase().includes(q) ||
    j.when.toLowerCase().includes(q) ||
    j.iWantTo.toLowerCase().includes(q) ||
    j.soICan.toLowerCase().includes(q) ||
    j.archetypeId.toLowerCase().includes(q) ||
    j.archetypeName.toLowerCase().includes(q) ||
    (j.metadata.agentTarget?.toLowerCase().includes(q) ?? false) ||
    (j.metadata.actor?.toLowerCase().includes(q) ?? false)
  );
}

export function findJtbdById(id: string): CatalogJtbd | undefined {
  return CATALOG.jtbds.find((j) => j.id === id);
}

export function findArchetypeById(id: string): CatalogArchetype | undefined {
  return CATALOG.archetypes.find((a) => a.id === id);
}

export function jtbdsForArchetype(id: string): CatalogJtbd[] {
  return CATALOG.jtbds.filter((j) => j.archetypeId === id);
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
  if (!j.when) {
    return `${j.id}: ${j.title}`;
  }
  const periodicEnd = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
  return `When ${stripPunct(j.when)}, I want to ${stripPunct(j.iWantTo)}, so I can ${periodicEnd(j.soICan)}`;
}

function stripPunct(s: string): string {
  return s.replace(/[,;:]\s*$/, "");
}
