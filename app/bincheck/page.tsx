"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, ClipboardCheck, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImpactView, StatusBadge } from "@/components/impact";
import { useToast } from "@/components/toast";
import { LOCATIONS } from "@/lib/mock-analysis";
import { locationStats } from "@/lib/leak-analytics";
import { currentSegregation, measureImpact } from "@/lib/impact";
import { todayISO, useInterventions } from "@/lib/interventions";
import type { Location } from "@/types/waste";
import { cn, uid } from "@/lib/utils";

const field = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm";
const segColor = (s: number) => (s >= 70 ? "text-secondary" : s >= 45 ? "text-amber-700" : "text-warn");

function BinCheckInner() {
  const sp = useSearchParams();
  const toast = useToast();
  const { items, add, remove } = useInterventions();
  const stats = useMemo(locationStats, []);
  const seg = useMemo(currentSegregation, []);
  const [location, setLocation] = useState(sp.get("location") ?? "");
  const [desc, setDesc] = useState(sp.get("desc") ?? "");
  const [start, setStart] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selId, setSelId] = useState<string | null>(null);
  useEffect(() => setStart(todayISO()), []);

  const sel = items?.find((x) => x.id === selId) ?? items?.[0];
  const impact = useMemo(() => (sel ? measureImpact(sel.location, sel.startDate) : null), [sel]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!location) err.location = "Choose a location.";
    if (desc.trim().length < 8) err.desc = "Describe the intervention in at least a few words.";
    if (!start) err.start = "Set a start date.";
    setErrors(err);
    if (Object.keys(err).length) return toast("Please fix the highlighted fields.", "error");
    const id = uid();
    add({ id, location: location as Location, description: desc.trim(), startDate: start, createdAt: new Date().toISOString() });
    setSelId(id); setDesc("");
    toast(`Intervention recorded for ${location}.`, "success");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-secondary">BinCheck AI · Measure improvement</span>
          <h1 className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl">Did the intervention work?</h1>
          <p className="mt-2 max-w-2xl text-muted">Record what you changed, then compare Recovery Score and contamination before and after.</p>
        </div>
        <Link href="/analyze"><Button variant="outline"><Camera className="h-4 w-4" />Scan a new photo</Button></Link>
      </header>

      <section>
        <h2 className="font-display text-2xl font-bold text-primary">Current Segregation Score</h2>
        <p className="mt-1 text-muted">Share of waste that is correctly separated, last 7 days.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div key={s.location} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="h-full p-5">
                <div className="flex items-center justify-between"><h3 className="font-semibold">{s.location}</h3><StatusBadge s={s.status} /></div>
                <p className={cn("mt-2 font-display text-4xl font-bold", segColor(seg[s.location]))}>{seg[s.location]}<span className="text-base font-normal text-muted"> /100</span></p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{items?.filter((x) => x.location === s.location).length ?? 0} intervention(s)</span>
                  <span className="flex gap-3"><Link href={`/analyze?location=${encodeURIComponent(s.location)}`} className="font-semibold text-secondary underline">Scan</Link><a href="#record" onClick={() => setLocation(s.location)} className="font-semibold text-secondary underline">Track intervention</a></span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="record" className="scroll-mt-24">
        <h2 className="font-display text-2xl font-bold text-primary">Record an intervention</h2>
        <Card className="mt-5">
          <form onSubmit={submit} className="grid gap-5 md:grid-cols-2" noValidate>
            <div>
              <label htmlFor="loc" className="text-sm font-medium">Location</label>
              <select id="loc" value={location} onChange={(e) => setLocation(e.target.value)} className={field}>
                <option value="">Select a location</option>{LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </select>
              {errors.location && <p className="mt-1 text-xs text-warn">{errors.location}</p>}
            </div>
            <div>
              <label htmlFor="start" className="text-sm font-medium">Start date</label>
              <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
              {errors.start && <p className="mt-1 text-xs text-warn">{errors.start}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="desc" className="text-sm font-medium">What will change?</label>
              <textarea id="desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Separate food waste at the cafeteria" className={field} />
              {errors.desc && <p className="mt-1 text-xs text-warn">{errors.desc}</p>}
            </div>
            <div className="md:col-span-2"><Button type="submit"><Plus className="h-4 w-4" />Record intervention</Button></div>
          </form>
        </Card>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-primary">Before → Intervention → After</h2>
        <div className="mt-5">
          {items === null && <Card className="grid min-h-48 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-accent" aria-label="Loading" /></Card>}
          {items?.length === 0 && (
            <Card className="grid min-h-64 place-items-center text-center">
              <div className="max-w-md">
                <svg viewBox="0 0 160 110" className="mx-auto h-28" aria-hidden="true"><rect x="10" y="80" width="140" height="6" rx="3" fill="#C8E6C9" /><path d="M20 70 L55 50 L85 58 L125 24" fill="none" stroke="#43A047" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="125" cy="24" r="9" fill="#2E7D32" /><circle cx="20" cy="70" r="6" fill="#E65100" /></svg>
                <p className="mt-3 font-display text-lg font-bold text-primary">No interventions tracked yet</p>
                <p className="mt-1 text-sm text-muted">Record what you changed and BinCheck shows whether the Recovery Score improved. It is measured once scans exist after the start date, and simulated before that.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3"><a href="#record"><Button>Record your first intervention</Button></a><Link href="/leak"><Button variant="outline">See WasteLeak recommendation</Button></Link></div>
              </div>
            </Card>)}
          {items && items.length > 0 && sel && impact && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {items.map((x) => (
                  <button key={x.id} onClick={() => setSelId(x.id)} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", x.id === sel.id ? "border-primary bg-primary text-white" : "border-line bg-white text-primary hover:bg-mist")}>{x.location}</button>))}
              </div>
              <ImpactView impact={impact} location={sel.location} description={sel.description} startDate={sel.startDate} />
              <div className="flex flex-wrap gap-3">
                <Link href={`/analyze?location=${encodeURIComponent(sel.location)}`}><Button variant="outline"><Camera className="h-4 w-4" />Scan {sel.location} again</Button></Link>
                <Button variant="outline" onClick={() => { remove(sel.id); setSelId(null); toast("Intervention removed.", "info"); }}><Trash2 className="h-4 w-4" />Remove</Button>
              </div>
            </div>)}
        </div>
      </section>
    </div>
  );
}

export default function BinCheckPage() {
  return <Suspense fallback={<div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>}><BinCheckInner /></Suspense>;
}
