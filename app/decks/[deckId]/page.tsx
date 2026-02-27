import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDeck } from "@/lib/db/decks";
import { getCards } from "@/lib/db/cards";
import { CardList } from "@/components/cards/CardList";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = { params: Promise<{ deckId: string }> };

export default async function DeckDetailPage({ params }: Props) {
  const { deckId } = await params;
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect("/login");

  const deck = await getDeck(client, deckId);
  if (!deck) notFound();

  const cards = await getCards(client, deckId);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/decks" className="hover:underline">
              My Decks
            </Link>
            <span>/</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{deck.name}</h1>
          <p className="text-muted-foreground mt-1">
            {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/decks/${deckId}/edit`}>Rename</Link>
          </Button>
          <Button asChild>
            <Link href={`/decks/${deckId}/study`}>Study</Link>
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <Button asChild size="sm">
          <Link href={`/decks/${deckId}/cards/new`}>Add Card</Link>
        </Button>
      </div>

      {/* Card list */}
      <CardList deckId={deckId} cards={cards} />
    </div>
  );
}
