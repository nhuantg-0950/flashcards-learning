"use client";

import { useStudySession, type StudyCard } from "@/hooks/useStudySession";
import { CardViewer } from "@/components/study/CardViewer";
import { RatingButtons } from "@/components/study/RatingButtons";
import { SyncErrorBanner } from "@/components/study/SyncErrorBanner";
import { SessionSummary } from "@/components/study/SessionSummary";

interface StudySessionProps {
  deckId: string;
  deckName: string;
  initialCards: StudyCard[];
}

export function StudySession({
  deckId,
  deckName,
  initialCards,
}: StudySessionProps) {
  const {
    currentCard,
    isRevealed,
    isComplete,
    reviewedCount,
    ratingCounts,
    queue,
    totalCards,
    revealAnswer,
    rateCard,
    hasSyncError,
    failedTasks,
    retryAll,
  } = useStudySession(initialCards);

  // Session complete
  if (isComplete) {
    return (
      <div className="space-y-4">
        {hasSyncError && (
          <SyncErrorBanner
            failedCount={failedTasks.length}
            onRetry={retryAll}
          />
        )}
        <SessionSummary
          deckId={deckId}
          deckName={deckName}
          reviewedCount={reviewedCount}
          ratingCounts={ratingCounts}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Sync error banner */}
      {hasSyncError && (
        <SyncErrorBanner failedCount={failedTasks.length} onRetry={retryAll} />
      )}

      {/* Progress indicator */}
      <div className="text-sm text-muted-foreground text-center">
        <span className="font-medium">{deckName}</span>
        <span className="mx-2">·</span>
        <span>
          {reviewedCount} reviewed · {queue.length} remaining
        </span>
      </div>

      {/* Card viewer */}
      {currentCard && (
        <CardViewer
          front={currentCard.front}
          back={currentCard.back}
          isRevealed={isRevealed}
          onReveal={revealAnswer}
        />
      )}

      {/* Rating buttons — only visible after reveal */}
      {isRevealed && <RatingButtons disabled={false} onRate={rateCard} />}

      {/* Progress bar */}
      <div className="w-full max-w-xl mx-auto">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{
              width:
                totalCards > 0
                  ? `${(reviewedCount / totalCards) * 100}%`
                  : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
