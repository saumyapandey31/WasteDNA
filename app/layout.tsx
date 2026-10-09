import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast";
export const metadata: Metadata = { title: "WasteDNA — AI Waste Intelligence", description: "Find out why waste is being lost and measure how to prevent it." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col"><ToastProvider><Navbar /><main className="flex-1">{children}</main><Footer /></ToastProvider></body>
    </html>
  );
}
