"use client";

import { useEffect, useRef } from "react";

interface Chapter {
  i: string;
  title: string;
  t: number;
  range: string;
}

interface VideoConsoleProps {
  chapters: Chapter[];
}

export function VideoPlayer({ chapters }: VideoConsoleProps) {
  const ref = useRef<HTMLVideoElement>(null);

  // Honor #t-XX hash on first load so chapter deep-links work.
  useEffect(() => {
    const m = window.location.hash.match(/^#t-(\d+)$/);
    if (m && ref.current) {
      ref.current.currentTime = Number(m[1]);
    }
  }, []);

  function seek(t: number) {
    const v = ref.current;
    if (!v) return;
    v.currentTime = t;
    v.play().catch(() => {});
    v.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <figure className="overflow-hidden rounded-xl border border-[oklch(86%_0.008_60)] bg-black shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
        <video
          ref={ref}
          controls
          playsInline
          preload="metadata"
          poster="/video/pdlc-os-poster.jpg"
          className="block aspect-video w-full"
        >
          <source src="/video/pdlc-os.mp4" type="video/mp4" />
          Sorry, your browser does not support embedded video.
        </video>
      </figure>

      <section className="mt-12">
        <p className="eyebrow mb-4">Chapters</p>
        <ol className="grid grid-cols-1 gap-x-10 gap-y-1.5 sm:grid-cols-2">
          {chapters.map((c) => (
            <li key={c.i}>
              <a
                href={`#t-${c.t}`}
                onClick={(e) => {
                  e.preventDefault();
                  history.replaceState(null, "", `#t-${c.t}`);
                  seek(c.t);
                }}
                className="group flex items-baseline gap-4 border-t border-[oklch(86%_0.008_60)] py-3 transition-colors hover:bg-[oklch(98%_0.012_75)]"
              >
                <span
                  className="font-mono text-[0.78rem] tabular-nums text-[oklch(46%_0.012_60)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {c.i.padStart(3, " ")}
                </span>
                <span className="display flex-1 text-[1.25rem] leading-tight text-[oklch(22%_0.014_60)] group-hover:text-[oklch(48%_0.13_35)]">
                  {c.title}
                </span>
                <span
                  className="font-mono text-[0.78rem] tabular-nums text-[oklch(46%_0.012_60)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {c.range}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
