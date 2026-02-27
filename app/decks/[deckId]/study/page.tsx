import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDeck } from "@/lib/db/decks";
import { getDueCards } from "@/lib/db/reviews";
import { StudySession } from "@/components/study/StudySession";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ deckId: string }> };

export default async function StudyPage({ params }: Props) {
  const { deckId } = await params;
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect("/login");

  const deck = await getDeck(client, deckId);
  if (!deck) notFound();

  const dueCards = await getDueCards(client, deckId);

  // FR-011: "Nothing to review today" empty state
  if (dueCards.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Nothing to review today</h2>
          <p className="text-muted-foreground mb-6">
            All cards in <strong>{deck.name}</strong> are up to date. Come back
            later!
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href={`/decks/${deckId}`}>Back to Deck</Link>
            </Button>
            <Button asChild>
              <Link href="/decks">All Decks</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <StudySession
        deckId={deckId}
        deckName={deck.name}
        initialCards={dueCards}
      />
    </div>
  );
}
