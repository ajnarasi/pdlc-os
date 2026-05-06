# PDLC-OS — Investor Overview

> Compounding institutional memory for the product lifecycle. One pain point in, a 9-stage signed brain out, with a paste-ready prototype handoff in the middle.

- **Live app:** https://pdlc-os.vercel.app/
- **Source:** https://github.com/ajnarasi/pdlc-os
- **Lovable proof:** https://grab-nexus-flow.lovable.app/ (generated end-to-end from PDLC-OS Design output)

---

## What it does, and how the archetypes were chosen

PDLC-OS is a 9-stage product lifecycle agent that turns a one-line pain point into a complete merchant brain — Discovery, Prioritization, Design, Delivery, Launch, Support, Marketing, Sales Enablement, and an end-to-end Test Plan — in under two minutes. Each stage is a thin wrapper over a PM-OS skill, runs against the same per-merchant brain, and writes a signed artifact into the audit ribbon.

The archetypes are not invented for this demo. They live in `Fiserv Brain/merchant-research/archetypes/` — twenty-five archetype markdown files, each with YAML frontmatter that fixes the size band, channel, vertical, business model, regulatory overlay, and Karpathy-eval-scored status. Seventeen are `locked` (≥95% rubric score across multiple eval rounds) — A1-A3, B1-B4, E1-E3, F1-F2, I1-I2, M1-M2, P1. Eight are `brainstorm-draft` — D1-D3, H1-H3, L1-L2 — and explicitly marked as such. The pitch demo uses A1 (mid-market fashion D2C) and B1 (SMB full-service restaurant) as the canonical Slice A and Slice B archetypes — they carry the highest pilot-grade evidence.

## How JTBDs are generated, and how pain points map to them

The eight hundred and three jobs-to-be-done are produced by a deterministic markdown parser (`scripts/extract-jtbds.mjs`) that reads each archetype's eleven phase sections (§3.1 Onboarding & integration → §3.11 Renewal / contract events) and extracts each JTBD block in canonical Christensen format — *"When [trigger], I want to [job], so I can [outcome]"* — plus eleven metadata fields per job: trigger, frequency, actor, workaround, success metric, failure mode, failure frequency, agent target, autonomy envelope, source, and priority.

Mapping is encoded in the ID itself. `JTBD-A1-3.1-06` reads as: archetype A1, phase §3.1 (onboarding), 6th job in that phase. The extractor produces `state/jtbd-catalog.json`; that catalog is bundled into the Vercel deploy and validated at runtime — if the Discovery stage emits an archetype ID that isn't in the catalog, the schema rejects it. **No hallucinated archetypes can survive the pipeline.**

When the user enters a pain point, the Discovery stage runs `user-research-synthesis` against the catalog + the pain text, picks the archetype that matches the pain's archetype-fingerprint (size, channel, vertical, regulatory cues), and selects the canonical JTBD for that archetype's relevant phase. The skill iterates the pick if the eval log fails the criteria — the Karpathy-loop pattern: rubric runs, score, refine, re-emit. Each downstream stage extends the brain, never re-derives it; the archetype and JTBD stay locked from Discovery onward.

## The 9-phase lifecycle and the skills invoked at each phase

| # | Stage | PM-OS skills bound | What it produces |
|---|---|---|---|
| 01 | Discovery | `user-research-synthesis` + `journey-map` + `interview-guide` | Archetype + Christensen JTBD + ranked pains + segment evidence |
| 02 | Prioritization | `impact-sizing` + `prioritize` + `define-north-star` | RICE score + driver tree + GO / NO-GO recommendation |
| 03 | Design | `iso-payments` + `enable-apm` + `api-design` + 4 prototype-cluster skills (`prototype`, `napkin-sketch`, `generate-ai-prototype`, `prototype-feedback`) | ISO 20022 envelope + field map + unmappable list + ASCII wireframe + paste-ready Lovable prompt |
| 04 | Delivery | `create-tickets` + `code-first-draft` | Linear-shaped tickets + Vitest stubs + readiness checklist |
| 05 | Launch | `launch-checklist` + `competitor-analysis` + `experiment-metrics` | GTM brief + pilot list + competitive landscape + success metrics |
| 06 | Support | `feature-results` + `retention-analysis` + `weekly-review` | Triage rules + risk monitors + loopback that writes back into next quarter's Discovery seed |
| 07 | Marketing | `marketing-launch` | Positioning + 3 headlines + audience-segmented messages + channel mix + launch sequence + anti-messages |
| 08 | Sales Enablement | `sales-enablement` | ICP + discovery questions + objection handling + 5-step demo script + competitive battlecard + ROI inputs + close ask |
| 09 | E2E Test Plan | `e2e-test-plan` | Critical journeys + regression matrix + edge cases + SLOs + launch blockers + rollback criteria + claims validation |

