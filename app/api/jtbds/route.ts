import { NextResponse } from "next/server";
import { CATALOG, queryJtbds } from "@/lib/jtbdCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includePartialRaw = searchParams.get("includePartial");

  const result = queryJtbds({
    q: searchParams.get("q") ?? undefined,
    archetypeId: searchParams.get("archetype") ?? undefined,
    phaseId: searchParams.get("phase") ?? undefined,
    agentTarget: searchParams.get("agent") ?? undefined,
    autonomyEnvelope: searchParams.get("autonomy") ?? undefined,
    includePartial: includePartialRaw === null ? true : includePartialRaw !== "false",
    limit: parseIntOr(searchParams.get("limit"), 50),
    offset: parseIntOr(searchParams.get("offset"), 0),
  });

  return NextResponse.json({
    ...result,
    archetypes: CATALOG.archetypes,
    index: CATALOG.index,
    catalog: {
      totalJtbds: CATALOG.totalJtbds,
      fullJtbds: CATALOG.fullJtbds,
      partialJtbds: CATALOG.partialJtbds,
      archetypeCount: CATALOG.archetypeCount,
      generatedAt: CATALOG.generatedAt,
    },
  });
}

function parseIntOr(value: string | null, fallback: number): number {
  if (value == null) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}
