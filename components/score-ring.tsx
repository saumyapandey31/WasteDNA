"use client";
import { motion } from "framer-motion";
import type { ScoreBand } from "@/types/waste";
export const BAND = { high: { c: "#2E7D32", label: "High recovery" }, medium: { c: "#F9A825", label: "Medium recovery" }, low: { c: "#E65100", label: "Low recovery" } } as const;
export function ScoreRing({ score, band }: { score: number; band: ScoreBand }) {
  const r = 70, C = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-48 w-48" role="img" aria-label={`Waste Recovery Score ${score} out of 100`}>
      <svg viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#E8F5E9" strokeWidth="14" />
        <motion.circle cx="90" cy="90" r={r} fill="none" stroke={BAND[band].c} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - score / 100) }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-display text-5xl font-bold" style={{ color: BAND[band].c }}>{score}</span>
        <span className="text-xs text-muted">out of 100</span>
      </div>
    </div>
  );
}
