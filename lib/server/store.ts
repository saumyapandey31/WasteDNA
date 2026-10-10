import { promises as fs } from "fs";
import path from "path";
import type { AnalysisResult } from "@/types/waste";
import type { Intervention } from "@/types/leak";

export interface Store { analyses: AnalysisResult[]; interventions: Intervention[] }
const DIR = process.env.WASTEDNA_DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DIR, "store.json");
const g = globalThis as unknown as { __wdnaStore?: Store; __wdnaChain?: Promise<unknown> };

function seed(): Store {
  const d = new Date(); d.setDate(d.getDate() - 14);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { analyses: [], interventions: [{ id: "seed-hostel-b", location: "Hostel B", description: "Weekly bin audits with colour-coded signage", startDate: iso, createdAt: new Date().toISOString() }] };
}
async function persist(s: Store) {
  try { await fs.mkdir(DIR, { recursive: true }); const tmp = `${FILE}.tmp`; await fs.writeFile(tmp, JSON.stringify(s, null, 2)); await fs.rename(tmp, FILE); }
  catch { /* read-only filesystem: keep serving from memory */ }
}
async function load(): Promise<Store> {
  if (g.__wdnaStore) return g.__wdnaStore;
  try { g.__wdnaStore = JSON.parse(await fs.readFile(FILE, "utf8")) as Store; }
  catch { g.__wdnaStore = seed(); await persist(g.__wdnaStore); }
  return g.__wdnaStore;
}
/** Serialises every read-modify-write so concurrent requests cannot corrupt data/store.json. */
export function withStore<T>(fn: (s: Store) => T | Promise<T>): Promise<T> {
  const run = (g.__wdnaChain ?? Promise.resolve()).then(async () => { const s = await load(); const out = await fn(s); await persist(s); return out; });
  g.__wdnaChain = run.catch(() => undefined);
  return run;
}
