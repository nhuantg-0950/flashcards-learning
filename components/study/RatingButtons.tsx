"use client";

import { Button } from "@/components/ui/button";
import type { Rating } from "@/types/domain";

interface RatingButtonsProps {
  disabled: boolean;
  onRate: (rating: Rating) => void;
}

const RATINGS: Array<{
  value: Rating;
  label: string;
  variant: "destructive" | "outline" | "default" | "secondary";
}> = [
  { value: 1, label: "Again", variant: "destructive" },
  { value: 2, label: "Hard", variant: "outline" },
  { value: 3, label: "Good", variant: "default" },
  { value: 4, label: "Easy", variant: "secondary" },
];

export function RatingButtons({ disabled, onRate }: RatingButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-xl mx-auto">
      {RATINGS.map(({ value, label, variant }) => (
        <Button
          key={value}
          variant={variant}
          disabled={disabled}
          onClick={() => onRate(value)}
          className="text-sm font-medium"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
