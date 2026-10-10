import { NextResponse } from "next/server";
import { campusInsights, contaminationFlows, locationStats, recommendation } from "@/lib/leak-analytics";
import { LOCATIONS } from "@/lib/analysis-core";
import type { Location } from "@/types/waste";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const loc = new URL(req.url).searchParams.get("location");
  const location = LOCATIONS.includes(loc as Location) ? (loc as Location) : undefined;
  return NextResponse.json({ stats: locationStats(), insights: campusInsights(), flows: contaminationFlows(), recommendation: recommendation(location) });
}
