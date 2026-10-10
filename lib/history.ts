import type { AnalysisResult, ConfidenceLabel, Location } from "@/types/waste";
import { API_MODE } from "./config";
export interface HistoryEntry { id: string; location?: Location; recoveryScore: number; confidenceLabel: ConfidenceLabel; analyzedAt: string; summary: string; result: AnalysisResult }
const KEY = "wastedna:analysis-history", MAX = 10;
const toEntry = (r: AnalysisResult): HistoryEntry => ({ id: r.id, location: r.location, recoveryScore: r.recoveryScore, confidenceLabel: r.confidenceLabel, analyzedAt: r.analyzedAt, summary: r.diagnosis.split("\n")[0], result: r });

export function loadHistory(): HistoryEntry[] {
  try { const raw = localStorage.getItem(KEY); const p = raw ? (JSON.parse(raw) as HistoryEntry[]) : []; return Array.isArray(p) ? p.slice(0, MAX) : []; } catch { return []; }
}
/** Local cache, also the offline fallback. */
export function saveToHistory(r: AnalysisResult): HistoryEntry[] {
  const next = [toEntry(r), ...loadHistory().filter((e) => e.id !== r.id)].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}
/** Recent analyses from GET /api/analyses, falling back to the local cache. */
export async function fetchHistory(): Promise<HistoryEntry[]> {
  if (API_MODE) {
    try { const r = await fetch(`/api/analyses?limit=${MAX}`); if (r.ok) return ((await r.json()) as { analyses: AnalysisResult[] }).analyses.map(toEntry); } catch { /* use local */ }
  }
  return loadHistory();
}
export async function clearAllHistory() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  if (API_MODE) { try { await fetch("/api/analyses", { method: "DELETE" }); } catch { /* ignore */ } }
}
