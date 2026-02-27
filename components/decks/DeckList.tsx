"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Deck } from "@/types/domain";

interface DeckListProps {
  decks: Deck[];
}

export function DeckList({ decks }: DeckListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(deckId: string) {
    if (
      !confirm(
        "Are you sure you want to delete this deck? All cards and reviews will be permanently removed."
      )
    ) {
      return;
    }

    setDeletingId(deckId);
    try {
      const res = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete deck");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (decks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No decks yet.</p>
        <p className="text-muted-foreground text-sm mt-1">
          Create your first deck to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <Card key={deck.id} className="group relative">
          <Link href={`/decks/${deck.id}`}>
            <CardHeader>
              <CardTitle className="truncate">{deck.name}</CardTitle>
              <CardDescription>
                {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Created {new Date(deck.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Link>
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/decks/${deck.id}/edit`}>Edit</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={deletingId === deck.id}
              onClick={(e) => {
                e.preventDefault();
                handleDelete(deck.id);
              }}
            >
              {deletingId === deck.id ? "…" : "Delete"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
