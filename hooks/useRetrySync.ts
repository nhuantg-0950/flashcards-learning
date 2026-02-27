"use client";

import { useCallback, useRef, useState } from "react";

type SyncStatus = "idle" | "syncing" | "failed";

interface SyncTask {
  cardId: string;
  rating: number;
  attempts: number;
  status: SyncStatus;
}

interface UseRetrySyncReturn {
  /** Enqueue a review for background sync with retry */
  enqueueSync: (cardId: string, rating: number) => void;
  /** Whether any sync has permanently failed (3 retries exhausted) */
  hasSyncError: boolean;
  /** List of failed sync tasks for manual retry */
  failedTasks: SyncTask[];
  /** Manually retry all failed tasks */
  retryAll: () => void;
}

const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s
const MAX_ATTEMPTS = 4; // 1 initial + 3 retries

async function postReview(cardId: string, rating: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/cards/${cardId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useRetrySync(): UseRetrySyncReturn {
  const [failedTasks, setFailedTasks] = useState<SyncTask[]>([]);
  const pendingRef = useRef<Map<string, SyncTask>>(new Map());

  const syncWithRetry = useCallback(async (task: SyncTask) => {
    const key = `${task.cardId}-${Date.now()}`;
    pendingRef.current.set(key, task);

    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      const ok = await postReview(task.cardId, task.rating);
      if (ok) {
        pendingRef.current.delete(key);
        return;
      }

      attempts++;
      if (attempts < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAYS[attempts - 1]);
      }
    }

    // All retries exhausted — mark as failed
    const failedTask: SyncTask = {
      ...task,
      attempts,
      status: "failed",
    };
    pendingRef.current.delete(key);
    setFailedTasks((prev) => [...prev, failedTask]);
  }, []);

  const enqueueSync = useCallback(
    (cardId: string, rating: number) => {
      const task: SyncTask = {
        cardId,
        rating,
        attempts: 0,
        status: "syncing",
      };
      // Fire-and-forget — don't await
      syncWithRetry(task);
    },
    [syncWithRetry]
  );

  const retryAll = useCallback(() => {
    const tasksToRetry = [...failedTasks];
    setFailedTasks([]);
    for (const task of tasksToRetry) {
      syncWithRetry({ ...task, attempts: 0, status: "syncing" });
    }
  }, [failedTasks, syncWithRetry]);

  return {
    enqueueSync,
    hasSyncError: failedTasks.length > 0,
    failedTasks,
    retryAll,
  };
}
