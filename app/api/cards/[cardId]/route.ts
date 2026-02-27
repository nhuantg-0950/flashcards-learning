import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as cardService from "@/lib/services/card-service";

type RouteParams = { params: Promise<{ cardId: string }> };

/**
 * PATCH /api/cards/[cardId] — Edit card front/back text (not scheduling state)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { cardId } = await params;
  const client = await createClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await cardService.updateCard(client, cardId, body);

  if (!result.success) {
    const response: Record<string, unknown> = { error: result.error };
    if (result.details) response.details = result.details;
    return NextResponse.json(response, { status: result.status });
  }

  return NextResponse.json(result.data);
}

/**
 * DELETE /api/cards/[cardId] — Delete a single card (reviews cascade)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { cardId } = await params;
  const client = await createClient();

  const result = await cardService.deleteCard(client, cardId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
