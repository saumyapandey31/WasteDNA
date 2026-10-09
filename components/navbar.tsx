"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dna, Info, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { AboutModal } from "./about-modal";
const LINKS = [["Analyze", "/analyze"], ["WasteLeak", "/leak"], ["BinCheck", "/bincheck"], ["Demo", "/demo"]];
export function Navbar() {
  const path = usePathname();
  const [about, setAbout] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary" aria-label="WasteDNA home">
          <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
            <Leaf className="h-5 w-5" /><Dna className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-accent p-0.5" />
          </span><span className="hidden sm:inline">WasteDNA</span>
        </Link>
        <ul className="flex items-center gap-0.5 text-sm font-medium sm:gap-1">
          {LINKS.map(([l, h]) => (
            <li key={h}><Link href={h} className={cn("rounded-md px-2 py-2 text-muted hover:text-primary sm:px-3", path === h && "bg-mist text-primary")}>{l}</Link></li>
          ))}
          <li><button onClick={() => setAbout(true)} aria-label="About WasteDNA" className="rounded-md p-2 text-muted hover:bg-mist hover:text-primary"><Info className="h-5 w-5" /></button></li>
        </ul>
      </nav>
      <AboutModal open={about} onClose={() => setAbout(false)} />
    </header>
  );
}
