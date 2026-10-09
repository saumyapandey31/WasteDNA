"use client";
import { Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, CheckCircle2, Droplets, Flame, Lightbulb, Minus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { campusInsights, contaminationFlows, locationStats, recommendation } from "@/lib/leak-analytics";
import type { LeakStatus, LocationStats } from "@/types/leak";
import type { Location } from "@/types/waste";
import { cn } from "@/lib/utils";

const fade = { hidden: { opacity: 0, y: 16 }, show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }) };
const fmtKg = (kg: number) => (kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${Math.round(kg)} kg`);
const STATUS: Record<LeakStatus, { badge: string; color: string }> = {
  Hotspot: { badge: "border-warn/40 bg-orange-50 text-warn", color: "#E65100" },
  Watch: { badge: "border-amber-300 bg-amber-50 text-amber-800", color: "#F9A825" },
  Good: { badge: "border-line bg-mist text-secondary", color: "#2E7D32" },
};
const scoreColor = (s: number) => (s >= 70 ? "text-secondary" : s >= 40 ? "text-amber-700" : "text-warn");
const Badge = ({ s }: { s: LeakStatus }) => <span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold", STATUS[s].badge)}>{s}</span>;

function LeakInner() {
  const stats = useMemo(locationStats, []);
  const insights = useMemo(campusInsights, []);
  const flows = useMemo(contaminationFlows, []);
  const focus = useSearchParams().get("location") as Location | null;
  const rec = useMemo(() => recommendation(focus ?? undefined), [focus]);
  const T = insights.trend;

  const cards = [
    { icon: Trash2, label: "Recoverable material lost", value: fmtKg(insights.totalLostKg), sub: `${insights.lostSharePct}% of all campus waste, last 30 days`, tone: "text-warn" },
    { icon: Droplets, label: "Top contamination source", value: insights.topSource.label, sub: `${insights.topSource.pct}% of campus contamination`, tone: "text-primary", small: true },
    { icon: Flame, label: "Active hotspots", value: String(insights.hotspots), sub: `of ${stats.length} locations need action`, tone: "text-warn" },
    { icon: T.direction === "improving" ? TrendingUp : T.direction === "worsening" ? TrendingDown : Minus, label: "Campus trend",
      value: T.direction[0].toUpperCase() + T.direction.slice(1), sub: `${T.delta > 0 ? "+" : ""}${T.delta} Recovery Score pts, last 7 days vs first 7`,
      tone: T.direction === "improving" ? "text-secondary" : T.direction === "worsening" ? "text-warn" : "text-amber-700", spark: true },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <motion.header variants={fade} initial="hidden" animate="show" custom={0}>
        <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-secondary">WasteLeak · Last 30 days</span>
        <h1 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Find the problem</h1>
        <p className="mt-2 max-w-2xl text-muted">WasteDNA traces why recyclable material is being lost: which locations leak the most, and where the contamination starts.</p>
      </motion.header>

      {focus && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm"><span>Showing results for <strong className="text-primary">{focus}</strong> from your Analyze scan.</span><Link href="/leak" className="font-semibold text-secondary underline">Clear filter</Link></div>}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} variants={fade} initial="hidden" animate="show" custom={i + 1}>
            <Card className="h-full p-5">
              <div className="flex items-center gap-2 text-sm text-muted"><c.icon className={cn("h-4 w-4", c.tone)} />{c.label}</div>
              <p className={cn("mt-2 font-display font-bold", c.small ? "text-xl" : "text-3xl", c.tone)}>{c.value}</p>
              <p className="mt-1 text-xs text-muted">{c.sub}</p>
              {c.spark && <Spark data={insights.series} className={c.tone} />}
            </Card>
          </motion.div>
        ))}
      </section>

      <Ranking stats={stats} focus={focus} />

      <section>
        <h2 className="font-display text-2xl font-bold text-primary">Hotspot detection</h2>
        <p className="mt-1 text-muted">Bubble size shows recyclable material lost. Dashed lines show where contamination travels.</p>
        <Card className="mt-5 p-3 sm:p-5"><CampusMap stats={stats} flows={flows} /></Card>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {stats.filter((s) => (focus ? s.location === focus : s.status === "Hotspot")).map((s, i) => (
            <motion.div key={s.location} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
              <Card className="h-full border-warn/40">
                <div className="flex items-start justify-between"><h3 className="font-display text-xl font-semibold text-primary">{s.location}</h3><Badge s={s.status} /></div>
                <p className="mt-3 font-display text-4xl font-bold text-warn">{fmtKg(s.lostKg)}</p>
                <p className="text-sm text-muted">of recyclable material lost in 30 days · avg score {s.avgScore} · {s.contaminationRate}% contaminated</p>
                <h4 className="mt-4 text-sm font-semibold">Where contamination is coming from</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {flows.filter((f) => f.target === s.location).map((f) => (
                    <li key={f.source + f.material + f.note} className="rounded-lg bg-orange-50 px-3 py-2">
                      <span className="font-semibold text-warn">{f.material} from {f.source}</span> <span className="text-muted">({f.pct}%) — {f.note}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.section variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}
        className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-6 text-white shadow-soft sm:p-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#C8E6C9]"><Lightbulb className="h-4 w-4" />Recommended intervention · {rec.location}</div>
        <p className="mt-3 max-w-3xl font-display text-xl leading-relaxed sm:text-2xl">{rec.headline}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ul className="space-y-2 text-sm">{rec.actions.map((a) => <li key={a} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C8E6C9]" />{a}</li>)}</ul>
          {rec.next.length > 0 && <div className="text-sm"><p className="font-semibold text-[#C8E6C9]">Next priorities</p><ul className="mt-2 list-disc space-y-1 pl-5">{rec.next.map((n) => <li key={n}>{n}</li>)}</ul></div>}
        </div>
        <Link href={`/bincheck?location=${encodeURIComponent(rec.location)}&desc=${encodeURIComponent(rec.intervention)}`}><Button className="mt-8 bg-white text-primary hover:bg-mist">Track this intervention</Button></Link>
        
      </motion.section>
    </div>
  );
}

function Spark({ data, className }: { data: number[]; className?: string }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * 120).toFixed(1)},${(30 - ((v - min) / (max - min || 1)) * 26).toFixed(1)}`).join(" ");
  return <svg viewBox="0 0 120 32" className={cn("mt-3 h-8 w-full", className)} aria-hidden><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}

