import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as cardService from "@/lib/services/card-service";

type RouteParams = { params: Promise<{ deckId: string }> };

/**
 * GET /api/decks/[deckId]/cards — List all cards in a deck
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { deckId } = await params;
  const client = await createClient();

  const result = await cardService.listCards(client, deckId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}

/**
 * POST /api/decks/[deckId]/cards — Create a new card in a deck
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { deckId } = await params;
  const client = await createClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await cardService.createCard(client, deckId, body);

  if (!result.success) {
    const response: Record<string, unknown> = { error: result.error };
    if (result.details) response.details = result.details;
    return NextResponse.json(response, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 201 });
}
