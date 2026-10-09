# WasteDNA — AI Waste Intelligence

> Existing systems manage waste. WasteDNA finds out why waste is being lost and measures how to prevent it.

A Next.js 14 web app with simulated AI analysis (no backend yet). All results come from mock data that can be swapped for real APIs later.

## Quick start

Requires Node.js 18.17 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. For a production build: `npm run build && npm start`.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Lucide React · Framer Motion. System fonts, no external font requests.
`components/ui/` holds small shadcn-style `Button` and `Card` components written by hand. To use the real shadcn/ui library, run `npx shadcn@latest init`.

## Modules

| Route | Module | Status |
|-------|--------|--------|
| `/` | Home: hero, USP, module cards | Done |
| `/analyze` | **WasteDNA Analyze**: upload a bin photo, get Recovery Score, material composition, contamination risk and a plain-language diagnosis | Done |
| `/leak` | **WasteLeak**: location ranking, hotspot map, key insights, auto-generated recommendation | Done |
| `/bincheck` | **BinCheck AI**: segregation scores, record interventions, Before → Intervention → After comparison (measured or simulated) | Done |
| `/demo` | **Guided demo**: 7-step walkthrough of the full loop (Hostel C story) | Done |

## The intelligence loop

Detect → Diagnose → Find the source → Recommend → Measure improvement

- **Analyze → WasteLeak:** "Find source of this problem" opens `/leak?location=...` filtered to the scanned location.
- **WasteLeak → BinCheck:** "Track this intervention" opens `/bincheck` with the location and description pre-filled.
- **BinCheck → Analyze:** "Scan a new photo" and "Scan [location] again" return to `/analyze`.
- **Interventions** are saved in the browser (localStorage). One example (Hostel B) is seeded so a measured result shows immediately.
- **Measured vs Simulated:** an intervention with at least 4 days of data after its start date is measured from the 30-day history. Otherwise BinCheck shows an estimate with a "Simulated" badge, using the same 27–37% uplift as the WasteLeak recommendation.
- **Segregation Score** = 100 − contamination rate (last 7 days).

## Project structure

```
app/
  page.tsx            Home
  analyze/page.tsx    Analyze module
  leak/page.tsx       WasteLeak module
  bincheck/page.tsx   BinCheck module
  demo/page.tsx       Guided demo
  template.tsx        Page transitions
  loading.tsx, error.tsx
components/
  navbar.tsx, footer.tsx, score-ring.tsx
  toast.tsx, about-modal.tsx, impact.tsx
  ui/button.tsx, ui/card.tsx
lib/
  mock-analysis.ts    Simulated image analysis (per-location scenarios)
  mock-history.ts     30-day seeded history + contamination flows
  leak-analytics.ts   Rankings, hotspots, insights, recommendation logic
  impact.ts           Before/after measurement and simulation
  interventions.ts    Intervention storage hook and date helpers
  demo.ts             Fixed result used by the guided demo
  utils.ts            cn() class helper
types/
  waste.ts            Analyze types
  leak.ts             WasteLeak types
```

## How the mock data works

- **Analyze:** `analyzeWaste(file, location)` waits 2–3 seconds, then returns a result based on the chosen location. Canteen is food-heavy with a low score, Academic Block is clean paper with a high score, and other locations use the Hostel A profile. The photo itself is not inspected.
- **WasteLeak:** `lib/mock-history.ts` generates 30 days of data per location from a seeded random generator, so it is identical on every load. Hostel C and Canteen are built as hotspots, and Hostel C is getting worse over the period.
- **Status rules:** Hotspot if score < 40 or contamination ≥ 55%. Watch if score < 60 or contamination ≥ 35%. Otherwise Good.
- **Severity (sorting):** 40% low score, 30% contamination rate, 30% share of the largest material loss.

## Replacing mock data with a real backend

1. In `lib/mock-analysis.ts`, replace the body of `analyzeWaste()` with an API call that returns an `AnalysisResult` (see `types/waste.ts`).
2. In `lib/mock-history.ts`, replace `HISTORY` and `FLOWS` with data fetched from your API. `lib/leak-analytics.ts` and the pages need no changes as long as the types stay the same.

## Color theme

Primary `#1B5E20` · Secondary `#2E7D32` · Accent `#43A047` · Background `#F1F8E9` and white · Card border `#C8E6C9` · Text `#212121` / muted `#616161` · Warning `#E65100`. Score colors: high = green, medium = amber, low = orange-red.

## Performance

System fonts only (no font downloads), all pages statically prerendered, about 140–150 kB first-load JS per page.

## Roadmap

- Real image analysis backend
- Shared intervention storage across users
- Per-location history charts
