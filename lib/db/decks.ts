import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/**
 * Get all decks for the authenticated user, with card counts.
 * Ordered by created_at DESC.
 */
export async function getDecks(client: Client) {
  // Supabase: use a left join count via the `cards` relationship
  const { data, error } = await client
    .from("decks")
    .select("id, name, created_at, updated_at, cards(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    cardCount: row.cards[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get a single deck by ID (with card count).
 * Returns null if not found (RLS will also hide other users' decks).
 */
export async function getDeck(client: Client, deckId: string) {
  const { data, error } = await client
    .from("decks")
    .select("id, name, created_at, updated_at, cards(count)")
    .eq("id", deckId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    cardCount: data.cards[0]?.count ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Create a new deck for the authenticated user.
 */
export async function createDeck(client: Client, userId: string, name: string) {
  const { data, error } = await client
    .from("decks")
    .insert({ user_id: userId, name })
    .select("id, name, created_at, updated_at")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    cardCount: 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Rename an existing deck. Returns the updated deck or null if not found.
 */
export async function updateDeck(client: Client, deckId: string, name: string) {
  const { data, error } = await client
    .from("decks")
    .update({ name })
    .eq("id", deckId)
    .select("id, name, created_at, updated_at, cards(count)")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    cardCount: data.cards[0]?.count ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a deck by ID. Returns true if deleted, false if not found.
 * Associated cards and reviews are cascade-deleted by the DB.
 */
export async function deleteDeck(client: Client, deckId: string) {
  const { error, count } = await client
    .from("decks")
    .delete({ count: "exact" })
    .eq("id", deckId);

  if (error) throw error;

  return (count ?? 0) > 0;
}
