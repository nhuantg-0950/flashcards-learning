"use client";

import { Button } from "@/components/ui/button";

interface CardViewerProps {
  front: string;
  back: string;
  isRevealed: boolean;
  onReveal: () => void;
}

export function CardViewer({
  front,
  back,
  isRevealed,
  onReveal,
}: CardViewerProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
      {/* Card display */}
      <div className="w-full min-h-[200px] rounded-xl border bg-card p-8 shadow-sm flex flex-col items-center justify-center text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          {isRevealed ? "Answer" : "Question"}
        </p>
        <p className="text-xl font-medium leading-relaxed">
          {isRevealed ? back : front}
        </p>
      </div>

      {/* Reveal button — hidden once revealed */}
      {!isRevealed && (
        <Button onClick={onReveal} size="lg" className="w-full max-w-xs">
          Reveal Answer
        </Button>
      )}
    </div>
  );
}
