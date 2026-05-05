# Brainstorm provocations for the team v2 session

These are sharp, contrarian prompts. The goal is to make the brainstorm productive, not to gather a wishlist. Bring them in this order. Watch what people fail to answer.

## 1. What if Stage 3 (Design) doesn't exist?

What if Design is just a query against the Discovery brain plus the ISO field map?

This forces the team to defend why any stage needs to *generate* vs. *retrieve and diff*. Most stages are not generation problems — they are retrieval problems with thin transforms on top.

## 2. What if the PRD is not a document, but a snapshot view of the merchant brain at time T?

This kills the artifact-centric mental model. The PRD becomes a query, not a deliverable. What changes for our process?

## 3. What artifact would make a Fiserv compliance officer forward our demo to their boss?

This anchors the audit ribbon as the actual product, not a feature. If compliance is the hardest customer in our company, what would they need to see to use this in production?

## 4. If we removed the Karpathy eval gate, what exactly breaks?

Most teammates will struggle. The answer: handoffs silently degrade, hallucinations propagate, the brain rots. This articulates why eval-driven is load-bearing, not decoration.

## 5. Name a merchant decision that should NOT touch all six stages.

Most teammates will fail to name one. The failure converts skeptics — because if every merchant decision spans the lifecycle, then siloed stage-by-stage tooling is structurally wrong.

## 6. Should the brain be per-PM or per-merchant?

What does the Fiserv Brain merchant-second-brain pattern say? This opens the multi-tenant architecture question — and surfaces the real ownership debate (PM tooling vs. merchant data product).

## 7. Stripe ships APMs in days. We ship in quarters.

Which of the six stages costs us the most weeks today, and would PDLC-OS actually compress it — or just instrument the slowness? Forces honest measurement before more building.

---

## Process tip

Run the demo for the first 5 minutes. Then start with provocation 5 ("name a merchant decision that should NOT touch all six stages"). It is the fastest way to convert skeptics. Provocations 1, 2, 3 deepen the architectural argument. Provocations 4, 6, 7 focus the v2 build.

Capture the team's "name a counter-example" answers verbatim — those become the next round of seed data for the brain.
