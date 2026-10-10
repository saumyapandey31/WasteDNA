"use client";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ClipboardCheck, Lightbulb, MapPinned, Play, ScanSearch, Search, TrendingUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/score-ring";
import { campusInsights, recommendation } from "@/lib/leak-analytics";

const rise = { hidden: { opacity: 0, y: 20 }, show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }) };
const view = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-60px" } } as const;
const LOOP = ["Detect", "Diagnose", "Find source", "Recommend", "Measure"];
const MODULES = [
  { icon: ScanSearch, title: "Analyze", href: "/analyze", tag: "Detect + Diagnose", text: "Upload a photo of any bin. Get a Waste Recovery Score, a material breakdown, contamination risk and a plain-language diagnosis with a confidence rating." },
  { icon: MapPinned, title: "WasteLeak", href: "/leak", tag: "Find the source", text: "Rank every location, spot recurring hotspots and trace where contamination starts, such as food waste from the canteen landing in a hostel bin." },
  { icon: ClipboardCheck, title: "BinCheck", href: "/bincheck", tag: "Measure improvement", text: "Record an intervention, then compare Recovery Score and contamination before and after. Clearly labelled as measured or simulated." },
];
const STEPS = [
  { icon: Upload, t: "Scan a bin", d: "Upload a photo and pick the location." },
  { icon: Search, t: "Find out why", d: "The score is low because food waste is contaminating recyclables." },
  { icon: MapPinned, t: "Trace the source", d: "Hostel C is a hotspot, fed by food waste from the cafeteria." },
  { icon: Lightbulb, t: "Act, then measure", d: "Separate food waste at the cafeteria, then see the measured improvement." },
];

export default function Home() {
  const { insights, rec } = useMemo(() => ({ insights: campusInsights(), rec: recommendation() }), []);
  const stats = [
    { v: String(Math.round(insights.series[insights.series.length - 1])), u: "/100", l: "Campus Recovery Score" },
    { v: String(insights.hotspots), u: "", l: "Hotspots detected" },
    { v: (insights.totalLostKg / 1000).toFixed(1), u: " t", l: "Recyclable material lost, 30 days" },
    { v: `${rec.gainRange[0]}–${rec.gainRange[1]}`, u: "%", l: "Estimated uplift at the top hotspot" },
  ];
  return (
    <>
      <section className="overflow-hidden bg-gradient-to-b from-[#DCEDC8] via-mist to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <motion.span variants={rise} initial="hidden" animate="show" custom={0} className="inline-block rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary">AI Waste Intelligence · Campus-ready</motion.span>
            <motion.h1 variants={rise} initial="hidden" animate="show" custom={1} className="mt-5 font-display text-5xl font-extrabold leading-[1.05] text-primary sm:text-7xl">WasteDNA</motion.h1>
            <motion.p variants={rise} initial="hidden" animate="show" custom={2} className="mt-5 max-w-xl text-lg text-muted">Existing systems manage waste. WasteDNA finds out why waste is being lost and measures how to prevent it.</motion.p>
            <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-wrap gap-3">
              <Link href="/analyze"><Button className="px-8 py-4 text-base">Start Analysis <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/demo"><Button variant="outline" className="px-8 py-4 text-base"><Play className="h-4 w-4" />Watch Demo</Button></Link>
            </motion.div>
          </div>
          <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="hidden lg:block" aria-hidden="true">
            <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted"><span>Hostel C · bin scan</span><span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-warn">Low recovery</span></div>
              <div className="mt-3"><ScoreRing score={17} band="low" /></div>
              <ul className="mt-4 space-y-2 text-xs">
                {[["Food waste", 36, "#E65100"], ["Plastic", 26, "#2E7D32"], ["Paper", 16, "#43A047"]].map(([n, p, c]) => (
                  <li key={n as string}><div className="flex justify-between"><span>{n}</span><span className="font-semibold">{p}%</span></div><div className="mt-1 h-2 rounded-full bg-mist"><div className="h-2 rounded-full" style={{ width: `${p}%`, background: c as string }} /></div></li>))}
              </ul>
              <p className="mt-4 rounded-lg bg-orange-50 px-3 py-2 text-xs text-warn">Food waste is contaminating recyclable material.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <motion.div {...view} variants={rise} custom={0}>
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">Most tools only classify waste. WasteDNA closes the loop.</h2>
          <ol className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
            {LOOP.map((s, i) => (
              <li key={s} className="flex items-center gap-2"><span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold tracking-wide text-white">{s}</span>{i < LOOP.length - 1 && <ArrowRight className="h-4 w-4 text-accent" aria-hidden="true" />}</li>))}
          </ol>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-3">
        {MODULES.map(({ icon: Icon, title, text, href, tag }, i) => (
          <motion.div key={title} {...view} variants={rise} custom={i}>
            <Link href={href} className="group block h-full rounded-2xl border border-line bg-white p-7 shadow-soft transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-[0_14px_40px_-14px_rgba(67,160,71,0.6)]">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-mist text-secondary transition-colors group-hover:bg-primary group-hover:text-white"><Icon className="h-8 w-8" /></span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-accent">{tag}</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-primary">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary">Open {title}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </motion.div>))}
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <motion.h2 {...view} variants={rise} custom={0} className="font-display text-3xl font-bold text-primary sm:text-4xl">How it works</motion.h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, t, d }, i) => (
              <motion.li key={t} {...view} variants={rise} custom={i} className="rounded-2xl border border-line bg-mist/50 p-5">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display font-bold text-white">{i + 1}</span><Icon className="h-5 w-5 text-secondary" /></div>
                <p className="mt-3 font-display text-lg font-bold text-primary">{t}</p><p className="mt-1 text-sm text-muted">{d}</p>
              </motion.li>))}
          </ol>
          <motion.p {...view} variants={rise} custom={2} className="mt-8 rounded-2xl border border-line bg-white p-5 text-primary shadow-soft sm:text-lg">
            <TrendingUp className="mr-2 inline h-5 w-5 text-accent" />{rec.headline}
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">Campus impact at a glance</h2>
        <p className="mt-1 text-sm text-muted">Sample campus data from the WasteDNA demo dataset, last 30 days.</p>
        <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={s.l} {...view} variants={rise} custom={i} className="rounded-2xl border border-line bg-white p-6 shadow-soft">
              <dd className="font-display text-4xl font-extrabold text-primary sm:text-5xl">{s.v}<span className="text-xl text-secondary">{s.u}</span></dd>
              <dt className="mt-2 text-sm text-muted">{s.l}</dt>
            </motion.div>))}
        </dl>
      </section>

      <section className="bg-primary">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-white">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Find out why your waste is being lost.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[#C8E6C9]">Scan one bin and follow the loop from photo to measured improvement.</p>
          <Link href="/analyze"><Button className="mt-8 bg-white px-8 py-4 text-base text-primary hover:bg-mist">Start Analysis <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>
    </>
  );
}
