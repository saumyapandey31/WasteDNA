// Shared scoring engine. No browser or Node-only APIs, so it runs on the server, in the browser (mock mode) and in tests.
import type { AnalysisResult, ConfidenceLabel, Engine, Location, Material, MaterialShare, ScoreBand } from "@/types/waste";
import { uid } from "./utils";

export const LOCATIONS: Location[] = ["Hostel A", "Hostel B", "Hostel C", "Canteen", "Academic Block"];
export const MATERIALS: Material[] = ["Plastic", "Paper", "Food Waste", "Metal", "E-waste", "Other"];
export const bandFor = (s: number): ScoreBand => (s >= 70 ? "high" : s >= 40 ? "medium" : "low");
export const scoreMeaning = (b: ScoreBand) =>
  b === "high" ? "Most of this bin can go straight to recycling."
  : b === "medium" ? "Some of this bin is recoverable, but contamination is holding it back."
  : "Most of this bin is currently being lost to contamination.";

// Location profiles are priors. Image signals only nudge them.
type Scenario = { mix: Record<Material, number>; hazards: string[] };
const SCENARIOS: Partial<Record<Location, Scenario>> = {
  Canteen: { mix: { Plastic: 22, Paper: 14, "Food Waste": 46, Metal: 6, "E-waste": 0, Other: 12 }, hazards: ["Oily food residue on paper and plastic"] },
  "Hostel A": { mix: { Plastic: 34, Paper: 26, "Food Waste": 18, Metal: 8, "E-waste": 4, Other: 10 }, hazards: ["Small electronics (batteries or cables) mixed with general waste"] },
  "Hostel B": { mix: { Plastic: 36, Paper: 30, "Food Waste": 10, Metal: 9, "E-waste": 1, Other: 14 }, hazards: [] },
  "Hostel C": { mix: { Plastic: 26, Paper: 16, "Food Waste": 36, Metal: 6, "E-waste": 2, Other: 14 }, hazards: ["Oily food residue on paper and plastic", "Takeaway boxes with leftovers still inside"] },
  "Academic Block": { mix: { Plastic: 24, Paper: 52, "Food Waste": 6, Metal: 5, "E-waste": 3, Other: 10 }, hazards: [] },
};
const DEFAULT = SCENARIOS["Hostel A"]!;

export interface Signal { kind: "warm" | "gray" | "dark" | "none"; boost: number; tiny?: boolean; blurry?: boolean; summary?: string }

function hash(str: string) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function normalize(vals: number[]) {
  const total = vals.reduce((a, b) => a + b, 0) || 1;
  const out = vals.map((v) => Math.round((v / total) * 100));
  out[out.indexOf(Math.max(...out))] += 100 - out.reduce((a, b) => a + b, 0);
  return out;
}

/** Explainable score pipeline: composition -> contamination penalty -> recoverable % -> final score. */
export function breakdown(comp: MaterialShare[]) {
  const p = (m: Material) => comp.find((c) => c.material === m)?.percent ?? 0;
  const plastic = p("Plastic"), paper = p("Paper"), metal = p("Metal"), food = p("Food Waste"), eWaste = p("E-waste");
  const dry = plastic + paper + metal;
  const recoverable = Math.max(0, Math.round(dry - food * 0.45));
  const raw = Math.round(recoverable * 1.1 - food * 0.4 - eWaste * 2);
  return { plastic, paper, metal, food, eWaste, dry, foodPenalty: Math.round(food * 45) / 100, recoverable, raw, score: Math.min(98, Math.max(8, raw)) };
}

export function diagnose(comp: MaterialShare[], band: ScoreBand, location?: Location) {
  const b = breakdown(comp), other = comp.find((c) => c.material === "Other")?.percent ?? 0;
  if (band === "high") return [
    `Main stream: clean recyclables (${b.dry}% plastic, paper and metal) with very little contamination.`,
    "This bin has a high Recovery Score because little food waste or e-waste is mixed in.",
    "Next action: keep the current separation and re-scan weekly to confirm it holds.",
  ].join("\n");
  const food = b.food >= 15, ew = b.eWaste >= 3;
  const main = food ? `Main problem: food waste (${b.food}%) is mixed in with plastic and paper.` : ew ? `Main problem: e-waste (${b.eWaste}%) is mixed in with general waste.` : `Main problem: unsorted mixed material (${other}%) is hard to recover.`;
  const why = `This bin has a ${band} Recovery Score because ${food ? "food waste is contaminating recyclable material." : ew ? "e-waste and other hazardous items are mixed with recyclables." : "unsorted materials reduce what can be recovered."}`;
  const act = food ? (location === "Canteen" || location === "Hostel C" ? "Next action: separate food waste at the cafeteria exit, then re-scan this bin in a week." : "Next action: add a dedicated food-waste bin beside this one, then re-scan in a week.")
    : ew ? "Next action: put a battery and e-waste drop box next to this bin, then re-scan in a week." : "Next action: add clear sorting labels to this bin, then re-scan in a week.";
  return [main, why, act].join("\n");
}

