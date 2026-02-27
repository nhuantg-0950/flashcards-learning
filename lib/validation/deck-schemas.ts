import { z } from "zod";

/** Schema for creating a new deck (POST /api/decks) */
export const createDeckSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or less"),
});

/** Schema for renaming a deck (PATCH /api/decks/[deckId]) */
export const updateDeckSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or less"),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
