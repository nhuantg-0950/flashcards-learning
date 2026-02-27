"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DeckFormProps {
  /** When provided, the form is in "edit" mode */
  deckId?: string;
  initialName?: string;
}

export function DeckForm({ deckId, initialName = "" }: DeckFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEdit = !!deckId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isEdit ? `/api/decks/${deckId}` : "/api/decks";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          router.push(`/decks/${deckId}`);
        } else {
          router.push(`/decks/${data.deck.id}`);
        }
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Rename Deck" : "Create New Deck"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deck-name">Deck Name</Label>
            <Input
              id="deck-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Japanese Vocabulary"
              maxLength={255}
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Deck"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
