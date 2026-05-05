import { cn } from "@/lib/cn";

type ChipTone = "neutral" | "accent" | "growth" | "alert" | "muted";

const toneMap: Record<ChipTone, string> = {
  neutral: "bg-paperAlt text-ink border-rule",
  accent: "bg-accentSoft text-accent border-accent/30",
  growth: "bg-growthSoft text-growth border-growth/30",
  alert: "bg-alertSoft text-alert border-alert/30",
  muted: "bg-transparent text-inkMuted border-rule",
};

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[0.72rem] font-medium",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
