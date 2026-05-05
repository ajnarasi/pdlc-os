#!/usr/bin/env node
/**
 * Parses every archetype markdown in
 *   ~/Documents/Work/Projects/APM/Fiserv Brain/merchant-research/archetypes/
 * and emits a single JSON catalog at PDLC-OS/state/jtbd-catalog.json.
 *
 * Format spec lives at
 *   merchant-research/concepts/jtbd-format.md
 *   merchant-research/_templates/jtbd-block.md
 *
 * Per-JTBD shape:
 *   #### JTBD-{archetype}-{section}-{seq}: {title}
 *   > **When** ...
 *   > **I want to** ...
 *   > **so I can** ...
 *   - **Trigger**: ...
 *   - **Frequency**: ...
 *   - ... (more metadata)
 *   **Dataset spec**: (sub-block, optional for the catalog)
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const MERCHANT_RESEARCH = join(
  homedir(),
  "Documents",
  "Work",
  "Projects",
  "APM",
  "Fiserv Brain",
  "merchant-research",
);
const ARCHETYPES_DIR = join(MERCHANT_RESEARCH, "archetypes");
const OUT_PATH = join(ROOT, "..", "state", "jtbd-catalog.json");

const PHASE_LABELS = {
  "3.1": "Onboarding & integration",
  "3.2": "Go-live",
  "3.3": "Daily operations",
  "3.4": "Checkout",
  "3.5": "Disputes & chargebacks",
  "3.6": "Settlement & reconciliation",
  "3.7": "Refunds & returns",
  "3.8": "Reporting & analytics",
  "3.9": "Growth events",
  "3.10": "Crisis events",
  "3.11": "Renewal / contract events",
};

function readArchetypeFiles() {
  return readdirSync(ARCHETYPES_DIR)
    .filter((f) => f.startsWith("archetype-") && f.endsWith(".md"))
    .map((f) => ({
      filename: f,
      path: join(ARCHETYPES_DIR, f),
      raw: readFileSync(join(ARCHETYPES_DIR, f), "utf8"),
    }));
}

function parseFrontmatter(raw) {
  const match = /^---\s*\n([\s\S]*?)\n---/.exec(raw);
  if (!match) return {};
  const body = match[1];
  const fm = {};
  // Top-level keys only — `^([A-Za-z_]...):` (nested keys are indented and skipped).
  // Inline arrays `[a, b]`, quoted strings, bare scalars, plus a tolerant
  // multi-line array form ([a,\n  b,\n  c]).
  const lines = body.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1];
    let value = m[2].trim();

    // Multi-line inline array — opens with `[` but does not close on this line.
    if (value.startsWith("[") && !value.endsWith("]")) {
      let buf = value;
      i += 1;
      while (i < lines.length && !buf.includes("]")) {
        buf += ` ${lines[i].trim()}`;
        i += 1;
      }
      value = buf;
    } else {
      i += 1;
    }

    // Strip YAML inline comments ` # ...` — but not `#` inside a quoted string.
    // Hackathon-grade: walk the string, track quote state, cut at first
    // unquoted ` #` we see.
    value = stripInlineComment(value);

    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, ""))
        .filter(Boolean);
    } else if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    if (value !== "" && value !== undefined) fm[key] = value;
  }
  return fm;
}

function parseNumber(value) {
  if (value == null) return null;
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function stripInlineComment(value) {
  let inDouble = false;
  let inSingle = false;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === "#" && !inDouble && !inSingle && (i === 0 || /\s/.test(value[i - 1]))) {
      return value.slice(0, i).trim();
    }
  }
  return value;
}

function extractBrandClass(raw) {
  // Pattern: `**Brand-class example**: <text>` or `**Brand-class examples**: <text>` in §1.
  const m = /\*\*Brand-class examples?\*\*:\s*([^\n]+)/.exec(raw);
  if (m) return m[1].trim().replace(/[*_]/g, "");
  // Fallback: TLDR line if present.
  const tldr = /^TLDR:\s*([^\n]+)/m.exec(raw);
  return tldr ? tldr[1].trim() : null;
}

function archetypeIdFromFilename(filename) {
  const m = /^archetype-([A-Z][0-9]+)-/.exec(filename);
  return m ? m[1] : "unknown";
}

function extractJtbds(file) {
  const fm = parseFrontmatter(file.raw);
  const archetypeId = fm.archetype_id ?? archetypeIdFromFilename(file.filename);
  const archetypeName = fm.archetype_name ?? archetypeId;

  // Pattern: #### JTBD-{archetype}-{section}-{seq}: {title} ... up to next #### or ###
  const headingRe = /^#### (JTBD-[A-Z0-9]+-[0-9]+\.[0-9]+-[0-9]+):\s*(.+)$/gm;
  const lines = file.raw.split("\n");
  const headingPositions = [];
  let m;
  const fileText = file.raw;
  while ((m = headingRe.exec(fileText)) !== null) {
    headingPositions.push({
      id: m[1],
      title: m[2].trim(),
      start: m.index,
      end: -1,
    });
  }
  // Determine block end = next #### heading OR next "## " section
  for (let i = 0; i < headingPositions.length; i += 1) {
    const next = headingPositions[i + 1];
    headingPositions[i].end = next ? next.start : fileText.length;
  }

  const out = new Map();
  for (const block of headingPositions) {
    const body = fileText.slice(block.start, block.end);
    const parsed = parseBlock(body);
    const merged = {
      id: block.id,
      archetypeId,
      archetypeName,
      ...parseSection(block.id),
      title: block.title,
      when: parsed?.when ?? "",
      iWantTo: parsed?.iWantTo ?? "",
      soICan: parsed?.soICan ?? "",
      metadata: parsed?.metadata ?? {},
      partial: !parsed,
      sourceFile: file.filename,
    };
    // Dedupe — keep the entry with the richer body (full Christensen wins over TOC).
    const existing = out.get(block.id);
    if (
      !existing ||
      (!merged.partial && existing.partial) ||
      (merged.when.length > existing.when.length)
    ) {
      out.set(block.id, merged);
    }
  }
  return Array.from(out.values());
}

function parseSection(id) {
  // JTBD-A1-3.1-04 → section "3.1", seq 4
  const m = /^JTBD-[A-Z0-9]+-([0-9]+\.[0-9]+)-([0-9]+)$/.exec(id);
  if (!m) return { phaseId: "", phaseLabel: "", seq: 0 };
  const phaseId = m[1];
  return {
    phaseId,
    phaseLabel: PHASE_LABELS[phaseId] ?? "",
    seq: Number.parseInt(m[2], 10),
  };
}

function parseBlock(body) {
  // Christensen blockquote: contiguous lines starting with "> "
  const blockquoteMatch = /(?:^>\s.*\n?)+/m.exec(body);
  if (!blockquoteMatch) return null;
  const blockquote = blockquoteMatch[0]
    .split("\n")
    .map((l) => l.replace(/^>\s?/, ""))
    .join(" ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // The blockquote should contain "When ... I want to ... so I can ..."
  // Note: some have "I want to" replaced by "I'd like to" — handle both.
  const cw = /When\s+(.*?)\s+(?:I want to|I'd like to|I would like to)\s+(.*?)\s+so I can\s+(.*?)\.?\s*$/i.exec(blockquote);
  if (!cw) {
    // Skip blocks that don't follow Christensen (TOC-only entries).
    return null;
  }

  const meta = parseMetadata(body);
  return {
    when: cw[1].trim(),
    iWantTo: cw[2].trim(),
    soICan: cw[3].trim(),
    metadata: meta,
  };
}

const META_KEYS = [
  ["trigger", /^- \*\*Trigger\*\*:\s*(.+)$/m],
  ["frequency", /^- \*\*Frequency\*\*:\s*(.+)$/m],
  ["actor", /^- \*\*Actor\*\*:\s*(.+)$/m],
  ["workaround", /^- \*\*Current workaround\*\*:\s*(.+)$/m],
  ["successMetric", /^- \*\*Success metric\*\*:\s*(.+)$/m],
  ["failureMode", /^- \*\*Failure mode\*\*:\s*(.+)$/m],
  ["failureFrequency", /^- \*\*Frequency of failure today\*\*:\s*(.+)$/m],
  ["agentTarget", /^- \*\*Agent target\*\*:\s*(.+)$/m],
  ["autonomyEnvelope", /^- \*\*Autonomy envelope\*\*:\s*(.+)$/m],
  ["source", /^- \*\*Source\*\*:\s*(.+)$/m],
  ["priority", /^- \*\*Priority\*\*:\s*(.+)$/m],
];

function parseMetadata(body) {
  const out = {};
  for (const [key, re] of META_KEYS) {
    const m = re.exec(body);
    if (m) out[key] = m[1].trim();
  }
  return out;
}

function buildIndex(catalog) {
  const archetypes = new Map();
  const phases = new Map();
  const agents = new Map();
  const autonomies = new Map();
  for (const j of catalog) {
    archetypes.set(j.archetypeId, (archetypes.get(j.archetypeId) ?? 0) + 1);
    phases.set(j.phaseId, (phases.get(j.phaseId) ?? 0) + 1);
    if (j.metadata.agentTarget) {
      const tag = j.metadata.agentTarget.split(/[,(]/)[0].trim();
      agents.set(tag, (agents.get(tag) ?? 0) + 1);
    }
    if (j.metadata.autonomyEnvelope) {
      const tag = j.metadata.autonomyEnvelope.split(/[,(]/)[0].trim();
      autonomies.set(tag, (autonomies.get(tag) ?? 0) + 1);
    }
  }
  return {
    archetypes: Object.fromEntries([...archetypes.entries()].sort()),
    phases: Object.fromEntries(
      [...phases.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    ),
    agents: Object.fromEntries(
      [...agents.entries()].sort((a, b) => b[1] - a[1]),
    ),
    autonomies: Object.fromEntries(
      [...autonomies.entries()].sort((a, b) => b[1] - a[1]),
    ),
  };
}

function main() {
  const files = readArchetypeFiles();
  const allJtbds = [];
  for (const f of files) {
    const jtbds = extractJtbds(f);
    allJtbds.push(...jtbds);
  }
  // Sort: archetype, phase, seq
  allJtbds.sort((a, b) => {
    if (a.archetypeId !== b.archetypeId)
      return a.archetypeId.localeCompare(b.archetypeId);
    if (a.phaseId !== b.phaseId) return a.phaseId.localeCompare(b.phaseId);
    return a.seq - b.seq;
  });

  const index = buildIndex(allJtbds);
  const archetypeMeta = files.map((f) => {
    const fm = parseFrontmatter(f.raw);
    const id = fm.archetype_id ?? archetypeIdFromFilename(f.filename);
    const myJtbds = allJtbds.filter((j) => j.archetypeId === id);
    const fullJtbdCount = myJtbds.filter((j) => !j.partial).length;
    const p0Count = myJtbds.filter((j) =>
      /^P0/.test(j.metadata.priority ?? ""),
    ).length;
    return {
      id,
      name: fm.archetype_name ?? id,
      tier: fm.tier != null ? Number.parseInt(String(fm.tier), 10) : null,
      mvpSlice: fm.mvp_slice ?? null,
      status: fm.status ?? null,
      lastScore: parseNumber(fm.last_score),
      lastRound: fm.last_round != null ? Number.parseInt(String(fm.last_round), 10) : null,
      brainPosture: fm.brain_posture ?? null,
      size: fm.size ?? null,
      gpvBand: fm.gpv_band ?? null,
      channel: fm.channel ?? [],
      vertical: fm.vertical ?? [],
      businessModel: fm.business_model ?? [],
      integrationModes: fm.integration_modes ?? [],
      regulatoryOverlay: fm.regulatory_overlay ?? [],
      brandClass: extractBrandClass(f.raw),
      jtbdCount: myJtbds.length,
      fullJtbdCount,
      p0JtbdCount: p0Count,
      sourceFile: f.filename,
    };
  });

  // Sort archetypes: tier 0 first, then by id.
  archetypeMeta.sort((a, b) => {
    const aT = a.tier ?? 99;
    const bT = b.tier ?? 99;
    if (aT !== bT) return aT - bT;
    return a.id.localeCompare(b.id);
  });

  const fullCount = allJtbds.filter((j) => !j.partial).length;
  const partialCount = allJtbds.length - fullCount;
  const out = {
    generatedAt: new Date().toISOString(),
    totalJtbds: allJtbds.length,
    fullJtbds: fullCount,
    partialJtbds: partialCount,
    archetypeCount: archetypeMeta.length,
    archetypes: archetypeMeta,
    index,
    jtbds: allJtbds,
  };
  writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(
    `wrote ${out.totalJtbds} JTBDs across ${out.archetypeCount} archetypes → ${OUT_PATH}`,
  );
  console.log("counts by archetype:", index.archetypes);
  console.log("counts by phase:", index.phases);
}

main();
