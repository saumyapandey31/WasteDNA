export type Material = "Plastic" | "Paper" | "Food Waste" | "Metal" | "E-waste" | "Other";
export type Location = "Hostel A" | "Hostel B" | "Hostel C" | "Canteen" | "Academic Block";
export type ScoreBand = "high" | "medium" | "low";
export interface MaterialShare { material: Material; percent: number }
export interface Contamination { present: boolean; level: "none" | "moderate" | "severe"; hazards: string[]; summary: string }
export interface AnalysisResult {
  id: string; location?: Location; analyzedAt: string;
  recoveryScore: number; band: ScoreBand;
  composition: MaterialShare[]; recoverablePercent: number;
  contamination: Contamination; diagnosis: string;
}
