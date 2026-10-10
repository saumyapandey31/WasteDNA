import { NextResponse } from "next/server";
import { withStore } from "@/lib/server/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const found = await withStore((s) => { const n = s.interventions.length; s.interventions = s.interventions.filter((x) => x.id !== params.id); return s.interventions.length < n; });
  return found ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Intervention not found." }, { status: 404 });
}
