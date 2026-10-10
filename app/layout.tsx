import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast";
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-inter" });
const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], display: "swap", variable: "--font-display" });
export const metadata: Metadata = { title: "WasteDNA — AI Waste Intelligence", description: "Find out why waste is being lost and measure how to prevent it." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col font-sans"><ToastProvider><Navbar /><main className="flex-1">{children}</main><Footer /></ToastProvider></body>
    </html>
  );
}
