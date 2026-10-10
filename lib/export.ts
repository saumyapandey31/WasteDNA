import type { AnalysisResult } from "@/types/waste";
import type { Impact } from "./impact";
const stamp = (iso: string) => new Date(iso).toLocaleString("en-GB");
export function summaryText(r: AnalysisResult) {
  return [
    "WasteDNA analysis summary", `Location: ${r.location ?? "Not specified"}`, `Analyzed: ${stamp(r.analyzedAt)}`, "",
    `Recovery Score: ${r.recoveryScore}/100 (${r.band})`, `Confidence: ${r.confidenceLabel} (${r.confidenceScore})`, `Recoverable: ${r.recoverablePercent}%`,
    `Composition: ${r.composition.map((c) => `${c.material} ${c.percent}%`).join(", ")}`,
    `Contamination: ${r.contamination.level}${r.contamination.hazards.length ? ` (${r.contamination.hazards.join("; ")})` : ""}`, "", "Diagnosis:", r.diagnosis, "",
    `Calculation: ${r.calculationNotes ?? "n/a"}`, "Note: prototype simulation. Results come from a location profile, not real computer vision.",
  ].join("\n");
}
export function impactSummaryText(i: Impact, location: string, description: string, start: string) {
  const row = (l: string, b: number, a: number, u = "") => `${l}: ${b}${u} -> ${a}${u} (${a - b >= 0 ? "+" : ""}${a - b}${u})`;
  return ["BinCheck before/after summary", `Location: ${location}`, `Intervention: ${description}`, `Start date: ${start}`,
    `Result type: ${i.mode === "measured" ? `MEASURED over ${i.daysTracked} days` : "SIMULATED estimate"}`, "",
    row("Recovery Score", i.before.score, i.after.score), row("Contamination rate", i.before.contam, i.after.contam, "%"), row("Segregation Score", i.before.seg, i.after.seg),
    ...(i.mode === "simulated" ? ["", `Estimated uplift range: ${i.range[0]}–${i.range[1]}% more recoverable material.`] : [])].join("\n");
}
export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; } catch { return false; }
  }
}
