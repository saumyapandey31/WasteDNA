"use client";
import { ArrowDown, ArrowUp, Download, Minus, Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { downloadText, impactSummaryText } from "@/lib/export";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/interventions";
import type { Impact } from "@/lib/impact";
import type { LeakStatus } from "@/types/leak";

const B: Record<LeakStatus, string> = { Hotspot: "border-warn/40 bg-orange-50 text-warn", Watch: "border-amber-300 bg-amber-50 text-amber-800", Good: "border-line bg-mist text-secondary" };
export const StatusBadge = ({ s }: { s: LeakStatus }) => <span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold", B[s])}>{s}</span>;

export function Delta({ v, better, unit = "" }: { v: number; better: "up" | "down"; unit?: string }) {
  if (v === 0) return <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted"><Minus className="h-4 w-4" />No change</span>;
  const good = better === "up" ? v > 0 : v < 0, Icon = v > 0 ? ArrowUp : ArrowDown;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold", good ? "bg-mist text-secondary" : "bg-orange-50 text-warn")}><Icon className="h-4 w-4" />{v > 0 ? "+" : ""}{v}{unit}</span>;
}

function Chart({ impact }: { impact: Impact }) {
  const N = impact.series.length + impact.projected.length, W = 600, H = 150;
  const x = (i: number) => (i / (N - 1)) * W, y = (v: number) => H - 8 - (v / 100) * (H - 16);
  const line = (a: number[], off = 0) => a.map((v, i) => `${x(i + off).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const sx = x(impact.startIdx), last = impact.series.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Recovery Score over 30 days with intervention marker">
      <line x1={sx} x2={sx} y1="0" y2={H} stroke="#43A047" strokeDasharray="4 4" />
      <text x={Math.min(sx + 6, W - 80)} y="12" className="fill-secondary text-[11px] font-semibold">Intervention</text>
      <polyline points={line(impact.series)} fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinejoin="round" />
      {impact.projected.length > 0 && <polyline points={line([impact.series[last], ...impact.projected], last)} fill="none" stroke="#F9A825" strokeWidth="2.5" strokeDasharray="6 5" />}
    </svg>
  );
}

export function ImpactView({ impact, location, description, startDate }: { impact: Impact; location: string; description: string; startDate: string }) {
  const toast = useToast();
  const sim = impact.mode === "simulated", { before: b, after: a, delta: d } = impact;
  const nodes = [
    { t: "Before", s: "7 days before start", v: `Score ${b.score}`, c: "bg-warn" },
    { t: "Intervention", s: fmtDate(startDate), v: description, c: "bg-accent" },
    { t: "After", s: sim ? "Projected within 2 weeks" : `Measured over ${impact.daysTracked} days`, v: `Score ${a.score}`, c: sim ? "bg-amber-400" : "bg-secondary" },
  ];
  const cards = [
    { l: "Recovery Score", b: b.score, a: a.score, d: d.score, better: "up" as const, u: "" },
    { l: "Contamination rate", b: `${b.contam}%`, a: `${a.contam}%`, d: d.contam, better: "down" as const, u: "%" },
    { l: "Segregation Score", b: b.seg, a: a.seg, d: d.seg, better: "up" as const, u: "" },
  ];
  return (
    <div className="space-y-6">
      <div className={cn("flex flex-wrap items-center gap-4 rounded-2xl border-2 p-4", sim ? "border-amber-300 bg-amber-50" : "border-line bg-mist")}>
        <span className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-bold tracking-wide", sim ? "bg-amber-400 text-ink" : "bg-secondary text-white")}>
          {sim ? <Sparkles className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}{sim ? "SIMULATED" : "MEASURED"}</span>
        <div className="min-w-0 flex-1"><h3 className="font-display text-xl font-bold text-primary">{location}</h3>
          <p className="text-sm text-muted">{sim ? "Estimated result. No scans after the start date yet." : `Based on ${impact.daysTracked} days of data after the start date.`}</p></div>
        <Button variant="outline" className="px-4 py-2" onClick={() => { downloadText(`bincheck-${location.replace(/\s+/g, "-").toLowerCase()}.txt`, impactSummaryText(impact, location, description, startDate)); toast("Summary downloaded.", "success"); }}><Download className="h-4 w-4" />Download summary</Button>
      </div>
      <Card>
        <ol className="grid gap-4 sm:grid-cols-3">
          {nodes.map((n) => (
            <li key={n.t} className="relative rounded-xl bg-mist p-4">
              <span className={cn("absolute right-4 top-4 h-3 w-3 rounded-full", n.c)} />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{n.t}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{n.v}</p><p className="text-xs text-muted">{n.s}</p>
            </li>))}
        </ol>
        <div className="mt-5"><Chart impact={impact} /></div>
        <p className="text-xs text-muted">Recovery Score, last 30 days{sim ? " · dashed amber line is the projection" : ""}</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.l} className="p-5">
            <p className="text-sm text-muted">{c.l}</p>
            <div className="mt-2 flex items-center gap-3 font-display text-3xl font-bold">
              <span className="text-muted">{c.b}</span><span className="text-accent">→</span><span className="text-primary">{c.a}</span>
            </div>
            <div className="mt-3"><Delta v={c.d} better={c.better} unit={c.u === "%" ? " pts" : ""} /></div>
          </Card>))}
      </div>
      {sim && <p className="text-sm text-muted">Estimated uplift: {impact.range[0]}–{impact.range[1]}% more recoverable material, based on the WasteLeak recommendation. Scan this location again after the start date and BinCheck replaces this estimate with measured results.</p>}
    </div>
  );
}
