# WasteDNA — AI Waste Intelligence

> Existing systems manage waste. WasteDNA finds out why waste is being lost and measures how to prevent it.

A Next.js 14 web app with simulated AI analysis (no backend yet). All results come from mock data that can be swapped for real APIs later.

## Quick start

Requires Node.js 18.17 or newer.

```bash
npm install
npm run dev
```

Optional: `cp .env.example .env.local`. `sharp` (image analysis) installs prebuilt binaries automatically on Windows, macOS and Linux.

Open http://localhost:3000. For a production build: `npm run build && npm start`.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Lucide React · Framer Motion. Fonts: Inter (body/UI) and Plus Jakarta Sans (headings) via `next/font/google`, self-hosted at build time with `display: swap`.
`components/ui/` holds small shadcn-style `Button` and `Card` components written by hand. To use the real shadcn/ui library, run `npx shadcn@latest init`.

## Modules

| Route | Module | Status |
|-------|--------|--------|
| `/` | Landing page: hero, loop strip, module cards, how it works, impact stats, final CTA | Done |
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
  api/                Backend routes (analyze, analyses, interventions, leak)
  leak/page.tsx       WasteLeak module
  bincheck/page.tsx   BinCheck module
  demo/page.tsx       Guided demo
  template.tsx        Page transitions
  loading.tsx, error.tsx
components/
  navbar.tsx, footer.tsx, score-ring.tsx
  toast.tsx, about-modal.tsx, impact.tsx, confidence-badge.tsx
  ui/button.tsx, ui/card.tsx
lib/
  analysis-core.ts    Shared scoring engine, scenarios, diagnosis text
  mock-analysis.ts    Client: calls /api/analyze (browser mock fallback)
  server/analyze.ts   sharp image pipeline + optional external vision API
  server/store.ts     JSON file store with serialized writes
  config.ts           NEXT_PUBLIC_ANALYSIS_MODE
  mock-history.ts     30-day seeded history + contamination flows
  leak-analytics.ts   Rankings, hotspots, insights, recommendation logic
  impact.ts           Before/after measurement and simulation
  history.ts          Recent analyses (API with localStorage cache)
  export.ts           Copy and download helpers
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

## Analysis: confidence, history, export

- **Deterministic results:** the same photo (file name + size) and location always give the same result. Location profiles drive the numbers, with at most ±2 points of seeded variation per material.
- **Confidence score:** High / Medium / Low plus a 0–100 value. It drops when no location is selected, the photo is very small or unusually large, or the photo color disagrees with the location profile. The factors are listed under "How this score was calculated".
- **Calculation breakdown:** composition → contamination penalty → recoverable % → final score, shown in an expandable section on every result.
- **Three-line diagnosis:** main problem, why the score is low/medium/high, and one next action.
- **Analysis history:** the last 10 analyses are saved in localStorage (`lib/history.ts`). Click one to reopen it, or clear the list.
- **Copy / download:** "Copy diagnosis" and "Download summary" (.txt) on Analyze; "Download summary" on the BinCheck before/after view.
- **Color heuristic (demo only):** a 16×16 thumbnail is sampled. Strong orange/brown tones add up to +4 points to Food Waste, and grey/white tones add up to +3 to Paper. This is not computer vision. The location profile is the main driver.

## Backend (Next.js API routes)

The app now runs a real server-side backend. No external database is needed.

| Route | Purpose |
|-------|---------|
| `POST /api/analyze` | multipart `file` (JPEG/PNG/WebP, max 8 MB) + optional `location`. Runs the server pipeline, saves and returns an `AnalysisResult` |
| `GET /api/analyses?limit=20&location=Hostel%20C` | Recent analyses, newest first |
| `GET /api/analyses/[id]` | One analysis (404 if missing) |
| `DELETE /api/analyses` | Clear analysis history |
| `GET /api/interventions` / `POST /api/interventions` | List / create (`{ location, description, startDate }`, optional `id`) |
| `DELETE /api/interventions/[id]` | Delete one |
| `GET /api/leak?location=` | Location stats, campus insights, contamination flows and recommendation, computed server-side |

Errors return `{ "error": "..." }` with 400 / 413 / 415 / 422 / 404 status codes. The WasteLeak page still imports the same analytics functions directly; the API exposes the same logic.

**Server analysis pipeline** (`lib/server/analyze.ts`, uses `sharp`): reads image size, average RGB, brightness, contrast and a Laplacian sharpness measure. Strong orange/brown adds Food Waste (max +4), grey/white adds Paper (+3), very dark and low-saturation adds Other (+3) plus a contamination-risk note, and tiny or blurry photos lower confidence. The location profile is still the main driver, and results are deterministic for the same file name, size and location (±2 points). This is image statistics, not a trained vision model, and the UI says so.

**Storage:** `data/store.json` (gitignored, created on first run, seeded with one sample intervention). Writes are serialized to avoid corruption. If the filesystem is read-only (for example serverless hosting) the store keeps working in memory only; set `WASTEDNA_DATA_DIR` or move to a real database for production.

**Modes:** `NEXT_PUBLIC_ANALYSIS_MODE=api` (default) uses the backend. `mock` keeps analysis and interventions in the browser for offline demos. If the API is unreachable, the app falls back to the browser mock automatically. See `.env.example`.

## Plugging in a real vision API

Set `WASTE_VISION_API_URL` and `WASTE_VISION_API_KEY`. `/api/analyze` then sends `POST { image: <base64>, location }` with a Bearer token and expects `{ composition: { plastic, paper, food, metal, ewaste, other }, hazards?: string[], confidence?: 0-100 }`. The response is mapped into the same `AnalysisResult` (engine `external-vision`). Any error or timeout (8 s) falls back to the local sharp pipeline, so the app never breaks when keys are missing. To use a different contract, edit `externalVision()` in `lib/server/analyze.ts`.

## Color theme

Primary `#1B5E20` · Secondary `#2E7D32` · Accent `#43A047` · Background `#F1F8E9` and white · Card border `#C8E6C9` · Text `#212121` / muted `#616161` · Warning `#E65100`. Score colors: high = green, medium = amber, low = orange-red.

## Performance

All pages are statically prerendered at about 140–155 kB first-load JS. Fonts are self-hosted by `next/font` (the build needs internet access once to download them). Framer Motion honors `prefers-reduced-motion` globally.

## Roadmap

- Real image analysis backend
- Shared intervention storage across users
- Per-location history charts
