import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  createDeckSchema,
  updateDeckSchema,
} from "@/lib/validation/deck-schemas";
import * as deckDb from "@/lib/db/decks";

type Client = SupabaseClient<Database>;

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: string; details?: unknown[] };

/**
 * Get the authenticated user ID from the Supabase client.
 * Returns null if not authenticated.
 */
async function getAuthUserId(client: Client): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}

/** List all decks for the authenticated user */
export async function listDecks(
  client: Client
): Promise<
  ServiceResult<{ decks: Awaited<ReturnType<typeof deckDb.getDecks>> }>
> {
  const userId = await getAuthUserId(client);
  if (!userId) return { success: false, status: 401, error: "Unauthorized" };

  try {
    const decks = await deckDb.getDecks(client);
    return { success: true, data: { decks } };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}

/** Create a new deck */
export async function createDeck(
  client: Client,
  body: unknown
): Promise<
  ServiceResult<{ deck: Awaited<ReturnType<typeof deckDb.createDeck>> }>
> {
  const userId = await getAuthUserId(client);
  if (!userId) return { success: false, status: 401, error: "Unauthorized" };

  const parsed = createDeckSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      status: 400,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    const deck = await deckDb.createDeck(client, userId, parsed.data.name);
    return { success: true, data: { deck } };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}

/** Rename a deck */
export async function updateDeck(
  client: Client,
  deckId: string,
  body: unknown
): Promise<
  ServiceResult<{
    deck: NonNullable<Awaited<ReturnType<typeof deckDb.updateDeck>>>;
  }>
> {
  const userId = await getAuthUserId(client);
  if (!userId) return { success: false, status: 401, error: "Unauthorized" };

  const parsed = updateDeckSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      status: 400,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    // Defence-in-depth: verify ownership at app layer (even though RLS covers it)
    const existing = await deckDb.getDeck(client, deckId);
    if (!existing)
      return { success: false, status: 404, error: "Deck not found" };

    const deck = await deckDb.updateDeck(client, deckId, parsed.data.name);
    if (!deck) return { success: false, status: 404, error: "Deck not found" };

    return { success: true, data: { deck } };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}

/** Delete a deck (cascades cards + reviews) */
export async function deleteDeck(
  client: Client,
  deckId: string
): Promise<ServiceResult<{ success: true }>> {
  const userId = await getAuthUserId(client);
  if (!userId) return { success: false, status: 401, error: "Unauthorized" };

  try {
    // Defence-in-depth: verify existence and ownership before delete
    const existing = await deckDb.getDeck(client, deckId);
    if (!existing)
      return { success: false, status: 404, error: "Deck not found" };

    const deleted = await deckDb.deleteDeck(client, deckId);
    if (!deleted)
      return { success: false, status: 404, error: "Deck not found" };

    return { success: true, data: { success: true } };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}
