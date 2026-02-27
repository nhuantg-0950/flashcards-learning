import { z } from "zod";

/** Schema for creating a new card (POST /api/decks/[deckId]/cards) */
export const createCardSchema = z.object({
  front: z
    .string()
    .min(1, "Front text is required")
    .max(2000, "Front text must be 2000 characters or less"),
  back: z
    .string()
    .min(1, "Back text is required")
    .max(2000, "Back text must be 2000 characters or less"),
});

/** Schema for editing a card (PATCH /api/cards/[cardId]) */
export const updateCardSchema = z
  .object({
    front: z
      .string()
      .min(1, "Front text is required")
      .max(2000, "Front text must be 2000 characters or less")
      .optional(),
    back: z
      .string()
      .min(1, "Back text is required")
      .max(2000, "Back text must be 2000 characters or less")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one of front or back must be provided",
  });

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
