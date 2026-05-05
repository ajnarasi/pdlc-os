# PDLC-OS · pdlc.dev

**One brain across Discovery to Support, signed.**

A compounding-memory PM operating system for Fiserv. Six PDLC stages, one merchant brain, every artifact signed and verified.

Built for the Fiserv hackathon themed around the Product Development Lifecycle (PDLC) — Discovery → Prioritization → Design → Delivery → Launch → Support.

## The trinity

Same skills, three surfaces, one brain file:

| Surface | What it is | When you use it |
|---|---|---|
| **`pdlc` CLI** ([`cli/`](cli/README.md)) | Stripe-style noun.verb commands. Three executors: cached, anthropic SDK, claude-code shell. | Live demo, scripting, CI integration. |
| **Workbench** (this Next.js app, port 3502) | Visual dashboard reading `~/.pdlc/brains/<merchant>.json`. | Story-mode demo, brainstorm sessions. |
| **PDLC API** *(stretch)* | Hono server exposing the same skill registry over HTTP. | Future: integrate with Linear, Slack, Aha. |

The CLI writes the brain. The Workbench reads it. Both share the v1 skill registry — zero drift by construction.

## Quick start

```bash
# Workbench
cd PDLC-OS
npm install
npm run dev                 # http://localhost:3502

# CLI (in a second terminal)
cd PDLC-OS/cli
npm install
node bin/pdlc.mjs init --merchant A1 --from demo-pix
node bin/pdlc.mjs pipeline run --merchant A1 --executor cached
```

Reload `http://localhost:3502/?merchant=A1` — header chip flips from `fallback · demo seed` to `brain · ~/.pdlc/brains/A1.json`. Same brain, two surfaces.

## Scenario library — 17 merchant archetypes · 628 JTBDs

The Workbench and CLI both ship with the full Fiserv Brain `merchant-research` catalog extracted and indexed. The picker is **archetype-first** — pick the merchant archetype, then drill into JTBDs grouped by PDLC phase, or use the archetype as a high-level seed and let the live executor pick the JTBD.

**Inventory** (verified by parsing `~/Documents/Work/Projects/APM/Fiserv Brain/merchant-research/archetypes/`):

- **17 archetypes**, all `status: locked`, `last_score ≥ 96.4%` — A1, A2, A3, B1–B4, E1–E3, F1–F2, I1–I2, M1–M2, P1
- **628 JTBDs** total (550 with full Christensen + 78 TOC-only entries flagged `partial`)
- Catalog file: [`state/jtbd-catalog.json`](state/jtbd-catalog.json) — regenerate with `npm run extract:jtbds`

**Web (Workbench)**: click **"Browse the scenario library — 17 archetypes · 628 JTBDs →"** in the left sidebar. The modal opens to a **17-card archetype grid** sorted Tier 0 first (Slice A = A1 fashion D2C, Slice B = B1 full-service restaurant emphasized). Each card has:

- **Use archetype** — picks the archetype with no specific JTBD. Pain field gets a synthetic seed; live executor picks/generates the JTBD on the fly.
- **Browse N JTBDs →** — drills into Level 2: archetype profile (full frontmatter — channel, vertical, GPV band, regulatory overlay, brain posture, brand-class) + JTBDs grouped by `§3.1 Onboarding & integration` … `§3.11 Renewal / contract`.

A persistent search bar works at both levels. A "Flatten 628 JTBDs" toggle returns the legacy flat search. An "include partial JTBDs" checkbox surfaces the TOC-only entries.

**CLI**:

```bash
pdlc archetypes list                                       # all 17 with tier/slice/score/JTBD count
pdlc archetypes list --tier 0                              # Slice A + B canonicals only
pdlc archetypes show B1                                    # full profile + phase-grouped JTBD index
pdlc archetypes use B1 --merchant B1 --executor anthropic --auto-init   # archetype-only run

pdlc jtbd stats                                            # 628 / 550 full + 78 partial / 17 archetypes
pdlc jtbd list --archetype A1 --phase 3.1
pdlc jtbd search "fraud vendor onboarding"
pdlc jtbd show JTBD-A1-3.1-04
pdlc jtbd use JTBD-A1-3.1-04 --merchant A1 --executor anthropic --auto-init
```

