import type { Location } from "@/types/waste";
import type { ContaminationFlow, LocationHistory } from "@/types/leak";
import { LOCATIONS } from "./analysis-core";

export const DAYS = 30;
// score/contam: 30-day mean; kg: daily waste; dry: recyclable share of waste; slope: score change per day.
// Profiles mirror the Analyze scenarios (Canteen = food-heavy/low, Academic Block = clean paper/high).
const PROFILES: Record<Location, { score: number; contam: number; kg: number; dry: number; slope: number }> = {
  "Hostel A": { score: 49, contam: 41, kg: 70, dry: 0.68, slope: 0 },
  "Hostel B": { score: 66, contam: 27, kg: 65, dry: 0.7, slope: 0.12 },
  "Hostel C": { score: 27, contam: 68, kg: 95, dry: 0.7, slope: -0.35 },
  Canteen: { score: 22, contam: 63, kg: 80, dry: 0.42, slope: -0.08 },
  "Academic Block": { score: 77, contam: 14, kg: 45, dry: 0.78, slope: 0.08 },
};

// Seeded PRNG so server and client render identical data (no hydration mismatch).
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (n: number) => Math.min(100, Math.max(0, n));

export const HISTORY: LocationHistory[] = LOCATIONS.map((location, li) => {
  const p = PROFILES[location];
  const rand = rng(1000 + li * 97);
  const records = Array.from({ length: DAYS }, (_, d) => {
    const drift = p.slope * (d - DAYS / 2);
    const step = location === "Hostel B" && d >= 15 ? 1 : 0; // seeded BinCheck intervention started 14 days ago
    const recoveryScore = Math.round(clamp(p.score + drift + step * 9 + (rand() - 0.5) * 8));
    const contaminationRate = Math.round(clamp(p.contam - drift * 1.2 - step * 11 + (rand() - 0.5) * 10));
    const wasteKg = Math.round(p.kg * (0.88 + rand() * 0.24));
    const lostKg = Math.round(wasteKg * p.dry * (1 - recoveryScore / 100));
    return { day: d + 1, scans: Math.round(6 + rand() * 10), recoveryScore, contaminationRate, wasteKg, lostKg };
  });
  return { location, records };
});

// Where contamination originates vs. where it lands. Weights sum to 100.
export const FLOWS: ContaminationFlow[] = [
  { source: "Canteen", target: "Hostel C", material: "Food waste", weight: 31, note: "Takeaway boxes with leftovers dumped into hostel recycling" },
  { source: "Canteen", target: "Canteen", material: "Food waste", weight: 22, note: "Oily wrappers and wet leftovers mixed with plastic and paper" },
  { source: "Hostel A", target: "Hostel A", material: "Food waste", weight: 14, note: "Mess leftovers bagged with dry recyclables" },
  { source: "Hostel C", target: "Hostel C", material: "Food waste", weight: 13, note: "Room-level food scraps in shared dry bins" },
  { source: "Hostel A", target: "Hostel A", material: "E-waste", weight: 9, note: "Batteries and cables in general waste" },
  { source: "Hostel B", target: "Hostel B", material: "Food waste", weight: 6, note: "Occasional snack leftovers" },
  { source: "Academic Block", target: "Academic Block", material: "Other", weight: 5, note: "Mixed-material packaging" },
];
