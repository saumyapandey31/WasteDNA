"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
type Kind = "success" | "error" | "info";
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(Ctx);
const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info };
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; kind: Kind }[]>([]);
  const push = useCallback((msg: string, kind: Kind = "info") => {
    const id = Date.now() + Math.random();
    setItems((i) => [...i, { id, msg, kind }]);
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <MotionConfig reducedMotion="user"><Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2">
        <AnimatePresence>
          {items.map(({ id, msg, kind }) => { const I = ICON[kind]; return (
            <motion.div key={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
              className={cn("pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm shadow-soft", kind === "error" ? "border-warn/50 text-warn" : "border-line text-primary")}>
              <I className="h-4 w-4 shrink-0" />{msg}
            </motion.div>); })}
        </AnimatePresence>
      </div>
    </Ctx.Provider></MotionConfig>
  );
}
