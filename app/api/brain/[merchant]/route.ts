import { NextResponse } from "next/server";
import { loadBrain } from "@/lib/server/brain-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { merchant: string } },
) {
  const merchantId = params.merchant;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(merchantId)) {
    return NextResponse.json(
      { error: "Invalid merchant id." },
      { status: 400 },
    );
  }
  const { brain, source, path } = await loadBrain(merchantId);
  return NextResponse.json({ brain, source, path });
}
