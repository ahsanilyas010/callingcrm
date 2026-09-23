import { Sparkles } from "lucide-react";

// Every /demo/* page shows this so nobody — including the person giving
// the walkthrough — mistakes fabricated numbers for real ones.
export function DemoBanner({ note }: { note: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-md border border-brand-orange-tint-2 bg-brand-orange-tint px-3 py-2 text-xs text-brand-orange-text">
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong className="font-semibold">Demo mode.</strong> {note}
      </span>
    </div>
  );
}
