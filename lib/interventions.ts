"use client";
import { useCallback, useEffect, useState } from "react";
import type { Location } from "@/types/waste";

export interface Intervention { id: string; location: Location; description: string; startDate: string; createdAt: string }
const KEY = "wastedna:interventions";
const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export const addDaysISO = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return toISO(d); };
export const daysAgo = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - new Date(y, m - 1, d).getTime()) / 864e5);
};
export const fmtDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };

// One pre-existing example so BinCheck shows a measured result out of the box.
const seed = (): Intervention[] => [{ id: "seed-hostel-b", location: "Hostel B", description: "Weekly bin audits with colour-coded signage", startDate: addDaysISO(-14), createdAt: new Date().toISOString() }];

export function useInterventions() {
  const [items, setItems] = useState<Intervention[] | null>(null);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); setItems(raw ? JSON.parse(raw) : seed()); } catch { setItems(seed()); }
  }, []);
  const save = useCallback((next: Intervention[]) => { setItems(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ } }, []);
  return { items, add: (i: Intervention) => save([i, ...(items ?? [])]), remove: (id: string) => save((items ?? []).filter((x) => x.id !== id)) };
}
