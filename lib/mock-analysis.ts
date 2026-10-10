import type { AnalysisResult, Location } from "@/types/waste";
import { buildResult, type Signal } from "./analysis-core";
import { API_MODE } from "./config";
export { LOCATIONS, bandFor, scoreMeaning, breakdown } from "./analysis-core";

/** Browser-only colour sample used in mock mode (NEXT_PUBLIC_ANALYSIS_MODE=mock) or when the API is unreachable. Demo aid only. */
async function colorHeuristic(file: File): Promise<Signal> {
  try {
    if (typeof createImageBitmap !== "function") return { kind: "none", boost: 0 };
    const bmp = await createImageBitmap(file);
    const c = document.createElement("canvas"); c.width = c.height = 16;
    const ctx = c.getContext("2d");
    if (!ctx) return { kind: "none", boost: 0 };
    ctx.drawImage(bmp, 0, 0, 16, 16); bmp.close?.();
    const d = ctx.getImageData(0, 0, 16, 16).data; let r = 0, g = 0, b = 0; const n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    r /= n; g /= n; b /= n;
    if (r > g * 1.12 && g > b * 1.05 && r > 80) return { kind: "warm", boost: Math.max(1, Math.min(4, Math.round(((r - b) / 120) * 4))) };
    if (Math.max(r, g, b) - Math.min(r, g, b) < 20 && (r + g + b) / 3 > 140) return { kind: "gray", boost: 3 };
  } catch { /* optional */ }
  return { kind: "none", boost: 0 };
}

async function mockAnalyze(file: File, location?: Location): Promise<AnalysisResult> {
  const [sig] = await Promise.all([colorHeuristic(file), new Promise((r) => setTimeout(r, 1800))]);
  return buildResult({ fileName: file.name, fileSize: file.size, location, sig, engine: "client-mock" });
}

/** Posts the photo to /api/analyze. Falls back to the browser mock only if the API cannot be reached. */
export async function analyzeWaste(file: File, location?: Location): Promise<AnalysisResult> {
  if (!API_MODE) return mockAnalyze(file, location);
  const minWait = new Promise((r) => setTimeout(r, 1200));
  let res: Response;
  try {
    const fd = new FormData(); fd.append("file", file); if (location) fd.append("location", location);
    res = await fetch("/api/analyze", { method: "POST", body: fd });
  } catch { return mockAnalyze(file, location); }
  if (res.status === 404) return mockAnalyze(file, location);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? "Analysis failed. Please try another photo.");
  await minWait;
  return body as AnalysisResult;
}
