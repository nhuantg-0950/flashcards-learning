import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCard } from "@/lib/db/cards";
import { CardForm } from "@/components/cards/CardForm";

type Props = { params: Promise<{ deckId: string; cardId: string }> };

export default async function EditCardPage({ params }: Props) {
  const { deckId, cardId } = await params;
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect("/login");

  const card = await getCard(client, cardId);
  if (!card) notFound();

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <CardForm
        deckId={deckId}
        cardId={cardId}
        initialFront={card.front}
        initialBack={card.back}
      />
    </div>
  );
}
