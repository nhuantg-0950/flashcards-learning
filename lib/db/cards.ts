import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/** Map a raw card row to the API response shape */
function mapCard(row: {
  id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    front: row.front,
    back: row.back,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    nextReviewDate: row.next_review_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all cards in a deck. Ordered by created_at ASC.
 * RLS ensures only the owner's cards are returned.
 */
export async function getCards(client: Client, deckId: string) {
  const { data, error } = await client
    .from("cards")
    .select(
      "id, front, back, ease_factor, interval_days, repetitions, next_review_date, created_at, updated_at"
    )
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapCard);
}

/**
 * Get a single card by ID. Returns null if not found.
 */
export async function getCard(client: Client, cardId: string) {
  const { data, error } = await client
    .from("cards")
    .select(
      "id, deck_id, front, back, ease_factor, interval_days, repetitions, next_review_date, created_at, updated_at"
    )
    .eq("id", cardId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return {
    ...mapCard(data),
    deckId: data.deck_id,
  };
}

/**
 * Create a new card in a deck with initial SM-2 scheduling state (FR-021).
 * ease_factor=2.50, interval_days=0, repetitions=0, next_review_date=today(UTC).
 */
export async function createCard(
  client: Client,
  userId: string,
  deckId: string,
  front: string,
  back: string
) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC

  const { data, error } = await client
    .from("cards")
    .insert({
      user_id: userId,
      deck_id: deckId,
      front,
      back,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      next_review_date: today,
    })
    .select(
      "id, front, back, ease_factor, interval_days, repetitions, next_review_date, created_at, updated_at"
    )
    .single();

  if (error) throw error;

  return mapCard(data);
}

/**
 * Update the text content of a card (front/back only — not scheduling state).
 * Returns the updated card or null if not found.
 */
export async function updateCard(
  client: Client,
  cardId: string,
  fields: { front?: string; back?: string }
) {
  const { data, error } = await client
    .from("cards")
    .update(fields)
    .eq("id", cardId)
    .select(
      "id, front, back, ease_factor, interval_days, repetitions, next_review_date, created_at, updated_at"
    )
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return mapCard(data);
}

/**
 * Delete a single card. Returns true if deleted, false if not found.
 * Associated reviews are cascade-deleted by the DB.
 */
export async function deleteCard(client: Client, cardId: string) {
  const { error, count } = await client
    .from("cards")
    .delete({ count: "exact" })
    .eq("id", cardId);

  if (error) throw error;

  return (count ?? 0) > 0;
}
