import type { ConfidenceLabel } from "@/types/waste";
import { cn } from "@/lib/utils";
const C: Record<ConfidenceLabel, string> = { High: "border-line bg-mist text-secondary", Medium: "border-amber-300 bg-amber-50 text-amber-800", Low: "border-warn/40 bg-orange-50 text-warn" };
export function ConfidenceBadge({ label, score }: { label: ConfidenceLabel; score?: number }) {
  return <span title="How sure this prototype is about the result" className={cn("inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide", C[label])}>{label} confidence{score !== undefined ? ` · ${score}` : ""}</span>;
}
