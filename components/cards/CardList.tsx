"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CardListItem {
  id: string;
  front: string;
  back: string;
}

interface CardListProps {
  deckId: string;
  cards: CardListItem[];
}

export function CardList({ deckId, cards }: CardListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(cardId: string) {
    if (!confirm("Delete this card? This cannot be undone.")) return;

    setDeletingId(cardId);
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete card");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No cards in this deck yet.</p>
        <Button asChild className="mt-4">
          <Link href={`/decks/${deckId}/cards/new`}>Add Your First Card</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card, i) => (
        <div
          key={card.id}
          className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
          <span className="text-sm text-muted-foreground font-mono min-w-[2rem]">
            {i + 1}.
          </span>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-medium truncate">{card.front}</p>
            <p className="text-sm text-muted-foreground truncate">
              {card.back}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/decks/${deckId}/cards/${card.id}/edit`}>Edit</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={deletingId === card.id}
              onClick={() => handleDelete(card.id)}
            >
              {deletingId === card.id ? "…" : "Delete"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
