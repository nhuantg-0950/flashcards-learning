import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as deckService from "@/lib/services/deck-service";

type RouteParams = { params: Promise<{ deckId: string }> };

/**
 * PATCH /api/decks/[deckId] — Rename a deck
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { deckId } = await params;
  const client = await createClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await deckService.updateDeck(client, deckId, body);

  if (!result.success) {
    const response: Record<string, unknown> = { error: result.error };
    if (result.details) response.details = result.details;
    return NextResponse.json(response, { status: result.status });
  }

  return NextResponse.json(result.data);
}

/**
 * DELETE /api/decks/[deckId] — Delete a deck (cascades cards + reviews)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { deckId } = await params;
  const client = await createClient();

  const result = await deckService.deleteDeck(client, deckId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
