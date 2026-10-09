"use client";
import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, Recycle, UploadCloud, Stethoscope, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { Card } from "@/components/ui/card";
import { ScoreRing, BAND } from "@/components/score-ring";
import { analyzeWaste, LOCATIONS } from "@/lib/mock-analysis";
import type { AnalysisResult, Location } from "@/types/waste";
import { cn } from "@/lib/utils";

const BAR: Record<string, string> = { Plastic: "#2E7D32", Paper: "#43A047", "Food Waste": "#E65100", Metal: "#66BB6A", "E-waste": "#F9A825", Other: "#9E9E9E" };

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | "">("");
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const pick = useCallback((f?: File) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f); setResult(null);
    setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(f); });
  }, []);

  const run = async () => {
    if (!file) return;
    setLoading(true); setResult(null);
    try { setResult(await analyzeWaste(file, location || undefined)); toast("Analysis complete.", "success"); }
    catch { toast("Analysis failed. Please try another photo.", "error"); }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">Analyze a bin</h1>
      <p className="mt-2 max-w-2xl text-muted">Upload a photo of a waste bin or bag. WasteDNA reads its composition and tells you why material is being lost.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="h-fit">
          <div role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            className={cn("grid min-h-56 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed p-4 text-center transition-colors",
              drag ? "border-accent bg-mist" : "border-line hover:bg-mist/60")}>
            {preview ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt="Uploaded waste bin" className="max-h-64 rounded-lg object-contain" /> : (
              <div className="text-muted"><UploadCloud className="mx-auto h-10 w-10 text-secondary" />
                <p className="mt-2 font-medium text-ink">Drag a photo here or click to upload</p><p className="text-xs">JPG, PNG or WebP</p></div>)}
            <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          <label htmlFor="loc" className="mt-5 block text-sm font-medium">Location (optional)</label>
          <select id="loc" value={location} onChange={(e) => setLocation(e.target.value as Location | "")}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm">
            <option value="">Not specified</option>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <Button onClick={run} disabled={!file || loading} className="mt-5 w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing…</> : "Analyze Waste"}
          </Button>
        </Card>

        <div aria-live="polite">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="grid min-h-80 place-items-center text-center">
                  <div><Loader2 className="mx-auto h-10 w-10 animate-spin text-accent" />
                    <p className="mt-4 font-display text-lg text-primary">Reading the bin’s material profile…</p>
                    <p className="text-sm text-muted">Identifying materials, contamination and hazards</p></div>
                </Card>
              </motion.div>
            )}
            {!loading && !result && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="grid min-h-80 place-items-center text-center text-muted">
                  <p>Upload a photo and select <strong className="text-ink">Analyze Waste</strong> to see the Recovery Score and diagnosis.</p>
                </Card>
              </motion.div>
            )}
            {result && !loading && <Results key={result.id} r={result} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Results({ r }: { r: AnalysisResult }) {
  const b = BAND[r.band];
  const bad = r.contamination.present;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Card className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div><ScoreRing score={r.recoveryScore} band={r.band} /></div>
        <div>
          <p className="text-sm text-muted">Waste Recovery Score{r.location ? ` · ${r.location}` : ""}</p>
          <p className="font-display text-2xl font-bold" style={{ color: b.c }}>{b.label}</p>
          <p className="mt-3 flex items-start gap-2 text-sm"><Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{r.diagnosis}</p>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold text-primary">Material composition</h2>
        <ul className="mt-4 space-y-3">
          {r.composition.map((c, i) => (
            <li key={c.material}>
              <div className="flex justify-between text-sm"><span>{c.material}</span><span className="font-semibold">{c.percent}%</span></div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mist">
                <motion.div className="h-full rounded-full" style={{ background: BAR[c.material] }} initial={{ width: 0 }} animate={{ width: `${c.percent}%` }} transition={{ duration: 0.8, delay: 0.1 * i }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className={cn(bad && "border-warn/50 bg-orange-50")}>
          <h2 className={cn("flex items-center gap-2 font-display text-lg font-semibold", bad ? "text-warn" : "text-primary")}>
            {bad ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}Contamination &amp; hazard risk
          </h2>
          <p className="mt-2 text-sm">{r.contamination.summary}</p>
          {r.contamination.hazards.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-warn">{r.contamination.hazards.map((h) => <li key={h}>{h}</li>)}</ul>}
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary"><Recycle className="h-5 w-5" />Recoverable</h2>
          <p className="mt-2 font-display text-5xl font-bold text-secondary">{r.recoverablePercent}%</p>
          <p className="text-sm text-muted">of this bin can be recycled if separated correctly.</p>
        </Card>
      </div>
      <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm">Next step: trace where this contamination comes from.</p>
        <Link href={r.location ? `/leak?location=${encodeURIComponent(r.location)}` : "/leak"}><Button>Find source of this problem <ArrowRight className="h-4 w-4" /></Button></Link>
      </Card>
    </motion.div>
  );
}
