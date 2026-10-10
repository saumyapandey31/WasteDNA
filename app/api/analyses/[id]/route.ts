import { NextResponse } from "next/server";
import { withStore } from "@/lib/server/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const a = await withStore((s) => s.analyses.find((x) => x.id === params.id));
  return a ? NextResponse.json(a) : NextResponse.json({ error: "Analysis not found." }, { status: 404 });
}