On every stage, the artifact is validated against a Zod schema, signed with a SHA hash that includes the parent stage's hash, and added to the audit ribbon. A 7-reviewer panel — Executive · Engineer · Designer · UXR Analyst · Customer Voice · Legal Advisor · Skeptic — can be invoked on any stage's artifact on demand and returns a parallel critique with scores and recommendations.

## How leadership should view this

This is not a productivity tool. It is **a compounding institutional-memory layer** for the product lifecycle, with two leadership-grade differentiators that no internal wiki and no off-the-shelf agent has:

1. **Every artifact is signed.** The audit ribbon is a SHA-hash chain that links every claim back to the brain artifact it came from. Compliance and regulator-friendly by default — that's the FinTech-grade moat.
2. **The brain compounds.** Stage 6 (Support) writes an explicit loopback into next quarter's Discovery seed. Each merchant scenario you put through PDLC-OS makes the next one cheaper, faster, and more accurate. The substrate is an asset, not a sunk cost.

The leadership ask is the same on both axes: keep funding the substrate (more archetypes, more JTBDs, more skill bindings), and keep wiring the loopback in. The product compounds on every cycle.

## Technical enablement — datasets and how the JTBD layer is generated

The substrate is generated, not authored. Three files do the heavy lifting:

- **`Fiserv Brain/merchant-research/archetypes/*.md`** — the source of truth. Twenty-five markdown files, each one a locked or draft archetype. YAML frontmatter, eleven phase sections, Christensen JTBD blocks per phase. Each archetype is itself eval-scored under the Karpathy loop with `last_score` and `last_round` recorded.
- **`scripts/extract-jtbds.mjs`** — the deterministic extractor. ~378 lines of Node.js. Reads the wiki, parses phase headers, extracts each JTBD with regex, dedupes table-of-contents references, applies the Christensen blockquote parser, captures the eleven metadata fields, and emits `state/jtbd-catalog.json`. Re-runnable any time the wiki changes.
- **`state/jtbd-catalog.json`** — the bundled artifact. 803 JTBDs, indexed by archetype × phase × agent × autonomy envelope. Bundled into the Vercel deployment; loaded once at server start and used to validate every Discovery output at runtime.

Schema discipline is what keeps the system honest. Every artifact has a Zod schema; every primitive has a coercion path for the cases where the LLM emits the wrong type; every array field is preprocessed to handle the model occasionally returning JSON-stringified arrays. The Anthropic executor uses forced `tool_use` — the schema is the contract, not a suggestion.

## Pain points solved, and the prototype moment

The pain that PDLC-OS solves is the **handoff tax**. Three quarters of every product cycle is spent re-creating context that already exists in some other team's tool. PDLC-OS replaces that with one continuous run, one signed brain, one source of truth.

The prototype moment is where this stops being theoretical. The Design stage now emits a paste-ready prompt for any AI-prototyping tool — v0, Lovable, Bolt, or whatever the team uses. The GrabPay flow at https://grab-nexus-flow.lovable.app/ was generated by pasting the PDLC-OS Design output into Lovable. **No designer in the loop, no Figma round-trip, no requirements doc translation.** The pain point goes in; the working prototype comes out, with the requirements doc, the GTM brief, the QA test plan, and the signed audit chain right next to it.

For the merchant-payments TAM specifically: every new APM addition (Pix, OXXO, Klarna, GrabPay, Boleto, …) currently costs a quarter of cross-functional work. PDLC-OS compresses that to a weekend, with the audit trail already in place for the BACEN / scheme-compliance review. The first integration pays the substrate cost. Every integration after that pays nothing.

---

## The numbers (every claim verifiable from the live deploy)

| Fact | Source |
|---|---|
| 9 PDLC stages (6 canonical + 3 extension) | `lib/types.ts`, `lib/server/schemas.ts` |
| 25 merchant archetypes | `state/jtbd-catalog.json` (live at `/api/jtbds`) |
| 803 JTBDs (725 full + 78 partial) | `state/jtbd-catalog.json` |
| 11 lifecycle phases per archetype | JTBD ID format `JTBD-A1-3.1-06` |
| Christensen format + 11 metadata fields | `scripts/extract-jtbds.mjs:233-260` |
| 17 PM-OS skills bound to stages | `lib/server/skill-registry.ts` |
| 7-perspective panel review | `lib/server/sub-agents.ts:13-21` |
| Signed audit ribbon (SHA + parent_hash chain) | `lib/server/sign.ts` |
| Live Anthropic executor with forced `tool_use` | `lib/server/executors/anthropic.ts` |
| Archetype validation (invented IDs fail hard) | `lib/server/schemas.ts` `KNOWN_ARCHETYPE_IDS` |

## Reuse base — built on assets that already existed

- 41 PM-OS skills (a pre-existing PM operating system)
- 55-APM Checkout SDK with 239 passing tests
- Per-merchant Brain pattern from the Fiserv Brain initiative
- 25 locked merchant archetypes from in-progress merchant research

None of these were authored for this hackathon. PDLC-OS is the agent layer that ties them into one continuous, evidence-locked workflow.
