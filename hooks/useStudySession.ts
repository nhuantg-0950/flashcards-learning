"use client";

import { useCallback, useMemo, useState } from "react";
import type { Rating } from "@/types/domain";
import { useRetrySync } from "@/hooks/useRetrySync";

/** Card shape expected from the study API */
export interface StudyCard {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
}

interface SessionState {
  /** Remaining cards in the queue */
  queue: StudyCard[];
  /** Whether the current card's back is revealed */
  isRevealed: boolean;
  /** Total cards reviewed (each card counted once, re-queued agains not double-counted) */
  reviewedCount: number;
  /** Per-rating counts */
  ratingCounts: Record<Rating, number>;
  /** Whether the session is complete */
  isComplete: boolean;
}

export interface UseStudySessionReturn extends SessionState {
  /** The current card (top of queue), or null if session is complete */
  currentCard: StudyCard | null;
  /** Reveal the back of the current card */
  revealAnswer: () => void;
  /** Rate the current card and advance */
  rateCard: (rating: Rating) => void;
  /** Whether any background sync has failed */
  hasSyncError: boolean;
  /** Failed sync tasks for display */
  failedTasks: { cardId: string; rating: number }[];
  /** Retry all failed sync tasks */
  retryAll: () => void;
  /** Total cards in the original session */
  totalCards: number;
}

/**
 * Fisher-Yates shuffle (in-place).
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useStudySession(
  initialCards: StudyCard[]
): UseStudySessionReturn {
  const shuffled = useMemo(() => shuffle(initialCards), [initialCards]);
  const totalCards = initialCards.length;

  const [state, setState] = useState<SessionState>({
    queue: shuffled,
    isRevealed: false,
    reviewedCount: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0 },
    isComplete: shuffled.length === 0,
  });

  const { enqueueSync, hasSyncError, failedTasks, retryAll } = useRetrySync();

  const currentCard = state.queue.length > 0 ? state.queue[0] : null;

  const revealAnswer = useCallback(() => {
    setState((prev) => ({ ...prev, isRevealed: true }));
  }, []);

  const rateCard = useCallback(
    (rating: Rating) => {
      setState((prev) => {
        if (prev.queue.length === 0) return prev;

        const card = prev.queue[0];
        const rest = prev.queue.slice(1);

        // Fire-and-forget sync (optimistic)
        enqueueSync(card.id, rating);

        // If Again (1), re-append to end of queue
        const newQueue = rating === 1 ? [...rest, card] : rest;

        const newRatingCounts = { ...prev.ratingCounts };
        newRatingCounts[rating] = (newRatingCounts[rating] || 0) + 1;

        return {
          queue: newQueue,
          isRevealed: false,
          reviewedCount: prev.reviewedCount + 1,
          ratingCounts: newRatingCounts,
          isComplete: newQueue.length === 0,
        };
      });
    },
    [enqueueSync]
  );

  return {
    ...state,
    currentCard,
    revealAnswer,
    rateCard,
    hasSyncError,
    failedTasks,
    retryAll,
    totalCards,
  };
}