## What you get out of the box

- **Canonical Christensen JTBD** — Discovery uses the full A1 archetype JTBD-A1-3.1-06 from the Fiserv Brain merchant-research catalog (`When … I want to … so I can …` plus 11 metadata fields).
- **Karpathy-Loop verify gate per stage** — immutable 7-criterion rubric. Green PASS, yellow WARN, red FAIL.
- **Signed audit ribbon** — every artifact `{stage, agent, eval_score, citations[], hash, parent_hashes[], timestamp}`. `pdlc audit verify` replays and confirms parent-link integrity.
- **Three executors** — `cached` for demo safety, `anthropic` for direct Sonnet calls with PM-OS skill markdown as system prompt, `claude-code` for shelling out to your installed Claude Code.
- **Real Fiserv-aligned seed data** — 55-APM coverage matrix, Klarna↔Commerce Hub field mapping (used as Pix DICT template), 3 LATAM merchant archetypes, 239/239 callback sweep results.

## Architecture

| Primitive | Workbench | CLI |
|---|---|---|
| Skill registry | [`lib/skills.ts`](lib/skills.ts) | [`cli/src/lib/skill-registry.ts`](cli/src/lib/skill-registry.ts) |
| Schemas (Zod) | [`lib/types.ts`](lib/types.ts) | [`cli/src/lib/schemas.ts`](cli/src/lib/schemas.ts) |
| Karpathy rubric | [`lib/karpathy-rubric.ts`](lib/karpathy-rubric.ts) | [`cli/src/lib/karpathy.ts`](cli/src/lib/karpathy.ts) |
| Sign + hash | [`lib/sign.ts`](lib/sign.ts) | [`cli/src/lib/sign.ts`](cli/src/lib/sign.ts) |
| Brain storage | reads via [`lib/loadBrain.ts`](lib/loadBrain.ts) | writes via [`cli/src/lib/brain-store.ts`](cli/src/lib/brain-store.ts) |
| Demo seed (Pix→A1) | [`lib/seed/demoPix.ts`](lib/seed/demoPix.ts) | [`cli/src/lib/demo-seed.ts`](cli/src/lib/demo-seed.ts) |

(The duplication is deliberate for v1 — Next.js doesn't support cross-package TS imports without bundler tweaks. Both copies are generated from the same source-of-truth shape, and the schemas are the single contract. v2 will hoist to a shared `packages/schemas`.)

## Demo flow

- 60-second CLI script: [`cli/docs/DEMO.md`](cli/docs/DEMO.md)
- 5-minute Workbench walkthrough: [`docs/demo-script.md`](docs/demo-script.md)

## Thesis

[`docs/thesis.md`](docs/thesis.md) — **BrainStem**: PDLC is not a pipeline. It is a compounding memory system with a regulator-grade signed audit trail.

## Brainstorm

[`docs/brainstorm-provocations.md`](docs/brainstorm-provocations.md) — seven sharp prompts for the v2 team session.

## Tech

Workbench: Next.js 14 · TypeScript · Tailwind · Framer Motion · Recharts · Lucide. Inter + Fraunces + JetBrains Mono. Deep obsidian + electric cyan palette. Reduced-motion respected. Port 3502.

CLI: Node ≥18 · TypeScript · Commander · `@anthropic-ai/sdk` · Zod · kleur · tsx.

## Don't

- Don't run `npm run build` while the dev server is up — it overwrites `.next/` with prod chunks and the dev manifest 404s. Stop the server first.
- Don't commit `~/.pdlc/brains/*.json` — it's user-state, not source.
