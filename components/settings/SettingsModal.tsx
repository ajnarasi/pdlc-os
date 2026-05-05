"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, KeyRound, ShieldAlert, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  ANTHROPIC_MODELS,
  clearSettings,
  maskKey,
  readSettings,
  writeSettings,
  type Executor,
  type PdlcSettings,
} from "@/lib/settings";
import { Chip } from "@/components/ui/Chip";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onChange?: (settings: PdlcSettings) => void;
}

const EXECUTOR_OPTIONS: { id: Executor; label: string; sub: string }[] = [
  {
    id: "cached",
    label: "Cached",
    sub: "Canonical Pix→A1 fixture · zero network · demo-safe",
  },
  {
    id: "anthropic",
    label: "Anthropic SDK",
    sub: "Direct Messages API call with PM-OS skill markdown · ~$0.30/run",
  },
];

export function SettingsModal({ open, onClose, onChange }: SettingsModalProps) {
  const [settings, setSettings] = useState<PdlcSettings>({ executor: "cached" });
  const [showKey, setShowKey] = useState(false);
  const [pristineKey, setPristineKey] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      const next = readSettings();
      setSettings(next);
      setPristineKey(next.apiKey);
    }
  }, [open]);

  function update<K extends keyof PdlcSettings>(key: K, value: PdlcSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function save() {
    writeSettings(settings);
    onChange?.(settings);
    onClose();
  }

  function clearAll() {
    clearSettings();
    setSettings({ executor: "cached" });
    setPristineKey(undefined);
    onChange?.({ executor: "cached" });
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center bg-paper/70 px-4 py-12 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-lg border border-rule bg-paper shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
              <div>
                <div className="eyebrow text-inkFaint">Settings</div>
                <h2 className="mt-1 font-display text-2xl tracking-tight">
                  Executor &amp; credentials
                </h2>
                <p className="mt-1 text-xs text-inkMuted">
                  Stored in this tab&apos;s <span className="font-mono">sessionStorage</span> and cleared when you close it.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 text-inkMuted hover:bg-paperAlt hover:text-ink"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-6 px-6 py-6">
              <section>
                <div className="eyebrow mb-2 text-inkFaint">Executor</div>
                <div className="space-y-2">
                  {EXECUTOR_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                        settings.executor === opt.id
                          ? "border-accent/60 bg-accentSoft/40"
                          : "border-rule bg-paperAlt/40 hover:border-accent/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="executor"
                        value={opt.id}
                        checked={settings.executor === opt.id}
                        onChange={() => update("executor", opt.id)}
                        className="mt-1 accent-accent"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-ink">{opt.label}</div>
                        <div className="text-xs text-inkMuted">{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {settings.executor === "anthropic" ? (
                <section className="space-y-2">
                  <div className="eyebrow text-inkFaint">Anthropic API key</div>
                  <div className="rounded-md border border-rule bg-paperAlt/40 p-3">
                    <div className="flex items-start gap-2 text-xs text-inkMuted">
                      <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                      <p>
                        Your key is sent to <span className="font-mono">localhost</span>, never persisted to disk on this machine, and never shared with anyone else. It lives in this browser tab&apos;s <span className="font-mono">sessionStorage</span> until you close the tab. <span className="text-ink">Do not use this on a shared computer.</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-inkFaint" />
                    <input
                      type={showKey ? "text" : "password"}
                      placeholder="sk-ant-api03-…"
                      value={settings.apiKey ?? ""}
                      onChange={(e) => update("apiKey", e.target.value || undefined)}
                      className="flex-1 rounded-md border border-rule bg-paper/60 px-3 py-2 font-mono text-xs text-ink placeholder:text-inkFaint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="rounded-md border border-rule p-2 text-inkMuted hover:border-accent/30 hover:text-ink"
                      aria-label={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {pristineKey ? (
                    <div className="text-[0.7rem] text-inkFaint">
                      Currently saved: <span className="font-mono">{maskKey(pristineKey)}</span>
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <div className="eyebrow mb-2 text-inkFaint">Model</div>
                    <select
                      value={settings.model ?? "claude-sonnet-4-6"}
                      onChange={(e) => update("model", e.target.value)}
                      className="w-full rounded-md border border-rule bg-paper/60 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                    >
                      {ANTHROPIC_MODELS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>
              ) : null}

              {settings.executor === "cached" ? (
                <section>
                  <div className="rounded-md border border-rule bg-paperAlt/40 p-3 text-xs text-inkMuted">
                    Returns the canonical Pix → A1 demo seed verbatim. Zero network. The merchant id and pain text are persisted on the brain wrapper, but the artifacts inside are the fixture. Use <span className="font-mono">anthropic</span> to generate live merchant-specific artifacts.
                  </div>
                </section>
              ) : null}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-rule bg-paperAlt/40 px-6 py-3">
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-md border border-rule px-3 py-1.5 text-xs text-inkMuted hover:border-alert/40 hover:text-alert"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear saved key
              </button>
              <div className="flex items-center gap-2">
                <Chip tone="muted">
                  <span className="font-mono">sessionStorage</span>
                </Chip>
                <button
                  type="button"
                  onClick={save}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-paper transition-transform hover:translate-y-[-1px]"
                >
                  Save
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
