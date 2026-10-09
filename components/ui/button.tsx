import * as React from "react";
import { cn } from "@/lib/utils";
type P = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" };
export const Button = React.forwardRef<HTMLButtonElement, P>(({ className, variant = "solid", ...p }, ref) => (
  <button ref={ref} className={cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
    variant === "solid" ? "bg-primary text-white hover:bg-secondary" : "border border-line bg-white text-primary hover:bg-mist", className)} {...p} />
));
Button.displayName = "Button";
