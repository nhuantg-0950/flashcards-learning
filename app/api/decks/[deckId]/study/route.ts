import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as reviewService from "@/lib/services/review-service";

type RouteParams = { params: Promise<{ deckId: string }> };

/**
 * GET /api/decks/[deckId]/study — Fetch due cards for a study session
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { deckId } = await params;
  const client = await createClient();

  const result = await reviewService.getStudyCards(client, deckId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
