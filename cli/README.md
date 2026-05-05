# `pdlc` — pdlc.dev CLI

> One brain across Discovery to Support, signed.

A Stripe-style CLI for invoking PM-OS skills across the Product Development Lifecycle.
Six stages → six namespaces. Every call is signed, parent-linked, and replayable.

## Install (local dev)

```bash
cd PDLC-OS/cli
npm install
node bin/pdlc.mjs --help
```

You can symlink the binary onto your `$PATH`:

```bash
ln -s "$(pwd)/bin/pdlc.mjs" /usr/local/bin/pdlc
pdlc --help
```

## Quick start (cached, demo-safe — no API key needed)

```bash
pdlc init --merchant A1 --from demo-pix
pdlc audit verify --merchant A1                       # 6/6 PASS
pdlc brain show --merchant A1
```

That seeds `~/.pdlc/brains/A1.json` with the canonical Pix → A1 demo (full 6-stage Karpathy-PASS chain) and prints the audit ribbon. Open `http://localhost:3502/?merchant=A1` and the Workbench renders the same brain.

## Live mode (real Claude calls)

Two executors are supported. Pick one per call.

### Option A — direct Anthropic SDK

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pdlc init --merchant A2 --name "A2 anchor"
pdlc pipeline run --merchant A2 \
  --pain "MX merchants need OXXO cash voucher acceptance." \
  --executor anthropic \
  --model claude-sonnet-4-6
```

The CLI loads each PM-OS skill markdown (`~/Documents/Work/PM-OS/.claude/skills/<skill>/SKILL.md`) as the system prompt and runs the stage against the merchant brain. Cost: ~$0.05 per stage on Sonnet, ~$0.30 for a full 6-stage run.

### Option B — shell out to Claude Code

```bash
pdlc pipeline run --merchant A2 \
  --pain "MX merchants need OXXO cash voucher acceptance." \
  --executor claude-code
```

Spawns `claude -p --output-format json` for each stage. Uses your locally installed PM-OS skills exactly as Claude Code resolves them. Slower than the SDK adapter (~1s startup × 6 stages) but truer to the "PM-OS skill" runtime.

## Scenario library — 17 archetypes · 628 JTBDs

Pick at two granularities — **merchant archetype** (17, all `status: locked`) or
**specific JTBD** (628 Christensen-format scenarios) — extracted from
`~/Documents/Work/Projects/APM/Fiserv Brain/merchant-research/archetypes/`.

### Archetypes (Level 1)

```bash
pdlc archetypes list                                     # all 17 with tier/slice/score
pdlc archetypes list --tier 0                            # Slice A + B canonicals
pdlc archetypes show B1                                  # full profile + phase-grouped JTBDs
pdlc archetypes use B1 --merchant B1 --auto-init         # archetype-only seed
pdlc archetypes use A1 --merchant A1 --executor anthropic
```

### JTBDs (Level 2)

```bash
pdlc jtbd stats                                          # catalog summary
pdlc jtbd list --archetype A1 --phase 3.1                # filter by axis
pdlc jtbd search "fraud vendor onboarding" --limit 10    # fuzzy search
pdlc jtbd show JTBD-A1-3.1-04                            # full Christensen + metadata
pdlc jtbd use JTBD-B2-3.5-02 --merchant B2 --auto-init   # JTBD pick → run all six stages
pdlc jtbd use JTBD-A1-3.1-04 --merchant A1 --executor anthropic
```

Catalog regen (after merchant-research updates): `npm run extract:jtbds` from
the PDLC-OS root.

## Command reference

```text
pdlc init --merchant <id> [--from demo-pix] [--name <n>] [--pain <p>] [--force]
pdlc skills                                            # list registered skill bindings
pdlc archetypes list | show | use                      # 17-archetype Level-1 picker
pdlc jtbd stats | list | search | show | use           # 628-JTBD Level-2 picker
pdlc brain show   --merchant <id> [--stage <s>] [--json]
pdlc brain path   --merchant <id>
pdlc brain dir
pdlc pipeline run --merchant <id> [--pain <p>] [--executor cached|anthropic|claude-code]
pdlc audit verify --merchant <id>
pdlc audit replay --merchant <id>

# Per-stage verbs (each composes the same handler):
pdlc discovery synthesize       --merchant <id> [--executor ...]
pdlc prioritization size        --merchant <id> [--executor ...]
pdlc design iso-map             --merchant <id> [--executor ...]
pdlc delivery tickets           --merchant <id> [--executor ...]
pdlc launch checklist           --merchant <id> [--executor ...]
pdlc support triage             --merchant <id> [--executor ...]
```

## How it fits the Workbench

The Workbench (`PDLC-OS` Next.js at `:3502`) reads `~/.pdlc/brains/<merchant>.json` on every request. Visit `http://localhost:3502/?merchant=A1` after a CLI run and the dashboard renders the same brain — same JTBD, same audit chain, same hashes.

If the brain file does not exist, the Workbench falls back to its embedded `DEMO_PIX_BRAIN` and the header chip says `· fallback · demo seed`. After `pdlc init`, the chip flips to `· brain · ~/.pdlc/brains/<id>.json`.

## Architecture (one-paragraph)

The CLI's source of truth is the **skill registry** (`src/lib/skill-registry.ts`) — a typed `noun.verb` map binding each PDLC stage to PM-OS skill markdown files, an output Zod schema, and a Karpathy rubric subset. The **executor abstraction** (`src/executors/`) has three adapters: `cached` returns the canonical demo seed deterministically, `anthropic` runs the skill markdown as a system prompt against the Messages API, `claude-code` shells out to `claude -p`. Each invocation flows through `runStage()` which signs the result via FNV1a parent-linked hashing, runs the Karpathy eval gate, and persists the merchant brain to `~/.pdlc/brains/<id>.json`. The Workbench is a downstream reader of the same file — zero drift by construction.

## Environment

| Variable | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Required for `--executor anthropic`. |
| `PDLC_ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Override the default model. |
| `PDLC_ANTHROPIC_MAX_TOKENS` | `4096` | Per-stage output cap. |
| `PDLC_BRAIN_DIR` | `~/.pdlc/brains` | Override storage location. |
| `PMOS_SKILLS_DIR` | (auto-detected) | Override the PM-OS skills root. |
| `PDLC_CLAUDE_BIN` | `claude` | Override the Claude Code binary path. |

## Cost estimate (live mode)

- Sonnet 4.6: ~6K input + ~1.5K output tokens per stage → ~$0.05 / stage → **~$0.30 / pipeline run**
- Haiku 4.5: ~$0.06 / pipeline run (much faster, lower fidelity for the iso-map stage)

For a 5-minute demo doing one cached run + one live run, total spend < $1.

## Roadmap (not in v1)

- `pdlc api serve` — Hono server exposing `/v1/<noun>/<verb>` over HTTP (this is the "Stretch API" agreed on)
- Webhooks: `pdlc webhooks add <url>` fires on every signed write
- Idempotency keys: `--idempotency-key foo` short-circuits duplicate runs
- Multi-merchant brain explorer in the Workbench
