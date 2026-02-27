import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDecks } from "@/lib/db/decks";
import { DeckList } from "@/components/decks/DeckList";
import { Button } from "@/components/ui/button";

export default async function DecksPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect("/login");

  const decks = await getDecks(client);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Decks</h1>
          <p className="text-muted-foreground mt-1">
            {decks.length} {decks.length === 1 ? "deck" : "decks"}
          </p>
        </div>
        <Button asChild>
          <Link href="/decks/new">New Deck</Link>
        </Button>
      </div>
      <DeckList decks={decks} />
    </div>
  );
}