type SortKey = "severity" | "avgScore" | "contaminationRate" | "lostKg";
function Ranking({ stats, focus }: { stats: LocationStats[]; focus: Location | null }) {
  const [key, setKey] = useState<SortKey>("severity");
  const [desc, setDesc] = useState(true);
  const rows = [...stats].sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]));
  const toggle = (k: SortKey) => { if (k === key) setDesc(!desc); else { setKey(k); setDesc(k !== "avgScore"); } };
  const H = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left"><button onClick={() => toggle(k)} className="inline-flex items-center gap-1 font-semibold hover:text-primary">{children}<ArrowUpDown className={cn("h-3.5 w-3.5", key === k && "text-accent")} /></button></th>
  );
  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-primary">Location performance ranking</h2>
      <p className="mt-1 text-muted">Sorted by severity by default. Select a column to re-sort.</p>
      <Card className="mt-5 overflow-hidden p-0"><div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-mist text-muted"><tr>
            <th className="px-4 py-3 text-left font-semibold">Location</th>
            <H k="avgScore">Avg Recovery Score</H><H k="contaminationRate">Contamination Rate</H><H k="lostKg">Est. Material Lost</H>
            <H k="severity">Status</H>
          </tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.location} className={cn("border-t border-line", focus === r.location && "bg-mist")}>
              <td className="px-4 py-3 font-semibold">{r.location}</td>
              <td className={cn("px-4 py-3 font-bold", scoreColor(r.avgScore))}>{r.avgScore}<span className="font-normal text-muted"> /100</span></td>
              <td className="px-4 py-3">{r.contaminationRate}%</td>
              <td className="px-4 py-3">{fmtKg(r.lostKg)}</td>
              <td className="px-4 py-3"><Badge s={r.status} /></td>
            </tr>))}</tbody>
        </table>
      </div></Card>
    </section>
  );
}

const POS: Record<Location, [number, number]> = { "Hostel A": [100, 90], "Hostel B": [100, 250], "Hostel C": [310, 255], Canteen: [310, 95], "Academic Block": [510, 170] };
function CampusMap({ stats, flows }: { stats: LocationStats[]; flows: ReturnType<typeof contaminationFlows> }) {
  const max = Math.max(...stats.map((s) => s.lostKg));
  return (
    <svg viewBox="0 0 600 340" className="w-full rounded-xl bg-mist" role="img" aria-label="Campus map of waste hotspots">
      <defs><pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#C8E6C9" strokeWidth="0.6" /></pattern></defs>
      <rect width="600" height="340" fill="url(#g)" />
      {flows.filter((f) => f.source !== f.target).map((f) => (
        <motion.line key={f.source + f.target} x1={POS[f.source][0]} y1={POS[f.source][1]} x2={POS[f.target][0]} y2={POS[f.target][1]}
          stroke="#E65100" strokeWidth={2 + f.pct / 8} strokeDasharray="8 6" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 0.8 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3 }} />
      ))}
      {stats.map((s, i) => {
        const [x, y] = POS[s.location], r = 24 + 26 * (s.lostKg / max), c = STATUS[s.status].color;
        return (
          <motion.g key={s.location} initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: "spring" }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <circle cx={x} cy={y} r={r + 8} fill={c} opacity="0.15" />
            <circle cx={x} cy={y} r={r} fill={c} opacity="0.92" />
            <text x={x} y={y + 5} textAnchor="middle" className="fill-white text-[13px] font-bold">{s.avgScore}</text>
            <text x={x} y={y + r + 22} textAnchor="middle" className="fill-ink text-[12px] font-semibold">{s.location}</text>
          </motion.g>
        );
      })}
    </svg>
  );
}

export default function LeakPage() {
  return <Suspense fallback={<div className="p-12 text-center text-muted">Loading WasteLeak…</div>}><LeakInner /></Suspense>;
}
