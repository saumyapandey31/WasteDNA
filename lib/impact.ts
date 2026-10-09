import type { Location } from "@/types/waste";
import type { DailyRecord } from "@/types/leak";
import { HISTORY } from "./mock-history";
import { daysAgo } from "./interventions";

export interface Snapshot { score: number; contam: number; seg: number }
export interface Impact {
  mode: "measured" | "simulated"; before: Snapshot; after: Snapshot; delta: Snapshot;
  series: number[]; projected: number[]; startIdx: number; range: [number, number]; daysTracked: number;
}
const avg = (a: number[]) => a.reduce((s, n) => s + n, 0) / (a.length || 1);
const snap = (r: DailyRecord[]): Snapshot => {
  const contam = Math.round(avg(r.map((x) => x.contaminationRate)));
  return { score: Math.round(avg(r.map((x) => x.recoveryScore))), contam, seg: 100 - contam };
};
const diff = (a: Snapshot, b: Snapshot): Snapshot => ({ score: b.score - a.score, contam: b.contam - a.contam, seg: b.seg - a.seg });

// Segregation Score = share of waste that is NOT contaminated (last 7 days).
export function currentSegregation(): Record<Location, number> {
  return Object.fromEntries(HISTORY.map((h) => [h.location, snap(h.records.slice(-7)).seg])) as Record<Location, number>;
}

/** Measured when at least 4 days of data exist after the start date; otherwise a simulated estimate. */
export function measureImpact(location: Location, startISO: string): Impact {
  const rec = HISTORY.find((h) => h.location === location)!.records;
  const n = rec.length, ago = daysAgo(startISO), series = rec.map((r) => r.recoveryScore);
  if (ago >= 4) {
    const idx = Math.max(3, n - 1 - ago);
    const before = snap(rec.slice(Math.max(0, idx - 7), idx)), after = snap(rec.slice(idx));
    return { mode: "measured", before, after, delta: diff(before, after), series, projected: [], startIdx: idx, range: [0, 0], daysTracked: n - idx };
  }
  const before = snap(rec.slice(-7));
  // Mid-point of the 27–37% uplift used in the WasteLeak recommendation.
  const gain = Math.round(before.contam * 0.32);
  const after: Snapshot = { score: Math.min(95, before.score + gain), contam: before.contam - gain, seg: before.seg + gain };
  const projected = Array.from({ length: 14 }, (_, i) => Math.round(before.score + ((after.score - before.score) * (i + 1)) / 14));
  return { mode: "simulated", before, after, delta: diff(before, after), series, projected, startIdx: n - 1,
    range: [Math.round(before.contam * 0.27), Math.round(before.contam * 0.37)], daysTracked: 0 };
}
