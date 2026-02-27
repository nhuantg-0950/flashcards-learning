import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDeck } from "@/lib/db/decks";
import { DeckForm } from "@/components/decks/DeckForm";

type Props = { params: Promise<{ deckId: string }> };

export default async function EditDeckPage({ params }: Props) {
  const { deckId } = await params;
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect("/login");

  const deck = await getDeck(client, deckId);
  if (!deck) notFound();

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <DeckForm deckId={deckId} initialName={deck.name} />
    </div>
  );
}
