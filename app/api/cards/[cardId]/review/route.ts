import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as reviewService from "@/lib/services/review-service";

type RouteParams = { params: Promise<{ cardId: string }> };

/**
 * POST /api/cards/[cardId]/review — Submit a rating for a card
 *
 * Called optimistically by the study session UI.
 * Runs SM-2 algorithm, writes review audit record, updates card scheduling.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { cardId } = await params;
  const client = await createClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await reviewService.submitReview(client, cardId, body);

  if (!result.success) {
    const response: Record<string, unknown> = { error: result.error };
    if (result.details) response.details = result.details;
    return NextResponse.json(response, { status: result.status });
  }

  return NextResponse.json(result.data);
}