interface BuildOptions {
  fileName: string; fileSize: number; location?: Location; sig: Signal; engine: Engine;
  /** Real model output (external vision API). Skips the location prior and jitter. */
  mix?: Record<Material, number>; hazards?: string[]; confidence?: number;
}

export function buildResult(o: BuildOptions): AnalysisResult {
  const { fileName, fileSize, location, sig } = o;
  const seed = hash(`${fileName}|${fileSize}|${location ?? ""}`), rand = rng(seed);
  const s = (location && SCENARIOS[location]) || DEFAULT;
  const base = o.mix ?? s.mix, hazards = [...(o.hazards ?? s.hazards)];
  const mix = { ...base };
  if (!o.mix) {
    if (sig.kind === "warm") mix["Food Waste"] += sig.boost;
    if (sig.kind === "gray") mix.Paper += sig.boost;
    if (sig.kind === "dark") { mix.Other += sig.boost; hazards.push("Dark, low-contrast photo: hidden residue or mixed contamination is possible"); }
  }
  // Deterministic jitter, maximum ±2 points per material.
  const jittered = MATERIALS.map((m) => Math.max(0, mix[m] + (!o.mix && base[m] ? Math.round((rand() - 0.5) * 4) : 0)));
  const pct = normalize(jittered);
  const composition = MATERIALS.map((material, i) => ({ material, percent: pct[i] }));
  const b = breakdown(composition), band = bandFor(b.score);
  const severe = b.food >= 34 || b.eWaste >= 4, present = hazards.length > 0 || b.food > 25;

  const noLoc = !location, tiny = !!sig.tiny || fileSize < 15 * 1024, huge = fileSize > 12 * 1024 * 1024;
  const conflict = !o.mix && ((sig.kind === "warm" && s.mix["Food Waste"] <= 10) || (sig.kind === "gray" && s.mix.Paper < 15));
  const confidenceScore = o.confidence !== undefined ? Math.round(o.confidence) :
    Math.max(20, Math.min(95, 88 - (noLoc ? 20 : 0) - (conflict ? 22 : 0) - (tiny ? 40 : 0) - (sig.blurry ? 15 : 0) - (huge ? 15 : 0) + ((seed % 5) - 2)));
  const confidenceLabel: ConfidenceLabel = confidenceScore >= 75 ? "High" : confidenceScore >= 50 ? "Medium" : "Low";
  const confidenceFactors = o.mix ? ["Confidence reported by the external vision API"] : [
    noLoc ? "No location selected, so the default profile was used" : "Location profile selected",
    tiny ? "Photo is very small, so quality is likely low" : huge ? "Photo is unusually large" : "Photo size is reasonable",
    sig.blurry ? "Photo looks blurry or flat" : conflict ? "Photo colour disagrees with the location profile" : "No image-quality or colour conflict",
  ];
  const heur = sig.kind === "none" ? "no effect on the mix" : `${sig.kind} tones, +${sig.boost} pts (demo aid only)`;
  return {
    id: uid(), location, analyzedAt: new Date().toISOString(), recoveryScore: b.score, band, composition, recoverablePercent: b.recoverable,
    contamination: { present, level: severe ? "severe" : present ? "moderate" : "none", hazards,
      summary: severe ? "Contamination is reducing what can be recovered. Separate wet and hazardous items at the source." : present ? "Some cross-contamination found." : "No significant contamination or hazards detected." },
    diagnosis: diagnose(composition, band, location), confidenceScore, confidenceLabel, confidenceFactors, engine: o.engine,
    calculationNotes: `Dry recyclables ${b.dry}% − food penalty ${b.foodPenalty} = recoverable ${b.recoverable}%. Score = ${b.recoverable}×1.1 − ${b.food}×0.4 − ${b.eWaste}×2 = ${b.raw}. ${o.mix ? "Composition supplied by an external vision API." : `Image signal: ${heur}.`}${sig.summary ? ` ${sig.summary}.` : ""}`,
  };
}
