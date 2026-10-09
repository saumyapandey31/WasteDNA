"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScanSearch, MapPinned, ClipboardCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
const MODULES = [
  { icon: ScanSearch, title: "Analyze", href: "/analyze", text: "Upload a photo of a bin or bag. Get a Recovery Score, material breakdown and contamination risks." },
  { icon: MapPinned, title: "WasteLeak", href: "/leak", text: "Find the problem: rank locations, spot hotspots and trace where contamination starts." },
  { icon: ClipboardCheck, title: "BinCheck", href: "/bincheck", text: "Measure improvement: record interventions and compare Recovery Score before and after." },
];
export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-b from-[#DCEDC8] via-mist to-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="font-display text-4xl font-bold leading-tight text-primary sm:text-6xl">WasteDNA — AI Waste Intelligence</motion.h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">Existing systems manage waste. WasteDNA finds out why waste is being lost and measures how to prevent it.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3"><Link href="/analyze"><Button className="px-8 py-4 text-base">Start Analysis <ArrowRight className="h-4 w-4" /></Button></Link><Link href="/demo"><Button variant="outline" className="px-8 py-4 text-base">Watch the demo</Button></Link></div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
        {MODULES.map(({ icon: Icon, title, text, href }) => (
          <Link key={title} href={href}><Card className="h-full transition-shadow hover:shadow-lg">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-mist text-secondary"><Icon className="h-6 w-6" /></span>
            <h2 className="mt-4 font-display text-xl font-semibold text-primary">{title}</h2>
            <p className="mt-2 text-muted">{text}</p>
          </Card></Link>
        ))}
      </section>
    </>
  );
}
