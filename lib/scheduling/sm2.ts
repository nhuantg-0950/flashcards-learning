import type { SM2State, SM2Result, Rating } from "@/types/domain";

/**
 * Pure SM-2 spaced repetition function.
 *
 * NO side effects, NO database access, NO imports from lib/db/.
 * Accepts `today` as a parameter for deterministic testing.
 *
 * Formula reference (locked — per clarification session 2026-02-26):
 *
 * | Rating    | repetitions       | interval_days                                  | ease_factor           |
 * |-----------|-------------------|------------------------------------------------|-----------------------|
 * | 1 (Again) | reset to 0        | set to 1                                       | EF -= 0.20 (floor 1.3)|
 * | 2 (Hard)  | unchanged         | max(1, round(interval × 1.2))                  | EF -= 0.15 (floor 1.3)|
 * | 3 (Good)  | +1                | 1 if rep=1, 6 if rep=2, else round(interval×EF)| unchanged             |
 * | 4 (Easy)  | +1                | round(interval × EF × 1.3)                     | EF += 0.15            |
 *
 * next_review_date = today (UTC) + interval_days
 */
export function sm2(state: SM2State, rating: Rating, today: Date): SM2Result {
  let { easeFactor, intervalDays, repetitions } = state;

  switch (rating) {
    case 1: {
      // Again — reset
      repetitions = 0;
      intervalDays = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
    }
    case 2: {
      // Hard — no rep change, modest interval growth
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;
    }
    case 3: {
      // Good — standard SM-2 progression
      repetitions += 1;
      if (repetitions === 1) {
        intervalDays = 1;
      } else if (repetitions === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      // EF unchanged
      break;
    }
    case 4: {
      // Easy — accelerated progression
      repetitions += 1;
      intervalDays = Math.round(intervalDays * easeFactor * 1.3);
      easeFactor += 0.15;
      break;
    }
  }

  // Compute next review date: today + intervalDays
  const nextDate = new Date(today);
  nextDate.setUTCDate(nextDate.getUTCDate() + intervalDays);
  const nextReviewDate = nextDate.toISOString().split("T")[0]; // YYYY-MM-DD

  return {
    easeFactor: Math.round(easeFactor * 100) / 100, // 2 decimal places
    intervalDays,
    repetitions,
    nextReviewDate,
  };
}
