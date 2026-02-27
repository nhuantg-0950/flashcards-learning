import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeckForm } from "@/components/decks/DeckForm";

export default async function NewDeckPage() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <DeckForm />
    </div>
  );
}
