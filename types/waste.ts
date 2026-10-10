export type Material = "Plastic" | "Paper" | "Food Waste" | "Metal" | "E-waste" | "Other";
export type Location = "Hostel A" | "Hostel B" | "Hostel C" | "Canteen" | "Academic Block";
export type ScoreBand = "high" | "medium" | "low";
export type ConfidenceLabel = "High" | "Medium" | "Low";
export type Engine = "server-image" | "external-vision" | "client-mock";
export interface MaterialShare { material: Material; percent: number }
export interface Contamination { present: boolean; level: "none" | "moderate" | "severe"; hazards: string[]; summary: string }
export interface AnalysisResult {
  id: string; location?: Location; analyzedAt: string;
  recoveryScore: number; band: ScoreBand;
  composition: MaterialShare[]; recoverablePercent: number;
  contamination: Contamination;
  /** Three lines separated by "\n": main problem, why the score is what it is, one next action. */
  diagnosis: string;
  engine?: Engine;
  confidenceScore: number; confidenceLabel: ConfidenceLabel;
  confidenceFactors?: string[];
  calculationNotes?: string;
}
