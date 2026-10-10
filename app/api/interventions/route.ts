import { NextResponse } from "next/server";
import { withStore } from "@/lib/server/store";
import { LOCATIONS } from "@/lib/analysis-core";
import { uid } from "@/lib/utils";
import type { Intervention } from "@/types/leak";
import type { Location } from "@/types/waste";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET() {
  return NextResponse.json({ interventions: await withStore((s) => s.interventions) });
}
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { id?: string; location?: string; description?: string; startDate?: string } | null;
  if (!b) return err("Send a JSON body.");
  if (!LOCATIONS.includes(b.location as Location)) return err("Choose a valid location.");
  const description = (b.description ?? "").trim();
  if (description.length < 8 || description.length > 200) return err("Description must be 8–200 characters.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.startDate ?? "") || Number.isNaN(Date.parse(b.startDate!))) return err("startDate must be YYYY-MM-DD.");
  const id = b.id && /^[A-Za-z0-9_-]{6,64}$/.test(b.id) ? b.id : uid();
  const item: Intervention = { id, location: b.location as Location, description, startDate: b.startDate!, createdAt: new Date().toISOString() };
  await withStore((s) => { s.interventions = [item, ...s.interventions.filter((x) => x.id !== id)]; });
  return NextResponse.json({ intervention: item }, { status: 201 });
}
