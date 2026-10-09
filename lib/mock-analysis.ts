import type { AnalysisResult, Location, ScoreBand, Material } from "@/types/waste";
export const LOCATIONS: Location[] = ["Hostel A", "Hostel B", "Hostel C", "Canteen", "Academic Block"];
export const bandFor = (s: number): ScoreBand => (s >= 70 ? "high" : s >= 40 ? "medium" : "low");

// Location-flavoured scenarios so repeat demos feel realistic. Replace with API call later.
const SCENARIOS: Record<string, { mix: Record<Material, number>; hazards: string[]; diagnosis: string }> = {
  Canteen: { mix: { Plastic: 22, Paper: 14, "Food Waste": 46, Metal: 6, "E-waste": 0, Other: 12 }, hazards: ["Oily food residue on paper and plastic"],
    diagnosis: "This bin has a low Recovery Score because food waste is contaminating recyclable material. Greasy wrappers and wet leftovers make otherwise recyclable plastic and paper unusable." },
  "Hostel A": { mix: { Plastic: 34, Paper: 26, "Food Waste": 18, Metal: 8, "E-waste": 4, Other: 10 }, hazards: ["Small electronics (batteries or cables) mixed with general waste"],
    diagnosis: "Recovery is moderate. Most plastic and paper is clean and recoverable, but food scraps and a few e-waste items are mixed in and lower the score." },
  "Academic Block": { mix: { Plastic: 24, Paper: 52, "Food Waste": 6, Metal: 5, "E-waste": 3, Other: 10 }, hazards: [],
    diagnosis: "This bin has a high Recovery Score. It is mostly dry paper and clean plastic with very little contamination, so nearly all of it can go straight to recycling." },
  "Hostel C": { mix: { Plastic: 26, Paper: 16, "Food Waste": 36, Metal: 6, "E-waste": 2, Other: 14 }, hazards: ["Oily food residue on paper and plastic", "Takeaway boxes with leftovers still inside"],
    diagnosis: "This bin has a low Recovery Score because food waste is contaminating recyclable material. Takeaway containers from the cafeteria are arriving with leftovers still inside." },
  "Hostel B": { mix: { Plastic: 36, Paper: 30, "Food Waste": 10, Metal: 9, "E-waste": 1, Other: 14 }, hazards: [],
    diagnosis: "This bin has a high Recovery Score. Plastic and paper are mostly clean and separated, with only a little food waste mixed in." },
};
const DEFAULT = SCENARIOS["Hostel A"];

export async function analyzeWaste(_file: File, location?: Location): Promise<AnalysisResult> {
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
  const s = (location && SCENARIOS[location]) || DEFAULT;
  const jitter = () => Math.round((Math.random() - 0.5) * 4);
  let composition = (Object.keys(s.mix) as Material[]).map((m) => ({ material: m, percent: Math.max(0, s.mix[m] + (s.mix[m] ? jitter() : 0)) }));
  const total = composition.reduce((a, c) => a + c.percent, 0);
  composition = composition.map((c) => ({ ...c, percent: Math.round((c.percent / total) * 100) }));
  const get = (m: Material) => composition.find((c) => c.material === m)!.percent;
  const food = get("Food Waste"), eW = get("E-waste");
  const dry = get("Plastic") + get("Paper") + get("Metal");
  const recoverablePercent = Math.max(0, Math.round(dry - food * 0.45));
  const recoveryScore = Math.min(98, Math.max(8, Math.round(recoverablePercent * 1.1 - food * 0.4 - eW * 2)));
  const severe = food > 35 || eW >= 4;
  return {
    id: crypto.randomUUID(), location, analyzedAt: new Date().toISOString(),
    recoveryScore, band: bandFor(recoveryScore), composition, recoverablePercent,
    contamination: { present: s.hazards.length > 0 || food > 25, level: severe ? "severe" : s.hazards.length || food > 25 ? "moderate" : "none",
      hazards: s.hazards, summary: severe ? "Contamination is reducing what can be recovered. Separate wet and hazardous items at the source." : s.hazards.length || food > 25 ? "Some cross-contamination found." : "No significant contamination or hazards detected." },
    diagnosis: s.diagnosis,
  };
}
