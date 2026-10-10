"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, Copy, Download, History as HistoryIcon, ImageOff, Loader2, Recycle, Stethoscope, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreRing, BAND } from "@/components/score-ring";
import { ConfidenceBadge } from "@/components/confidence-badge";
import { useToast } from "@/components/toast";
import { analyzeWaste, breakdown, LOCATIONS, scoreMeaning } from "@/lib/mock-analysis";
import { clearAllHistory, fetchHistory, saveToHistory, type HistoryEntry } from "@/lib/history";
import { copyText, downloadText, summaryText } from "@/lib/export";
import type { AnalysisResult, Location } from "@/types/waste";
import { cn } from "@/lib/utils";

const BAR: Record<string, string> = { Plastic: "#2E7D32", Paper: "#43A047", "Food Waste": "#E65100", Metal: "#66BB6A", "E-waste": "#F9A825", Other: "#9E9E9E" };
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function AnalyzeInner() {
  const toast = useToast();
  const sp = useSearchParams(), initial = sp.get("location");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | "">(LOCATIONS.includes(initial as Location) ? (initial as Location) : "");
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { fetchHistory().then(setHistory); }, []);

  const pick = useCallback((f?: File) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setPhotoError("Please choose a JPEG, PNG or WebP image."); toast("Unsupported file type.", "error"); return; }
    if (f.size > 8 * 1024 * 1024) { setPhotoError("This image is larger than 8 MB. Choose a smaller one."); toast("Image is too large.", "error"); return; }
    setPhotoError(null); setFile(f); setResult(null); setError(null);
    setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(f); });
  }, [toast]);

  const analyze = async () => {
    if (!file) { setPhotoError("Select a photo to analyze."); return; }
    setLoading(true); setResult(null); setError(null);
    try { const r = await analyzeWaste(file, location || undefined); setResult(r); saveToHistory(r); setHistory(await fetchHistory()); toast("Analysis complete.", "success"); }
    catch (e) { setError(e instanceof Error ? e.message : "We could not read this photo. Try another image."); toast("Analysis failed.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">Analyze a bin</h1>
      <p className="mt-2 max-w-2xl text-muted">Upload a photo of a waste bin or bag. WasteDNA estimates its composition and tells you why material is being lost.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <form onSubmit={(e) => { e.preventDefault(); analyze(); }}>
          <Card className="h-fit">
            <div role="button" tabIndex={0} aria-label="Upload a photo" onClick={() => input.current?.click()} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), input.current?.click())}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
              className={cn("grid min-h-56 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed p-4 text-center transition-colors", drag ? "border-accent bg-mist" : "border-line hover:bg-mist/60")}>
              {preview ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt="Uploaded waste bin" className="max-h-64 rounded-lg object-contain" /> : (
                <div className="text-muted"><UploadCloud className="mx-auto h-10 w-10 text-secondary" />
                  <p className="mt-2 font-medium text-ink">Drag a photo here or click to upload</p><p className="text-xs">JPG, PNG or WebP</p></div>)}
              <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            </div>
            {photoError && <p role="alert" className="mt-2 flex items-center gap-1 text-xs text-warn"><ImageOff className="h-3.5 w-3.5" />{photoError}</p>}
            <label htmlFor="loc" className="mt-5 block text-sm font-medium">Location (optional, improves confidence)</label>
            <select id="loc" value={location} onChange={(e) => setLocation(e.target.value as Location | "")} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm">
              <option value="">Not specified</option>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
            <Button type="submit" disabled={!file || loading} className="mt-5 w-full">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing…</> : "Analyze Waste"}</Button>
            {!file && !loading && <p className="mt-2 text-center text-xs text-muted">Select a photo to begin.</p>}
          </Card>
        </form>

        <div id="results" aria-live="polite" className="scroll-mt-24">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="grid min-h-80 place-items-center text-center"><div><Loader2 className="mx-auto h-10 w-10 animate-spin text-accent" />
                  <p className="mt-4 font-display text-lg font-bold text-primary">Estimating the bin’s material profile…</p><p className="text-sm text-muted">Composition, contamination and hazards</p></div></Card>
              </motion.div>)}
            {!loading && error && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="grid min-h-80 place-items-center border-warn/40 text-center"><div><AlertTriangle className="mx-auto h-10 w-10 text-warn" />
                  <p className="mt-3 font-display text-lg font-bold text-warn">Analysis failed</p><p className="mt-1 text-sm text-muted">{error}</p><Button onClick={analyze} className="mt-4">Try again</Button></div></Card>
              </motion.div>)}
            {!loading && !error && !result && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="grid min-h-80 place-items-center text-center text-muted"><div><UploadCloud className="mx-auto h-10 w-10 text-secondary" />
                  <p className="mt-3 max-w-xs">{file ? <>Photo ready. Select <strong className="text-ink">Analyze Waste</strong> to see the Recovery Score.</> : <>No photo yet. Upload one to see the Recovery Score, contamination and diagnosis.</>}</p></div></Card>
              </motion.div>)}
            {result && !loading && !error && <Results key={result.id} r={result} />}
          </AnimatePresence>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-primary"><HistoryIcon className="h-5 w-5" />Recent analyses</h2>
          {history.length > 0 && <button onClick={() => { clearAllHistory(); setHistory([]); toast("History cleared.", "info"); }} className="flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"><Trash2 className="h-4 w-4" />Clear history</button>}
        </div>
        {history.length === 0 ? (
          <Card className="mt-4 text-center text-sm text-muted">No analyses yet. Your last 10 results appear here so you can reopen them.</Card>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {history.map((h) => (
              <li key={h.id}><button onClick={() => { setResult(h.result); setError(null); toast(`Reopened analysis from ${when(h.analyzedAt)}.`, "info"); document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }); }}
                className="w-full rounded-xl border border-line bg-white p-4 text-left shadow-soft transition-colors hover:bg-mist">
                <div className="flex items-center justify-between gap-2"><span className="font-semibold">{h.location ?? "No location"}</span>
                  <span className="font-display text-xl font-bold" style={{ color: BAND[h.result.band].c }}>{h.recoveryScore}</span></div>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{h.summary}</p>
                <div className="mt-2 flex items-center justify-between"><ConfidenceBadge label={h.confidenceLabel} /><span className="text-xs text-muted">{when(h.analyzedAt)}</span></div>
              </button></li>))}
          </ul>)}
      </section>
    </div>
  );
}

