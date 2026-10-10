"use client";
import { useEffect, useState } from "react";
import type { Intervention } from "@/types/leak";
import { API_MODE } from "./config";
export type { Intervention };

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

// Offline fallback only: used in mock mode or when the API cannot be reached.
const seed = (): Intervention[] => [{ id: "seed-hostel-b", location: "Hostel B", description: "Weekly bin audits with colour-coded signage", startDate: addDaysISO(-14), createdAt: new Date().toISOString() }];
const readLocal = (): Intervention[] | null => { try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as Intervention[]) : null; } catch { return null; } };
const writeLocal = (v: Intervention[]) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } };
async function api(method: string, url: string, body?: unknown): Promise<boolean> {
  if (!API_MODE) return false;
  try { const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); return r.ok; } catch { return false; }
}

export function useInterventions() {
  const [items, setItems] = useState<Intervention[] | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (API_MODE) {
        try { const r = await fetch("/api/interventions"); if (r.ok) { const j = (await r.json()) as { interventions: Intervention[] }; if (alive) { setItems(j.interventions); return; } } } catch { /* use local */ }
      }
      if (alive) setItems(readLocal() ?? seed());
    })();
    return () => { alive = false; };
  }, []);
  const add = async (i: Intervention) => {
    const next = [i, ...(items ?? [])]; setItems(next);
    if (!(await api("POST", "/api/interventions", { id: i.id, location: i.location, description: i.description, startDate: i.startDate }))) writeLocal(next);
  };
  const remove = async (id: string) => {
    const next = (items ?? []).filter((x) => x.id !== id); setItems(next);
    if (!(await api("DELETE", `/api/interventions/${id}`))) writeLocal(next);
  };
  return { items, add, remove };
}
