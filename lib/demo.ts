import type { AnalysisResult } from "@/types/waste";
// Fixed result for the guided demo. Matches the Hostel C scenario in Analyze and the WasteLeak data.
export const DEMO_RESULT: AnalysisResult = {
  id: "demo", location: "Hostel C", analyzedAt: "2026-01-01T00:00:00Z", recoveryScore: 17, band: "low",
  composition: [
    { material: "Plastic", percent: 26 }, { material: "Paper", percent: 16 }, { material: "Food Waste", percent: 36 },
    { material: "Metal", percent: 6 }, { material: "E-waste", percent: 2 }, { material: "Other", percent: 14 },
  ],
  recoverablePercent: 32,
  contamination: { present: true, level: "severe", hazards: ["Oily food residue on paper and plastic", "Takeaway boxes with leftovers still inside"],
    summary: "Contamination is reducing what can be recovered. Separate wet and hazardous items at the source." },
  diagnosis: "This bin has a low Recovery Score because food waste is contaminating recyclable material. Takeaway containers from the cafeteria are arriving with leftovers still inside.",
};
