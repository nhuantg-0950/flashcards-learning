"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SyncErrorBannerProps {
  failedCount: number;
  onRetry: () => void;
}

export function SyncErrorBanner({
  failedCount,
  onRetry,
}: SyncErrorBannerProps) {
  return (
    <Alert variant="destructive" className="w-full max-w-xl mx-auto">
      <AlertTitle>Sync Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          {failedCount} review{failedCount !== 1 ? "s" : ""} failed to sync.
          Your session continues — retries will not affect your progress.
        </span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
