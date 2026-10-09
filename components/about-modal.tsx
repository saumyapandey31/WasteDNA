"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardCheck, MapPinned, ScanSearch, X } from "lucide-react";
const MODS = [
  { icon: ScanSearch, t: "WasteDNA Analyze", d: "Detect and diagnose: a photo becomes a Recovery Score, material breakdown and contamination risk." },
  { icon: MapPinned, t: "WasteLeak", d: "Find the source: rank locations, spot hotspots and trace where contamination starts." },
  { icon: ClipboardCheck, t: "BinCheck AI", d: "Measure improvement: record interventions and compare before and after." },
];
const LOOP = ["Detect", "Diagnose", "Find the source", "Recommend", "Measure improvement"];
export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label="About WasteDNA" onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-soft sm:p-8">
            <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md p-1 text-muted hover:bg-mist"><X className="h-5 w-5" /></button>
            <h2 className="font-display text-2xl font-bold text-primary">About WasteDNA</h2>
            <p className="mt-2 text-muted">Existing systems manage waste. WasteDNA finds out why waste is being lost and measures how to prevent it.</p>
            <ul className="mt-5 space-y-3">
              {MODS.map(({ icon: I, t, d }) => (
                <li key={t} className="flex gap-3 rounded-xl border border-line p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mist text-secondary"><I className="h-5 w-5" /></span>
                  <div><p className="font-semibold text-primary">{t}</p><p className="text-sm text-muted">{d}</p></div>
                </li>))}
            </ul>
            <p className="mt-6 text-sm font-semibold text-primary">The intelligence loop</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {LOOP.map((s, i) => (<span key={s} className="flex items-center gap-2"><span className="rounded-full bg-primary px-3 py-1 text-white">{s}</span>{i < LOOP.length - 1 && <span className="text-accent">→</span>}</span>))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
