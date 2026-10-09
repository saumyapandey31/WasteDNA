"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreRing, BAND } from "@/components/score-ring";
import { ImpactView, StatusBadge } from "@/components/impact";
import { DEMO_RESULT as R } from "@/lib/demo";
import { contaminationFlows, locationStats, recommendation } from "@/lib/leak-analytics";
import { measureImpact } from "@/lib/impact";
import { todayISO } from "@/lib/interventions";

const STEPS = ["Upload photo", "AI analysis", "Recovery Score", "Detect contamination", "Identify hotspot", "Recommend", "Measure improvement"];
const BAR: Record<string, string> = { Plastic: "#2E7D32", Paper: "#43A047", "Food Waste": "#E65100", Metal: "#66BB6A", "E-waste": "#F9A825", Other: "#9E9E9E" };
const Title = ({ n, t, d }: { n: number; t: string; d: string }) => (<div className="mb-5"><p className="text-xs font-semibold uppercase tracking-wide text-secondary">Step {n}</p><h2 className="font-display text-2xl font-bold text-primary">{t}</h2><p className="mt-1 text-muted">{d}</p></div>);

function Upload() {
  return (
    <div><Title n={1} t="Upload a photo of the bin" d="A student scans the shared dry-waste bin outside Hostel C." />
      <div className="grid items-center gap-6 sm:grid-cols-2">
        <div className="grid place-items-center rounded-xl border-2 border-dashed border-line bg-mist p-6">
          <svg viewBox="0 0 120 130" className="h-40" role="img" aria-label="Illustration of a full waste bin">
            <rect x="22" y="30" width="76" height="90" rx="8" fill="#2E7D32" /><rect x="14" y="18" width="92" height="14" rx="6" fill="#1B5E20" />
            <circle cx="45" cy="26" r="9" fill="#E65100" /><rect x="62" y="12" width="22" height="14" rx="3" fill="#43A047" transform="rotate(12 73 19)" /><circle cx="86" cy="24" r="7" fill="#F9A825" />
            <rect x="36" y="55" width="48" height="6" rx="3" fill="#C8E6C9" /><rect x="36" y="72" width="48" height="6" rx="3" fill="#C8E6C9" />
          </svg>
          <span className="mt-2 rounded-full bg-white px-3 py-1 text-xs text-muted">bin_hostel_c_0842.jpg</span>
        </div>
        <div className="space-y-3 text-sm"><p><strong>Location:</strong> Hostel C</p><p className="text-muted">Photos need no special setup. WasteDNA reads the bin as it is.</p>
          <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white">Analyze Waste</span></div>
      </div>
    </div>
  );
}
function Analysis() {
  const L = ["Detecting items in the photo", "Classifying materials", "Checking contamination and hazards", "Computing Recovery Score"];
  const [n, setN] = useState(0);
  useEffect(() => { if (n >= L.length) return; const t = setTimeout(() => setN(n + 1), 750); return () => clearTimeout(t); }, [n, L.length]);
  return (
    <div><Title n={2} t="AI analysis" d="WasteDNA reads the bin’s material profile in a few seconds." />
      <ul className="space-y-3">{L.map((l, i) => (
        <li key={l} className="flex items-center gap-3 text-sm">
          {i < n ? <Check className="h-5 w-5 text-secondary" /> : i === n ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <span className="h-5 w-5 rounded-full border border-line" />}
          <span className={i > n ? "text-muted" : ""}>{l}</span></li>))}</ul>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-mist"><motion.div className="h-full bg-accent" animate={{ width: `${(n / L.length) * 100}%` }} /></div>
    </div>
  );
}
function Score() {
  return (
    <div><Title n={3} t="Waste Recovery Score" d="One number for how much of this bin can actually be recovered." />
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div><ScoreRing score={R.recoveryScore} band={R.band} /><p className="mt-2 text-center font-display text-lg font-bold" style={{ color: BAND[R.band].c }}>{BAND[R.band].label}</p></div>
        <ul className="space-y-2.5">{R.composition.map((c, i) => (
          <li key={c.material}><div className="flex justify-between text-sm"><span>{c.material}</span><span className="font-semibold">{c.percent}%</span></div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mist"><motion.div className="h-full rounded-full" style={{ background: BAR[c.material] }} initial={{ width: 0 }} animate={{ width: `${c.percent}%` }} transition={{ delay: i * 0.08 }} /></div></li>))}</ul>
      </div>
    </div>
  );
}
function Contam() {
  return (
    <div><Title n={4} t="Detect contamination" d="The score is low for a reason. WasteDNA shows what is causing it." />
      <div className="flex h-5 overflow-hidden rounded-full" role="img" aria-label="36% food waste, 48% recyclable, 16% other">
        <div style={{ width: "36%", background: "#E65100" }} /><div style={{ width: "48%", background: "#43A047" }} /><div style={{ width: "16%", background: "#BDBDBD" }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted"><span className="text-warn">Food waste 36%</span><span className="text-secondary">Plastic, paper, metal 48%</span><span>Other 16%</span></div>
      <div className="mt-5 rounded-xl border border-warn/40 bg-orange-50 p-4">
        <p className="flex items-center gap-2 font-semibold text-warn"><AlertTriangle className="h-5 w-5" />Contamination &amp; hazard risk: severe</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-warn">{R.contamination.hazards.map((h) => <li key={h}>{h}</li>)}</ul>
      </div>
      <p className="mt-4 text-sm">{R.diagnosis}</p>
    </div>
  );
}
function Hotspot({ stats, flows }: { stats: ReturnType<typeof locationStats>; flows: ReturnType<typeof contaminationFlows> }) {
  const f = flows.find((x) => x.target === "Hostel C")!, hc = stats.find((s) => s.location === "Hostel C")!;
  return (
    <div><Title n={5} t="Identify the hotspot" d="One bin is a symptom. Thirty days of scans show whether it is a pattern." />
      <ul className="space-y-2">{stats.slice(0, 4).map((s, i) => (
        <li key={s.location} className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm ${s.location === "Hostel C" ? "border-warn/50 bg-orange-50" : "border-line"}`}>
          <span className="font-semibold">{i + 1}. {s.location}</span><span className="text-muted">Score {s.avgScore} · {s.contaminationRate}% contaminated</span><StatusBadge s={s.status} /></li>))}</ul>
      <p className="mt-5 font-display text-4xl font-bold text-warn">{(hc.lostKg / 1000).toFixed(1)} t</p>
      <p className="text-sm text-muted">of recyclable material lost at Hostel C in 30 days.</p>
      <p className="mt-3 rounded-lg bg-mist px-4 py-3 text-sm"><strong className="text-warn">{f.material} from {f.source}</strong> ({f.pct}% of campus contamination) — {f.note}.</p>
    </div>
  );
}
function Recommend({ rec }: { rec: ReturnType<typeof recommendation> }) {
  return (
    <div><Title n={6} t="Recommend an intervention" d="WasteLeak turns the diagnosis into a specific, measurable action." />
      <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-6 text-white"><p className="font-display text-lg leading-relaxed sm:text-xl">{rec.headline}</p></div>
      <ul className="mt-5 space-y-2 text-sm">{rec.actions.map((a) => <li key={a} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{a}</li>)}</ul>
    </div>
  );
}

export default function DemoPage() {
  const [i, setI] = useState(0);
  const stats = useMemo(locationStats, []);
  const flows = useMemo(contaminationFlows, []);
  const rec = useMemo(() => recommendation("Hostel C"), []);
  const impact = useMemo(() => measureImpact("Hostel C", todayISO()), []);
  const last = i === STEPS.length - 1;
  const views = [<Upload key="1" />, <Analysis key="2" />, <Score key="3" />, <Contam key="4" />, <Hotspot key="5" stats={stats} flows={flows} />, <Recommend key="6" rec={rec} />,
    <div key="7"><Title n={7} t="Measure improvement" d="After the change, BinCheck compares before and after. With no new scans yet, it shows a simulation." />
      <ImpactView impact={impact} location="Hostel C" description={rec.intervention} startDate={todayISO()} /></div>];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-primary sm:text-4xl">Guided demo</h1>
      <p className="mt-2 text-muted">Detect → Diagnose → Find the source → Recommend → Measure improvement. All values are simulated.</p>
      <nav aria-label="Demo progress" className="mt-8">
        <ol className="flex items-center">{STEPS.map((s, k) => (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <button onClick={() => setI(k)} aria-label={`Step ${k + 1}: ${s}`} aria-current={k === i} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${k < i ? "bg-secondary text-white" : k === i ? "bg-primary text-white ring-4 ring-line" : "border border-line bg-white text-muted"}`}>{k < i ? <Check className="h-4 w-4" /> : k + 1}</button>
            {k < STEPS.length - 1 && <span className={`mx-1 h-0.5 flex-1 ${k < i ? "bg-secondary" : "bg-line"}`} />}</li>))}</ol>
        <p className="mt-3 text-sm font-semibold text-primary">Step {i + 1} of {STEPS.length} · {STEPS[i]}</p>
      </nav>
      <Card className="mt-5 min-h-[26rem]"><AnimatePresence mode="wait"><motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>{views[i]}</motion.div></AnimatePresence></Card>
      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Button variant="outline" onClick={() => setI(i - 1)} disabled={i === 0}><ArrowLeft className="h-4 w-4" />Previous</Button>
        {last ? (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setI(0)}><RotateCcw className="h-4 w-4" />Restart</Button>
            <Link href={`/bincheck?location=Hostel%20C&desc=${encodeURIComponent(rec.intervention)}`}><Button>Track this in BinCheck <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>) : <Button onClick={() => setI(i + 1)}>Next <ArrowRight className="h-4 w-4" /></Button>}
      </div>
    </div>
  );
}
