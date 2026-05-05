import { NextResponse } from "next/server";
import { findArchetypeById, jtbdsByPhase } from "@/lib/jtbdCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  if (!/^[A-Za-z0-9]{1,8}$/.test(id)) {
    return NextResponse.json({ error: "Invalid archetype id." }, { status: 400 });
  }
  const archetype = findArchetypeById(id);
  if (!archetype) {
    return NextResponse.json({ error: `Archetype '${id}' not found.` }, { status: 404 });
  }
  return NextResponse.json({
    archetype,
    jtbdsByPhase: jtbdsByPhase(id),
  });
}
