---
marp: true
theme: default
class: invert
paginate: true
size: 16:9
---

<!-- _class: lead -->

# PDLC·OS

## Compounding institutional memory for the product lifecycle.

One pain point in. A 9-stage signed brain out. A working prototype in the middle.

> Hackathon submission · 2026-05-06

---

## Where institutional memory goes to die

Every product team runs the same six lifecycle stages. **Discovery → Support.**

Tooling is fragmented. Evidence rarely survives the handoff.

Three quarters in, you're rebuilding context that already exists somewhere in the org.

**The handoff tax is the silent cost in every product org.**

---

## What PDLC·OS is

> One continuous, evidence-locked agent run across **9 stages**. Every artifact signed. The brain compounds with every merchant scenario you put through it.

**Not a wiki. Not a chatbot. A memory system for product orgs.**

`Discovery → Prioritization → Design → Delivery → Launch → Support`
`+ Marketing → Sales Enablement → E2E Test Plan`

---

## Live demo · pain → 9-stage brain in <2 minutes

**Pain point** *Brazilian buyers abandon at checkout — we don't accept Pix*

```
01  Discovery        →  Archetype A1 + Christensen JTBD + ranked pains
02  Prioritization   →  RICE 10.2 · GO recommendation · driver tree
03  Design           →  ISO 20022 envelope + field map + Lovable prompt
04  Delivery         →  4 Linear tickets · 12 Vitest stubs · readiness
05  Launch           →  GTM brief · 3 pilot merchants · success metrics
06  Support          →  triage rules · risk monitors · loopback
07  Marketing        →  positioning · 3 headlines · audience messages
08  Sales Enablement →  ICP · battlecard · ROI inputs · close ask
09  E2E Test Plan    →  4 critical journeys · SLOs · rollback criteria
```

**Live URL** https://pdlc-os.vercel.app/

---

## The Lovable bridge — text to working prototype

The Design stage emits **a paste-ready prompt** for v0 / Lovable / Bolt.

Sixty seconds later, you have a working prototype.

| What goes in | What comes out |
|---|---|
| One pain point | A signed PRD across 9 stages |
| Discovery JTBD | An ASCII napkin sketch |
| Field map + ISO envelope | A paste-ready Lovable prompt |

**Live proof — generated end-to-end from PDLC·OS Design output:**
https://grab-nexus-flow.lovable.app/

*(GrabPay flow. No designer in the loop. No Figma round-trip. No requirements doc translation.)*

---

## The substrate — 25 × 803

| Substrate | Count | Source |
|---|---|---|
| **Merchant archetypes** (locked + draft) | **25** | `Fiserv Brain/merchant-research/archetypes/` |
| **Jobs-to-be-done** (Christensen + 11 metadata fields) | **803** | machine-extracted from the wiki |
| **Lifecycle phases per archetype** (§3.1 onboarding → §3.11 renewal) | **11** | encoded in JTBD ID |
| **PM-OS skills bound to stages** | **17** | `lib/server/skill-registry.ts` |

**Hallucinated archetypes fail validation.** Every artifact traces to a real archetype's real job — or it does not ship.

---

## Architecture · why this is defensible

### Three load-bearing primitives

1. **Schema-enforced agent loop.** Every stage uses Anthropic's forced `tool_use`. The schema is the contract.
2. **Signed audit ribbon.** Every artifact carries `{stage, agent, eval_score, citations[], hash, parent_hashes[], timestamp}`. SHA chain back to Discovery.
3. **7-perspective panel review.** Executive · Engineer · Designer · UXR Analyst · Customer Voice · Legal Advisor · Skeptic — runs on any stage on demand.

**Regulator-ready by default. Compliance-ready by default.**

---

## How leadership should see it

### This is not a productivity tool. It is a category.

**Differentiator 1 — every artifact is signed.**
The audit ribbon is a SHA hash chain. Every claim links to its source. **FinTech-grade compliance moat.**

**Differentiator 2 — the brain compounds.**
Stage 6 (Support) writes back into next quarter's Discovery seed. Every cycle the substrate gets cheaper to leverage.

**The first integration pays the substrate cost. Every integration after that pays nothing.**

---

## Built on what already lived in the brain

| Reuse | Was already built |
|---|---|
| 41 PM-OS skills | Pre-existing PM operating system |
| 55-APM Checkout SDK | 239 passing tests |
| Per-merchant Brain pattern | Fiserv Brain initiative |
| 25 locked merchant archetypes | In-progress merchant research |

**Nothing new for this hackathon.** PDLC·OS is the agent layer that ties them into one continuous, evidence-locked workflow. **Built solo, in one weekend.**

---

<!-- _class: lead -->

## One pain point in. One PRD out.

**Live app** https://pdlc-os.vercel.app/

**Source** https://github.com/ajnarasi/pdlc-os

**Lovable proof** https://grab-nexus-flow.lovable.app/

---

> *The cost of producing a Pix-style integration drops from quarters to a weekend's worth of agent loops. That's the pitch.*
