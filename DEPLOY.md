# Deploying PDLC-OS to Vercel

A complete runbook for shipping the live LLM-powered version (Path B). The CLI
package (`cli/`) stays local-only; only the Next.js app under `PDLC-OS/` ships.

## Prerequisites

- A GitHub account
- A Vercel account (free tier works for the demo; **Pro tier required for
  `maxDuration > 60s`** — live runs hit ~30–60s, so the free tier may time out
  mid-pipeline)
- An Anthropic API key (rotate the leaked one if you haven't already:
  https://console.anthropic.com/settings/keys)

---

## 1 — Stage the repo

From `PDLC-OS/`:

```bash
# Make sure the catalog and skill markdown bundle are current.
npm run extract:jtbds         # → state/jtbd-catalog.json
npm run sync:skills           # → lib/server/skill-md/{name}.md (× 17)

# Confirm production build is green.
npm run build                 # must end with "✓ Generating static pages"

# Initialize git if it isn't already.
git init
git add -A
git commit -m "PDLC-OS — live demo, archetype-first picker, in-process executor"
```

What the commit MUST include (the deployed surface):

```
app/                          # Next.js routes + API
components/                   # all UI
lib/                          # incl. lib/server/* and lib/seed/demoPix.ts
lib/server/skill-md/          # bundled PM-OS skill markdown (× 17)
state/jtbd-catalog.json       # 628-JTBD catalog data
scripts/                      # extract-jtbds.mjs + sync-skills.mjs (build-time)
public/                       # if any
package.json + package-lock.json
next.config.mjs
tailwind.config.ts
postcss.config.mjs
tsconfig.json
.env.example
.gitignore
README.md
DEPLOY.md
docs/
```

What the commit MUST NOT include (already in `.gitignore`):

```
node_modules/                 # Vercel installs from package-lock.json
.next/                        # build artifact
.env, .env.local              # secrets
.pdlc/                        # local brain storage
cli/node_modules/             # CLI's own deps; CLI itself can be excluded
```

`cli/` itself does ship into the GitHub repo (so anyone cloning gets the local
CLI too), but Vercel ignores it for the build because there's no `package.json`
at `cli/` referenced from the deployed Next app.

---

## 2 — Push to GitHub

Either via `gh` CLI:

```bash
gh repo create pdlc-os --public --source=. --remote=origin --push
```

…or manually:

1. Create a new repo at https://github.com/new — name it `pdlc-os`.
2. `git remote add origin git@github.com:<you>/pdlc-os.git`
3. `git branch -M main && git push -u origin main`

---

## 3 — Provision Vercel KV (brain storage)

Vercel KV is the persistent key-value store the live executor needs. Without
it, every serverless function invocation starts with an empty filesystem and
loses brain state between requests.

1. https://vercel.com/dashboard → **Storage** → **Create Database** → **KV**.
2. Name it `pdlc-os-kv`. Pick the region nearest your users (default fine).
3. After creation, click **`.env.local`** in the KV dashboard — note that you
   do NOT need to copy these locally; the next step links them automatically.

---

## 4 — Create the Vercel project

1. Vercel dashboard → **Add New…** → **Project**.
2. Import the `pdlc-os` GitHub repo.
3. **Framework preset**: Next.js (auto-detected).
4. **Root directory**: leave default (the repo root).
5. **Environment Variables** — add the following before clicking Deploy:

   | Name | Value | Environments |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | your rotated `sk-ant-api03-…` key | Production + Preview |
   | `PDLC_ANTHROPIC_MODEL` | `claude-sonnet-4-6` | All (optional) |

   The KV variables (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`,
   `KV_REST_API_READ_ONLY_TOKEN`) get injected automatically when you complete
   step 5.

6. **Deploy**.

---

## 5 — Connect the KV database to the project

1. After the first deploy completes: Project → **Storage** tab → **Connect
   Database** → pick `pdlc-os-kv` → **Connect**.
2. Vercel will auto-add the four `KV_*` env vars to Production + Preview +
   Development.
3. **Redeploy** the project (Project → Deployments → ⋯ → Redeploy) so the new
   env vars take effect.

---

## 6 — Smoke test the live deployment

Open your Vercel URL (e.g. `https://pdlc-os.vercel.app/?merchant=A1`).

Expected:

- Header: `PDLC·OS · one brain across Discovery to Support` + gear icon
- Sidebar: archetype picker + executor switcher with **Cached demo** and
  **Live · Anthropic**
- Pre-baked Pix demo loads (`fallback-demo` source)

Run a cached pipeline:

1. Click **Browse the scenario library** → pick any archetype → **Use archetype**
2. Click **Run all six stages**
3. Watch the audit ribbon populate to 6 entries

Run a live pipeline (real Anthropic call, ~$0.30 per run):

1. Settings (gear icon) → **Anthropic SDK** → save (server env key takes
   precedence; the modal field is optional)
2. Pick another archetype → **Run all six stages**
3. ~30–60 seconds; brain refreshes via polling

If you want to gate live runs behind per-user API keys (BYOK), leave
`ANTHROPIC_API_KEY` unset in Vercel and require users to paste their own in
Settings. The current code already supports both modes.

---

## 7 — Common deployment gotchas

| Symptom | Fix |
|---|---|
| `Function execution timed out` on live runs | You're on Vercel free tier (10s limit). Upgrade to Pro for the 300s limit `app/api/pipeline/run/route.ts` requests. |
| Live runs return `ANTHROPIC_API_KEY missing` | Either set the env var (steps 4–5) or paste a key in Settings. |
| Live runs return `Bundled skill markdown not found` | You forgot to commit `lib/server/skill-md/`. Re-run `npm run sync:skills` and push. |
| Brain doesn't persist between requests | KV not connected. Step 5 above. Confirm in Vercel logs that requests show `source: "kv"`, not `"fallback-demo"`. |
| `npm install` fails on Vercel | You're missing `package-lock.json` in the commit. Vercel needs it. |
| Build error: `state/jtbd-catalog.json: not found` | Run `npm run extract:jtbds` locally and commit the output. |
| Header still shows old "BrainStem · evidence-locked" eyebrow | Cache. Vercel → Deployments → trigger a redeploy with **Use existing Build Cache: NO**. |

---

## 8 — Rotating the API key after deployment

```bash
# 1. Generate a new key at https://console.anthropic.com/settings/keys
# 2. In Vercel: Project Settings → Environment Variables
# 3. Edit ANTHROPIC_API_KEY → paste new value → Save
# 4. Redeploy: Deployments → ⋯ → Redeploy
# 5. Delete the old key in the Anthropic console
```

The key never appears in the GitHub repo. The browser never sees it (it's
read server-side only).

---

## 9 — Cost estimate per month

For a hackathon demo at modest traffic:

- **Vercel Pro** (required for `maxDuration > 60s`): $20/mo
- **Vercel KV** (Hobby): free up to 30K commands/month, 256 MB. Plenty for this.
- **Anthropic**: ~$0.30 per live pipeline run (Sonnet 4.6, 6 stages × ~6K
  in/1.5K out tokens). 100 demo runs ≈ $30. Cached runs are free.

Total for moderate use: ~$50–80/mo. If you only need cached demo (no live LLM),
you can stay on Vercel Hobby for free.

---

## 10 — Architecture notes (for future-you)

- The deployed app does NOT spawn the CLI as a subprocess. The
  `cli/` package only matters in local development.
- The executor runs in-process inside the Next.js serverless function at
  `app/api/pipeline/run/route.ts`.
- Brain state lives in Vercel KV under keys `pdlc:brain:{merchantId}`.
- Skill markdown is bundled into the deployment from `lib/server/skill-md/`.
- The 628-JTBD catalog is bundled from `state/jtbd-catalog.json`.
- The merchant-research source folder (`Fiserv Brain/merchant-research/`) is
  NOT shipped — it's the input to local extractors only.
- `claude-code` executor is intentionally absent on the web (serverless can't
  spawn the local Claude binary).

If you later move PM-OS skills around or update merchant-research, re-run the
two scripts locally and push the regenerated artifacts:

```bash
npm run sync:skills && npm run extract:jtbds
git add lib/server/skill-md state/jtbd-catalog.json
git commit -m "Refresh skill bundle + JTBD catalog"
git push                 # Vercel auto-deploys
```
