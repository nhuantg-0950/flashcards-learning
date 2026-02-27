"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CardFormProps {
  deckId: string;
  /** When provided, the form is in "edit" mode */
  cardId?: string;
  initialFront?: string;
  initialBack?: string;
}

export function CardForm({
  deckId,
  cardId,
  initialFront = "",
  initialBack = "",
}: CardFormProps) {
  const router = useRouter();
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEdit = !!cardId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isEdit ? `/api/cards/${cardId}` : `/api/decks/${deckId}/cards`;
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: front.trim(), back: back.trim() }),
      });

      if (res.ok) {
        router.push(`/decks/${deckId}`);
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
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Card" : "Add New Card"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-front">Front</Label>
            <Input
              id="card-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Question or term"
              maxLength={2000}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-back">Back</Label>
            <Input
              id="card-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Answer or definition"
              maxLength={2000}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || !front.trim() || !back.trim()}
            >
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Card"}
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
