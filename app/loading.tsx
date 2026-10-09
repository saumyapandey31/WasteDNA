import { Loader2 } from "lucide-react";
export default function Loading() {
  return <div className="grid min-h-[50vh] place-items-center text-muted"><Loader2 className="h-8 w-8 animate-spin text-accent" aria-label="Loading" /></div>;
}
