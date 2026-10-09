import type { Location } from "@/types/waste";
import type { LeakStatus, LocationStats, Recommendation } from "@/types/leak";
import { FLOWS, HISTORY, DAYS } from "./mock-history";

const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);
const avg = (a: number[]) => sum(a) / (a.length || 1);

export const statusFor = (score: number, contam: number): LeakStatus =>
  score < 40 || contam >= 55 ? "Hotspot" : score < 60 || contam >= 35 ? "Watch" : "Good";

export function locationStats(): LocationStats[] {
  const raw = HISTORY.map(({ location, records: r }) => {
    const avgScore = Math.round(avg(r.map((x) => x.recoveryScore)));
    const contaminationRate = Math.round(avg(r.map((x) => x.contaminationRate)));
    return {
      location, avgScore, contaminationRate,
      wasteKg: sum(r.map((x) => x.wasteKg)), lostKg: sum(r.map((x) => x.lostKg)),
      contaminatedKg: sum(r.map((x) => (x.wasteKg * x.contaminationRate) / 100)),
      trendDelta: Math.round(avg(r.slice(-7).map((x) => x.recoveryScore)) - avg(r.slice(0, 7).map((x) => x.recoveryScore))),
    };
  });
  const maxLost = Math.max(...raw.map((x) => x.lostKg));
  return raw
    .map((x) => ({ ...x, status: statusFor(x.avgScore, x.contaminationRate),
      severity: Math.round(0.4 * (100 - x.avgScore) + 0.3 * x.contaminationRate + 0.3 * (x.lostKg / maxLost) * 100) }))
    .sort((a, b) => b.severity - a.severity);
}

export function contaminationFlows() {
  const total = sum(FLOWS.map((f) => f.weight));
  return FLOWS.map((f) => ({ ...f, pct: Math.round((f.weight / total) * 100) })).sort((a, b) => b.pct - a.pct);
}

export function campusInsights() {
  const stats = locationStats();
  const totalLostKg = sum(stats.map((s) => s.lostKg));
  const totalWasteKg = sum(stats.map((s) => s.wasteKg));
  const series = Array.from({ length: DAYS }, (_, d) => {
    const day = HISTORY.map((h) => h.records[d]);
    return sum(day.map((r) => r.recoveryScore * r.wasteKg)) / sum(day.map((r) => r.wasteKg));
  });
  const delta = avg(series.slice(-7)) - avg(series.slice(0, 7));
  const groups = new Map<string, number>();
  FLOWS.forEach((f) => groups.set(`${f.material}|${f.source}`, (groups.get(`${f.material}|${f.source}`) || 0) + f.weight));
  const [key, w] = [...groups.entries()].sort((a, b) => b[1] - a[1])[0];
  const [material, source] = key.split("|");
  return {
    totalLostKg, lostSharePct: Math.round((totalLostKg / totalWasteKg) * 100),
    topSource: { label: `${material} from ${source}`, pct: Math.round((w / sum(FLOWS.map((f) => f.weight))) * 100) },
    hotspots: stats.filter((s) => s.status === "Hotspot").length,
    trend: { direction: delta >= 1 ? "improving" : delta <= -1 ? "worsening" : "stable", delta: Math.round(delta * 10) / 10 } as const,
    series,
  };
}

const where = (l: Location) => (l === "Canteen" ? "the cafeteria" : l);

export function recommendation(location?: Location): Recommendation {
  const stats = locationStats();
  const worst = (location && stats.find((s) => s.location === location)) || stats[0];
  const top = contaminationFlows().filter((f) => f.target === worst.location)[0];
  const sharePct = Math.round((worst.contaminatedKg / sum(stats.map((s) => s.contaminatedKg))) * 100);
  const gainRange: [number, number] = [Math.round(worst.contaminationRate * 0.27), Math.round(worst.contaminationRate * 0.37)];
  return {
    location: worst.location, sharePct, source: top.source, material: top.material, gainRange, intervention: `Separate ${top.material.toLowerCase()} at ${where(top.source)}`,
    headline: `${worst.location} ${worst === stats[0] ? "is responsible for the largest share of this contamination" : "contributes to this contamination"} (${sharePct}%). Separating ${top.material.toLowerCase()} at ${where(top.source)} could increase recoverable material by an estimated ${gainRange[0]}–${gainRange[1]}%.`,
    actions: [
      `Place a dedicated ${top.material.toLowerCase()} bin at the exit of ${where(top.source)}`,
      `Add “empty, then recycle” signage where takeaway containers are discarded in ${worst.location}`,
      `Re-scan ${worst.location} weekly with Analyze and track the Recovery Score`,
    ],
    next: stats.filter((s) => s !== worst && s.status !== "Good").map((s) => {
      const f = contaminationFlows().find((x) => x.target === s.location);
      return `${s.location}: ${f ? `reduce ${f.material.toLowerCase()} contamination from ${f.source}` : "monitor weekly"}`;
    }),
  };
}
