import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Rating } from "@/types/domain";

type Client = SupabaseClient<Database>;

/**
 * Insert an immutable review audit record into card_reviews.
 */
export async function insertReview(
  client: Client,
  params: {
    cardId: string;
    userId: string;
    rating: Rating;
    easeFactorAfter: number;
    intervalDaysAfter: number;
    repetitionsAfter: number;
  }
) {
  const { data, error } = await client
    .from("card_reviews")
    .insert({
      card_id: params.cardId,
      user_id: params.userId,
      rating: params.rating,
      ease_factor_after: params.easeFactorAfter,
      interval_days_after: params.intervalDaysAfter,
      repetitions_after: params.repetitionsAfter,
    })
    .select("id, rating, reviewed_at")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    rating: data.rating,
    reviewedAt: data.reviewed_at,
  };
}

/**
 * Update a card's scheduling state in-place (after SM-2 computation).
 */
export async function updateCardScheduling(
  client: Client,
  cardId: string,
  params: {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReviewDate: string;
  }
) {
  const { data, error } = await client
    .from("cards")
    .update({
      ease_factor: params.easeFactor,
      interval_days: params.intervalDays,
      repetitions: params.repetitions,
      next_review_date: params.nextReviewDate,
    })
    .eq("id", cardId)
    .select("id, ease_factor, interval_days, repetitions, next_review_date")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    easeFactor: data.ease_factor,
    intervalDays: data.interval_days,
    repetitions: data.repetitions,
    nextReviewDate: data.next_review_date,
  };
}

/**
 * Get due cards for a deck: next_review_date ≤ today (UTC).
 * Returns in created_at ASC order (client shuffles).
 */
export async function getDueCards(client: Client, deckId: string) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data, error } = await client
    .from("cards")
    .select(
      "id, front, back, ease_factor, interval_days, repetitions, next_review_date"
    )
    .eq("deck_id", deckId)
    .lte("next_review_date", today)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    front: row.front,
    back: row.back,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    nextReviewDate: row.next_review_date,
  }));
}
