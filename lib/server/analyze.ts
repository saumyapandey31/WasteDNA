import sharp from "sharp";
import type { AnalysisResult, Location, Material } from "@/types/waste";
import { buildResult, MATERIALS, type Signal } from "../analysis-core";

/** Reads real pixel statistics from the uploaded image with sharp. Throws if the file is not a readable image. */
async function readSignals(buf: Buffer): Promise<Signal> {
  const meta = await sharp(buf, { failOn: "none" }).metadata();
  if (!meta.width || !meta.height) throw new Error("unreadable image");
  const small = await sharp(buf, { failOn: "none" }).rotate().resize(512, 512, { fit: "inside", withoutEnlargement: true }).removeAlpha().png().toBuffer();
  const st = await sharp(small).stats();
  const [r, g, b] = st.channels.slice(0, 3).map((c) => c.mean);
  const contrast = st.channels.slice(0, 3).reduce((a, c) => a + c.stdev, 0) / 3;
  let sharpness = NaN;
  try { // Laplacian edge response: low spread means a blurry or flat photo.
    const lap = await sharp(small).greyscale().convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], scale: 1, offset: 128 }).png().toBuffer();
    sharpness = (await sharp(lap).stats()).channels[0].stdev;
  } catch { /* optional */ }
  const spread = Math.max(r, g, b) - Math.min(r, g, b), bright = (r + g + b) / 3;
  let kind: Signal["kind"] = "none", boost = 0;
  if (r > g * 1.12 && g > b * 1.05 && r > 80) { kind = "warm"; boost = Math.max(1, Math.min(4, Math.round(((r - b) / 120) * 4))); }
  else if (spread < 20 && bright > 140) { kind = "gray"; boost = 3; }
  else if (bright < 70 && spread < 25) { kind = "dark"; boost = 3; }
  const f = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "n/a");
  return {
    kind, boost, tiny: meta.width < 200 || meta.height < 200, blurry: Number.isFinite(sharpness) && sharpness < 3,
    summary: `Server image stats: ${meta.width}×${meta.height}px, avg RGB (${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}), brightness ${f(bright)}, contrast ${f(contrast)}, sharpness ${f(sharpness)}`,
  };
}

const KEYS: Record<string, Material> = { plastic: "Plastic", paper: "Paper", food: "Food Waste", foodwaste: "Food Waste", metal: "Metal", ewaste: "E-waste", electronics: "E-waste", other: "Other" };

/**
 * Optional external vision API. Enabled only when WASTE_VISION_API_URL and WASTE_VISION_API_KEY are set.
 * Contract: POST JSON { image: <base64>, location? } -> { composition: { plastic, paper, food, metal, ewaste, other }, hazards?: string[], confidence?: 0-100 }.
 * Returns null on any problem so the local pipeline always takes over.
 */
async function externalVision(buf: Buffer, fileName: string, location: Location | undefined, sig: Signal): Promise<AnalysisResult | null> {
  const url = process.env.WASTE_VISION_API_URL, key = process.env.WASTE_VISION_API_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ image: buf.toString("base64"), location }), signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const j = (await res.json()) as { composition?: Record<string, number>; hazards?: string[]; confidence?: number };
    if (!j.composition) return null;
    const mix = Object.fromEntries(MATERIALS.map((m) => [m, 0])) as Record<Material, number>;
    for (const [k, v] of Object.entries(j.composition)) { const m = KEYS[k.toLowerCase().replace(/[^a-z]/g, "")]; if (m && Number.isFinite(v)) mix[m] += Math.max(0, v); }
    if (MATERIALS.every((m) => mix[m] === 0)) return null;
    return buildResult({ fileName, fileSize: buf.length, location, sig, engine: "external-vision", mix, hazards: Array.isArray(j.hazards) ? j.hazards.slice(0, 5) : [], confidence: typeof j.confidence === "number" ? Math.min(99, Math.max(1, j.confidence)) : 70 });
  } catch { return null; }
}

export async function analyzeImage(buf: Buffer, fileName: string, location?: Location): Promise<AnalysisResult> {
  const sig = await readSignals(buf);
  return (await externalVision(buf, fileName, location, sig)) ?? buildResult({ fileName, fileSize: buf.length, location, sig, engine: "server-image" });
}