function Results({ r }: { r: AnalysisResult }) {
  const toast = useToast(), b = breakdown(r.composition), band = BAND[r.band], bad = r.contamination.present;
  const lines = r.diagnosis.split("\n");
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-6">
      <Card className="grid min-h-[15rem] items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div><ScoreRing score={r.recoveryScore} band={r.band} /></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Waste Recovery Score{r.location ? ` · ${r.location}` : ""}</p>
          <p className="font-display text-2xl font-bold" style={{ color: band.c }}>{band.label}</p>
          <div className="mt-1"><ConfidenceBadge label={r.confidenceLabel} score={r.confidenceScore} /></div>
          <p className="mt-2 text-sm text-muted">{scoreMeaning(r.band)}</p>
          <div className="mt-3 space-y-1.5 text-sm">{lines.map((l, i) => <p key={i} className="flex items-start gap-2">{i === 0 && <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />}<span className={i === 0 ? "" : "pl-6"}>{l}</span></p>)}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="px-4 py-2" onClick={async () => toast((await copyText(r.diagnosis)) ? "Diagnosis copied." : "Copy failed. Select the text manually.", "info")}><Copy className="h-4 w-4" />Copy diagnosis</Button>
            <Button variant="outline" className="px-4 py-2" onClick={() => { downloadText(`wastedna-${(r.location ?? "bin").replace(/\s+/g, "-").toLowerCase()}-${r.analyzedAt.slice(0, 10)}.txt`, summaryText(r)); toast("Summary downloaded.", "success"); }}><Download className="h-4 w-4" />Download summary</Button>
          </div>
        </div>
      </Card>

      <details className="group rounded-2xl border border-line bg-white p-5 shadow-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-primary">How this score was calculated<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          <li><strong>Composition.</strong> Dry recyclables = plastic {b.plastic}% + paper {b.paper}% + metal {b.metal}% = {b.dry}%.</li>
          <li><strong>Contamination penalty.</strong> Food waste {b.food}% × 0.45 = −{b.foodPenalty} pts, so recoverable = {b.recoverable}%.</li>
          <li><strong>Final score.</strong> {b.recoverable} × 1.1 − {b.food} × 0.4 − {b.eWaste} × 2 = {b.raw}, kept between 8 and 98: <strong>{r.recoveryScore}</strong>.</li>
        </ol>
        {r.calculationNotes && <p className="mt-4 rounded-lg bg-mist px-3 py-2 text-xs text-muted">{r.calculationNotes}</p>}
        {r.confidenceFactors && <><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Confidence factors</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{r.confidenceFactors.map((f) => <li key={f}>{f}</li>)}</ul></>}
      </details>

      <Card>
        <h2 className="font-display text-lg font-bold text-primary">Material composition</h2>
        <ul className="mt-4 space-y-3">{r.composition.map((c, i) => (
          <li key={c.material}><div className="flex justify-between text-sm"><span>{c.material}</span><span className="font-semibold">{c.percent}%</span></div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mist"><motion.div className="h-full rounded-full" style={{ background: BAR[c.material] }} initial={{ width: 0 }} animate={{ width: `${c.percent}%` }} transition={{ duration: 0.7, delay: 0.08 * i }} /></div></li>))}</ul>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className={cn("min-h-[9rem]", bad && "border-warn/50 bg-orange-50")}>
          <h2 className={cn("flex items-center gap-2 font-display text-lg font-bold", bad ? "text-warn" : "text-primary")}>{bad ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}Contamination &amp; hazard risk</h2>
          <p className="mt-2 text-sm">{r.contamination.summary}</p>
          {r.contamination.hazards.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-warn">{r.contamination.hazards.map((h) => <li key={h}>{h}</li>)}</ul>}
        </Card>
        <Card className="min-h-[9rem]">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary"><Recycle className="h-5 w-5" />Recoverable</h2>
          <p className="mt-2 font-display text-5xl font-bold text-secondary">{r.recoverablePercent}%</p>
          <p className="text-sm text-muted">of this bin can be recycled if separated correctly.</p>
        </Card>
      </div>

      <p className="rounded-xl bg-mist px-4 py-3 text-xs text-muted">{r.engine === "external-vision" ? "Analyzed by your configured external vision API. Confidence comes from that service. " : `Prototype analysis (${r.engine === "client-mock" ? "browser demo mode" : "server-side image statistics"}): a location profile combined with simple image color and sharpness measurements, not a trained vision model. `}{r.engine !== "external-vision" && "Color heuristic is a demo aid only. Location profile is the main driver. Replace with a real vision model for production."}</p>

      <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm">Next step: trace where this contamination comes from.</p>
        <Link href={r.location ? `/leak?location=${encodeURIComponent(r.location)}` : "/leak"}><Button>Find source of this problem <ArrowRight className="h-4 w-4" /></Button></Link>
      </Card>
    </motion.div>
  );
}

export default function AnalyzePage() {
  return <Suspense fallback={<div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>}><AnalyzeInner /></Suspense>;
}
