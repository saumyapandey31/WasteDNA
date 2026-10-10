import type { Location } from "./waste";
export type LeakStatus = "Hotspot" | "Watch" | "Good";
export interface DailyRecord { day: number; scans: number; recoveryScore: number; contaminationRate: number; wasteKg: number; lostKg: number }
export interface LocationHistory { location: Location; records: DailyRecord[] }
export interface ContaminationFlow { source: Location; target: Location; material: string; weight: number; note: string }
export interface LocationStats {
  location: Location; wasteKg: number; lostKg: number; contaminatedKg: number;
  avgScore: number; contaminationRate: number; trendDelta: number; status: LeakStatus; severity: number;
}
export interface Recommendation {
  location: Location; sharePct: number; source: Location; material: string;
  headline: string; intervention: string; gainRange: [number, number]; actions: string[]; next: string[];
}
export interface Intervention { id: string; location: Location; description: string; startDate: string; createdAt: string }
