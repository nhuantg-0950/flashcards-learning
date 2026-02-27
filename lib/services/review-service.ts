import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Rating } from "@/types/domain";
import { reviewSchema } from "@/lib/validation/review-schemas";
import { sm2 } from "@/lib/scheduling/sm2";
import * as cardDb from "@/lib/db/cards";
import * as reviewDb from "@/lib/db/reviews";
import * as deckDb from "@/lib/db/decks";

type Client = SupabaseClient<Database>;

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; error: string; details?: unknown[] };

async function getAuthUserId(client: Client): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}

/**
 * Process a card review:
 * 1. Validate input
 * 2. Read current card scheduling state
 * 3. Run SM-2 algorithm
 * 4. Write card_reviews INSERT + cards UPDATE
 * 5. Return updated state
 */
export async function submitReview(
  client: Client,
  cardId: string,
  body: unknown
): Promise<
  ServiceResult<{
    card: {
      id: string;
      easeFactor: number;
      intervalDays: number;
      repetitions: number;
      nextReviewDate: string;
    };
    review: {
      id: string;
      rating: number;
      reviewedAt: string;
    };
  }>
> {
  // Auth check
  const userId = await getAuthUserId(client);
  if (!userId) return { success: false, status: 401, error: "Unauthorized" };

  // Validate input
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      status: 400,
      error: "Validation failed",
      details: parsed.error.issues,
    };
  }

  const rating = parsed.data.rating as Rating;

  try {
    // Read current card (RLS ensures ownership)
    const card = await cardDb.getCard(client, cardId);
    if (!card) return { success: false, status: 404, error: "Card not found" };

    // Run SM-2 pure function
    const today = new Date();
    const result = sm2(
      {
        easeFactor: card.easeFactor,
        intervalDays: card.intervalDays,
        repetitions: card.repetitions,
      },
      rating,
      today
    );

    // Write review audit record
    const review = await reviewDb.insertReview(client, {
      cardId,
      userId,
      rating,
      easeFactorAfter: result.easeFactor,
      intervalDaysAfter: result.intervalDays,
      repetitionsAfter: result.repetitions,
    });

    // Update card scheduling state
    const updatedCard = await reviewDb.updateCardScheduling(client, cardId, {
      easeFactor: result.easeFactor,
      intervalDays: result.intervalDays,
      repetitions: result.repetitions,
      nextReviewDate: result.nextReviewDate,
    });

    return {
      success: true,
      data: {
        card: updatedCard,
        review,
      },
    };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}

/**
 * Get due cards for a study session.
 * Verifies deck ownership, returns cards with next_review_date ≤ today.
 */
export async function getStudyCards(
  client: Client,
  deckId: string
): Promise<
  ServiceResult<{
    cards: Awaited<ReturnType<typeof reviewDb.getDueCards>>;
    totalDue: number;
  }>
> {
  const userId = await getAuthUserId(client);
  if (!userId) return { success: false, status: 401, error: "Unauthorized" };

  try {
    // Verify deck ownership (RLS filters by user_id)
    const deck = await deckDb.getDeck(client, deckId);
    if (!deck) return { success: false, status: 404, error: "Deck not found" };

    const cards = await reviewDb.getDueCards(client, deckId);

    return {
      success: true,
      data: {
        cards,
        totalDue: cards.length,
      },
    };
  } catch {
    return { success: false, status: 500, error: "Internal server error" };
  }
}
