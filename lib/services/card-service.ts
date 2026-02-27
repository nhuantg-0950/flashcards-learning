import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  createCardSchema,
  updateCardSchema,
} from "@/lib/validation/card-schemas";
import * as cardDb from "@/lib/db/cards";
import * as deckDb from "@/lib/db/decks";

type Client = SupabaseClient<Database>;

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: string; details?: unknown[] };

/**
 * Get the authenticated user ID from the Supabase client.
 */
async function getAuthUserId(client: Client): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}

/**
 * Verify that the authenticated user owns the given deck.
 * Returns a ServiceResult error if not authenticated, deck not found, or forbidden.
 */
async function verifyDeckOwnership(
  client: Client,
  deckId: string
): Promise<ServiceResult<{ userId: string }>> {
  const userId = await getAuthUserId(client);
  if (!userId) return { success: false, status: 401, error: "Unauthorized" };

  // RLS filters by user_id, so getDeck returns null for decks the user doesn't own
  const deck = await deckDb.getDeck(client, deckId);
  if (!deck) return { success: false, status: 404, error: "Deck not found" };

  return { success: true, data: { userId } };
}

/** List all cards in a deck */
export async function listCards(
  client: Client,
  deckId: string
): Promise<
  ServiceResult<{ cards: Awaited<ReturnType<typeof cardDb.getCards>> }>
> {
  try {
    const ownership = await verifyDeckOwnership(client, deckId);
    if (!ownership.success) return ownership;

    const cards = await cardDb.getCards(client, deckId);
    return { success: true, data: { cards } };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}

/** Create a new card in a deck */
export async function createCard(
  client: Client,
  deckId: string,
  body: unknown
): Promise<
  ServiceResult<{ card: Awaited<ReturnType<typeof cardDb.createCard>> }>
> {
  const parsed = createCardSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      status: 400,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    const ownership = await verifyDeckOwnership(client, deckId);
    if (!ownership.success) return ownership;

    const card = await cardDb.createCard(
      client,
      ownership.data.userId,
      deckId,
      parsed.data.front,
      parsed.data.back
    );
    return { success: true, data: { card } };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}

/** Edit a card's front/back text (does NOT touch scheduling state) */
export async function updateCard(
  client: Client,
  cardId: string,
  body: unknown
): Promise<
  ServiceResult<{
    card: NonNullable<Awaited<ReturnType<typeof cardDb.updateCard>>>;
  }>
> {
  const parsed = updateCardSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      status: 400,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  try {
    const userId = await getAuthUserId(client);
    if (!userId) return { success: false, status: 401, error: "Unauthorized" };

    // Defence-in-depth: verify card exists and belongs to user
    const existing = await cardDb.getCard(client, cardId);
    if (!existing)
      return { success: false, status: 404, error: "Card not found" };

    const card = await cardDb.updateCard(client, cardId, parsed.data);
    if (!card) return { success: false, status: 404, error: "Card not found" };

    return { success: true, data: { card } };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}

/** Delete a single card (reviews cascade-deleted by DB) */
export async function deleteCard(
  client: Client,
  cardId: string
): Promise<ServiceResult<{ success: true }>> {
  try {
    const userId = await getAuthUserId(client);
    if (!userId) return { success: false, status: 401, error: "Unauthorized" };

    // Defence-in-depth: verify card exists and belongs to user
    const existing = await cardDb.getCard(client, cardId);
    if (!existing)
      return { success: false, status: 404, error: "Card not found" };

    const deleted = await cardDb.deleteCard(client, cardId);
    if (!deleted)
      return { success: false, status: 404, error: "Card not found" };

    return { success: true, data: { success: true } };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}
