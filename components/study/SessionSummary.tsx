"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Rating } from "@/types/domain";

interface SessionSummaryProps {
  deckId: string;
  deckName: string;
  reviewedCount: number;
  ratingCounts: Record<Rating, number>;
}

const RATING_LABELS: Record<Rating, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

const RATING_COLORS: Record<Rating, string> = {
  1: "text-destructive",
  2: "text-orange-500",
  3: "text-green-600",
  4: "text-blue-500",
};

export function SessionSummary({
  deckId,
  deckName,
  reviewedCount,
  ratingCounts,
}: SessionSummaryProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold">🎉 Session Complete!</h2>
        <p className="text-muted-foreground mt-1">
          You reviewed <strong>{reviewedCount}</strong> card
          {reviewedCount !== 1 ? "s" : ""}
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Rating Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {([1, 2, 3, 4] as Rating[]).map((rating) => (
            <div key={rating} className="flex items-center justify-between">
              <span className={`font-medium ${RATING_COLORS[rating]}`}>
                {RATING_LABELS[rating]}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {ratingCounts[rating] || 0}
              </span>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{reviewedCount}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href={`/decks/${deckId}`}>Back to Deck</Link>
        </Button>
        <Button asChild>
          <Link href="/decks">All Decks</Link>
        </Button>
      </div>
    </div>
  );
}
