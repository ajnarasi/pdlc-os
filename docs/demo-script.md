# PDLC-OS — Five-minute demo script

**Setup**: open `http://localhost:3502` on your demo machine. The Atelier Iguatemi Pix brain loads by default. Have `docs/thesis.md` queued for the closing slide. Loom fallback recorded.

## 0:00–0:30 — Problem

> "Fiserv ships APMs every quarter. Each one runs six stages — Discovery to Support — across disconnected tools. Today, prior-stage evidence rarely survives the handoff. Watch what happens when it does."

## 0:30–1:00 — Stage 1: Discovery

Click into the Discovery card.

> "Brazilian merchant — Pix abandonment. 31 percent of BR traffic bouncing at checkout. Pulled from our Fiserv merchant archetype library. Archetype: LATAM marketplace mid-market. JTBD: instant bank-rail checkout."

Click the **karpathy 93% PASS** badge.

> "Karpathy's Loop ran the rubric, every claim cited a brain artifact, every pain ranked. PASS."

## 1:00–1:45 — Stage 2: Prioritization

Scroll down. The handoff arrow animates between Discovery and Prioritization.

> "Same impact-sizing skill our team uses today. Now seeded automatically from Discovery. RICE 10.2. Driver tree: BR checkout conversion plus 18 to 24 percent. Card decline avoidance plus 8 to 12 percent. GO."

Point at the production-pilot rubric callout.

> "30 percent approval lift, 50 percent dispute reduction, NPS at or above 50. The same metrics ladder we use for every Fiserv-grade pilot. Bound automatically."

## 1:45–2:45 — Stage 3: Design

Scroll into the Design card.

> "This is the 'ISO Assist for ISO 8583/20022' callout in the hackathon brief. Pix DICT to Commerce Hub field map. Seven Tier-1 fields. Three unmappables flagged with mitigations. ISO 20022 pacs.008 envelope rendered."

Point at the unmappable fields.

> "billingAddress dropped — Pix is buyer-anonymous at charge creation. Documented mitigation: capture post-confirmation via Commerce Hub address service. Tax breakdown dropped — BACEN PIX-DICT does not carry it, persisted on CH order for fiscal export only. Line items packed into infoAdicionais. None of this was hallucinated. The Klarna mapping pattern from our brain, applied to Pix in 20 seconds."

## 2:45–3:30 — Stages 4 and 5: Delivery and Launch

Scroll to Delivery.

> "Four Linear-shaped tickets. Twelve Vitest stubs modeled on our existing 239-test SDK pattern. Readiness checklist tied to platform-eng, data-eng, compliance, merchant-success."

Scroll to Launch.

> "Three pilot merchants. Atelier Iguatemi anchor. Success metrics tied directly to the production-pilot rubric. Competitive landscape: Stripe, Adyen, dLocal — each with named gaps. GTM brief drafted."

## 3:30–4:15 — Stage 6: Support, and the loop

Scroll into Support.

> "Triage rules. Risk monitors. And here is the payoff — Stage 6 writes a row into next quarter's Discovery seed. *(point at the green 'Loop closes' callout)* Pilot data after Q3 launch becomes the next LATAM PRD's evidence base. The brain compounds."

Click any audit ribbon entry along the bottom.

> "Every artifact is signed. Provenance: stage, agent, eval score, hash, parent hashes, timestamp. Citations to real files in our brain — Fiserv merchant archetypes, Klarna mapping, StripeConf 2026 synthesis. Click forward and back the chain to replay any decision."

## 4:15–5:00 — Why this matters at Fiserv

Open the Brain pill in the top-right.

> "This is the merchant brain — JSON, append-only, decayable. PM-OS gives you 41 disconnected PM skills. PDLC-OS gives you one handoff chain, with Fiserv-native seed data and a Karpathy-Loop verify badge at every stage."

Switch to `docs/thesis.md` for the closing line.

> "PDLC is not a pipeline. It is a compounding memory system with a regulator-grade audit trail. The PM is the orchestrator. The agents are the workers. The brain is the compound interest."

End with the audit ribbon visible. Take questions.

## What to do if the live demo glitches

Switch to the recorded Loom (90 seconds, same script abbreviated). Show the same audit-ribbon expand at the end. Do not try to debug live.
