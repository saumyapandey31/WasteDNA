import { NextResponse } from "next/server";
import { withStore } from "@/lib/server/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const limit = Math.min(100, Math.max(1, Number(q.get("limit")) || 20)), location = q.get("location");
  const analyses = await withStore((s) => s.analyses.filter((a) => !location || a.location === location).slice(0, limit));
  return NextResponse.json({ analyses });
}
export async function DELETE() {
  await withStore((s) => { s.analyses = []; });
  return NextResponse.json({ ok: true });
}
