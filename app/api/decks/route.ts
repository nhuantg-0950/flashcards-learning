import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as deckService from "@/lib/services/deck-service";

/**
 * GET /api/decks — List all decks for the authenticated user
 */
export async function GET() {
  const client = await createClient();
  const result = await deckService.listDecks(client);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}

/**
 * POST /api/decks — Create a new deck
 */
export async function POST(request: Request) {
  const client = await createClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await deckService.createDeck(client, body);

  if (!result.success) {
    const response: Record<string, unknown> = { error: result.error };
    if (result.details) response.details = result.details;
    return NextResponse.json(response, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 201 });
}
