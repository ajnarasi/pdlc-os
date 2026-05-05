#!/usr/bin/env bash
# Pre-warm Vercel KV with full 9-stage runs for the demo merchants.
#
# Usage:
#   ANTHROPIC_API_KEY=sk-ant-... \
#   PDLC_BASE=https://pdlc-os.vercel.app \
#     ./scripts/prewarm-kv.sh A1 B1 M2
#
# Each merchant takes ~45-90s (9 stages × 5-10s/stage). Run sequentially
# so we don't trip Vercel concurrency or Anthropic rate limits.
#
# Pre-requisites:
#   - Vercel deploy is green and ANTHROPIC_API_KEY is set in Vercel env
#     (this script also sends apiKey in the body for safety; remove if you
#      want to rely solely on the server-side env var).
set -euo pipefail

BASE="${PDLC_BASE:-https://pdlc-os.vercel.app}"
KEY="${ANTHROPIC_API_KEY:-}"
MODEL="${PDLC_MODEL:-claude-sonnet-4-6}"

if [[ -z "$KEY" ]]; then
  echo "ANTHROPIC_API_KEY env var is required." >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <merchantId> [<merchantId> ...]" >&2
  echo "Example: $0 A1 B1 M2" >&2
  exit 2
fi

STAGES=(
  discovery
  prioritization
  design
  delivery
  launch
  support
  marketing
  sales-enablement
  e2e-test-plan
)

declare -A SEED_PAIN
SEED_PAIN[A1]="Brazilian buyers abandon at checkout — we don't accept Pix."
SEED_PAIN[B1]="Sit-down restaurants in Texas need OXXO cash voucher acceptance for tourist traffic."
SEED_PAIN[M2]="Marketplace-enabled DACH retailer wants Klarna BNPL for high-AOV cart cohorts."

for MERCHANT in "$@"; do
  PAIN="${SEED_PAIN[$MERCHANT]:-Add a regional APM for $MERCHANT — pick the highest-leverage JTBD this quarter.}"
  echo "── pre-warming $MERCHANT ──"
  echo "  pain: $PAIN"

  echo "  init…"
  curl -fsS -X POST "$BASE/api/pipeline/init" \
    -H "content-type: application/json" \
    -d "$(jq -nc --arg m "$MERCHANT" --arg p "$PAIN" '{merchantId:$m, painPoint:$p}')" \
    > /dev/null

  for STAGE in "${STAGES[@]}"; do
    START=$(date +%s)
    echo -n "  stage $STAGE … "
    curl -fsS -X POST "$BASE/api/pipeline/stage/$STAGE" \
      -H "content-type: application/json" \
      -d "$(jq -nc \
            --arg m "$MERCHANT" \
            --arg k "$KEY" \
            --arg model "$MODEL" \
            '{merchantId:$m, executor:"anthropic", apiKey:$k, model:$model}')" \
      > /dev/null
    END=$(date +%s)
    echo "ok ($((END - START))s)"
  done
  echo "✓ $MERCHANT pre-warmed at $BASE/?merchant=$MERCHANT"
  echo
done

echo "Done. Open the dashboard:"
for MERCHANT in "$@"; do
  echo "  $BASE/?merchant=$MERCHANT"
done
