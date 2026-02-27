import { z } from "zod";

/** Schema for submitting a card review (POST /api/cards/[cardId]/review) */
export const reviewSchema = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
