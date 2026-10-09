"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20"><Card className="text-center">
      <h1 className="font-display text-2xl font-bold text-primary">Something went wrong</h1>
      <p className="mt-2 text-muted">This page could not load. Your recorded interventions are safe.</p>
      <Button onClick={reset} className="mt-5">Try again</Button>
    </Card></div>
  );
}
