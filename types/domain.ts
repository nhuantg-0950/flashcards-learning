import type { Database } from "./database";

// ---------------------------------------------------------------------------
// Database row type aliases
// ---------------------------------------------------------------------------

/** Raw Deck row from Supabase */
export type DeckRow = Database["public"]["Tables"]["decks"]["Row"];

/** Raw Card row from Supabase */
export type CardRow = Database["public"]["Tables"]["cards"]["Row"];

/** Raw CardReview row from Supabase */
export type CardReviewRow = Database["public"]["Tables"]["card_reviews"]["Row"];

// ---------------------------------------------------------------------------
// Application-level types
// ---------------------------------------------------------------------------

/** Deck with computed card count (used in list responses) */
export interface Deck {
  id: string;
  name: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Card with scheduling state */
export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
  createdAt: string;
  updatedAt: string;
}

/** Immutable review audit record */
export interface CardReview {
  id: string;
  cardId: string;
  rating: 1 | 2 | 3 | 4;
  easeFactorAfter: number;
  intervalDaysAfter: number;
  repetitionsAfter: number;
  reviewedAt: string;
}

// ---------------------------------------------------------------------------
// SM-2 Algorithm types (used by lib/scheduling/sm2.ts)
// ---------------------------------------------------------------------------

/** Input state for the SM-2 pure function */
export interface SM2State {
  easeFactor: number; // default 2.5, floor 1.3
  intervalDays: number; // default 0
  repetitions: number; // default 0
}

/** Output from the SM-2 pure function */
export interface SM2Result {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string; // ISO date YYYY-MM-DD (UTC)
}

/** Valid SM-2 rating values: Again=1, Hard=2, Good=3, Easy=4 */
export type Rating = 1 | 2 | 3 | 4;
