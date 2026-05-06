import type { Metadata } from "next";
import { VideoPlayer } from "./VideoPlayer";

export const metadata: Metadata = {
  title: "PDLC-OS — Walkthrough",
  description:
    "Two minutes and fifty-seven seconds: one pain point in, one PRD out. Discovery to Support, evidence-locked, end to end.",
  openGraph: {
    title: "PDLC-OS — Walkthrough",
    description:
      "One continuous, evidence-locked agent run from Discovery to Support. Watch the cascade.",
    type: "video.other",
    images: ["/video/pdlc-os-poster.jpg"],
  },
};

const chapters = [
  { i: "I",   title: "The Context",        t: 0,   range: "0:00 — 0:16" },
  { i: "II",  title: "The Thesis",         t: 16,  range: "0:16 — 0:29" },
  { i: "III", title: "Execution Cascade",  t: 29,  range: "0:29 — 0:57" },
  { i: "IV",  title: "Market Velocity",    t: 57,  range: "0:57 — 1:25" },
  { i: "V",   title: "Data Substrate",     t: 85,  range: "1:25 — 1:42" },
  { i: "VI",  title: "Audit & Compliance", t: 102, range: "1:42 — 1:56" },
  { i: "VII", title: "Value Creation",     t: 116, range: "1:56 — 2:57" },
];

export default function VideoPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1180px] px-6 pt-14 pb-24 sm:px-10 sm:pt-20">
        <header className="mb-10 sm:mb-14">
          <p className="eyebrow mb-3">Walkthrough · 2:57</p>
          <h1 className="display text-[clamp(2.4rem,5.6vw,4.6rem)]">
            One pain point in.
            <span className="block italic text-[oklch(46%_0.012_60)]">
              One PRD out.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-[oklch(34%_0.014_60)]">
            PDLC-OS makes the lifecycle one continuous, evidence-locked agent run.
            Six stages, one merchant brain, every artifact signed and verified.
            Watch the cascade — Discovery to Support — built solo in one weekend.
          </p>
        </header>

        <VideoPlayer chapters={chapters} />

        <footer className="mt-16 border-t border-[oklch(86%_0.008_60)] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p
              className="font-mono text-[0.72rem] tracking-wide text-[oklch(46%_0.012_60)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              SHA · 7e3c…b14d · signed · regulator-ready
            </p>
            <a
              href="/"
              className="font-mono text-[0.78rem] text-[oklch(48%_0.13_35)] underline-offset-4 hover:underline"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ← Back to console
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
