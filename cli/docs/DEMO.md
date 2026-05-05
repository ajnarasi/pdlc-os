# pdlc — 60-second demo script

> Goal: show the same skill called three ways — terminal, brain file, dashboard — and get the same signed artifact every time.

**Setup**: terminal split horizontally with the Workbench at `http://localhost:3502/?merchant=A1` open in a browser on the right half.

## 0:00–0:05 — clean slate

```bash
rm -rf ~/.pdlc/brains
pdlc skills
```

> "Six PDLC stages, six PM-OS skill bindings, one v1 registry. Every output is Zod-validated against a stable schema."

## 0:05–0:20 — cached pipeline (the keynote)

```bash
pdlc init --merchant A1 --from demo-pix
pdlc pipeline run --merchant A1 --executor cached
```

> "Six stages, all six Karpathy-PASS, parent-linked. Total time under one second — this is the cached path. Now flip to the browser."

(Reload `?merchant=A1`.) Header chip flips from `· fallback · demo seed` to `· brain · ~/.pdlc/brains/A1.json`. Discovery card shows the canonical Christensen JTBD-A1-3.1-06.

> "Same brain, same audit chain, same hashes — terminal write, dashboard read."

## 0:20–0:35 — audit verify

```bash
pdlc audit verify --merchant A1
```

> "Six entries, parent-link integrity PASS. Every artifact is signed `{stage, agent, eval_score, citations, hash, parent_hashes, timestamp}` — replayable for compliance."

## 0:35–0:50 — live mode (one stage)

```bash
pdlc discovery synthesize --merchant A1 --executor anthropic
```

> "Same skill registry, different executor. The CLI loaded `user-research-synthesis/SKILL.md` from PM-OS as the system prompt, called Sonnet, parsed the Zod schema, signed the result. ~5–10 seconds, ~$0.05."

(Reload the dashboard — the Discovery card now shows the live-generated artifact with a fresh hash.)

## 0:50–1:00 — close

> "PM-OS gave us 41 disconnected skills. PDLC-OS gives us one handoff chain — three surfaces (CLI, brain file, dashboard), one brain, every call signed. Stripe for PM workflows."

---

## Recording with asciinema

```bash
asciinema rec demo.cast --command "bash -c '<paste the script above>'"
asciinema upload demo.cast
```

For a 60-second cap, skip the audit-verify section and inline-narrate.

## Failure recovery during the demo

| Symptom | Fix |
|---|---|
| Header still shows `fallback · demo seed` after CLI run | Reload the page — Next.js page is `force-dynamic` but the browser may cache. |
| `pdlc init` fails: brain already exists | Add `--force`. |
| `--executor anthropic` fails: no API key | `export ANTHROPIC_API_KEY=sk-ant-...` |
| `--executor claude-code` fails: command not found | `which claude` to confirm; or `export PDLC_CLAUDE_BIN=/path/to/claude`. |
| Live executor returns malformed JSON | Re-run; the prompt enforces JSON-only output but Sonnet occasionally adds prose. The parser strips ```json fences and recovers in most cases. |
