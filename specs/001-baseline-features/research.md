# Research: Baseline Features — Flashcards Learning App

**Branch**: `001-baseline-features` | **Date**: 2026-02-26

---

## 1. Supabase Client Setup with `@supabase/ssr`

**Decision**: Use `@supabase/ssr` for server-side auth and client-side auth separately.

**Rationale**: Next.js App Router mixes Server Components, Route Handlers, and Client Components. `@supabase/ssr` provides the correct cookie-based session propagation for each context.

**Pattern**:

```ts
// lib/supabase/server.ts  (Server Components + Route Handlers)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Route Handler context ignores header-setting errors */ }
        },
      },
    }
  )
}
```

```ts
// lib/supabase/client.ts  (Client Components only)
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Alternatives considered**: `@supabase/auth-helpers-nextjs` — deprecated in favour of `@supabase/ssr`; rejected.

---

## 2. Next.js App Router — Data Fetching Pattern

**Decision**: Server Components fetch data directly using the server Supabase client. Route Handlers handle mutations and return JSON.

**Rationale**: Server Components eliminate client-side waterfall fetches for lists. Route Handlers keep auth logic server-side (no client-exposed logic). This matches the performance goal of <2s list loads.

**Pattern**:

- **Deck list / Card list**: `app/decks/page.tsx` is an `async` Server Component that calls `lib/db/decks.ts` directly.
- **Study session seed**: `app/decks/[deckId]/study/page.tsx` fetches due cards server-side and passes them as props to the `<StudySession>` Client Component.
- **Mutations (create, rename, delete, review)**: All go through `app/api/**` Route Handlers. Client Components call `fetch('/api/...')`.

**Alternatives considered**: React Server Actions — considered, but Route Handlers provide cleaner separation for retry-able `fetch` calls in the study loop, which needs explicit URL-based retries.

---

## 3. Optimistic Update Pattern for Card Rating

**Decision**: Manual state management using React `useReducer` inside `useStudySession.ts`. No external library.

**Rationale**: The session queue has custom logic (Again re-queue, retry pending state, error banner). `useReducer` keeps the state transitions explicit and testable. React 18's `useOptimistic` is an alternative but is designed for server action integration, which we are not using.

**State shape**:

```ts
type SessionState = {
  queue: Card[]                    // remaining cards (front = current)
  completed: RatedCard[]           // cards removed from queue
  pendingSyncs: Map<string, PendingSync>  // cardId → sync state
  syncErrors: SyncError[]          // persistent failures awaiting manual retry
  phase: 'reviewing' | 'summary'
}
```

**Optimistic flow**:
1. User taps rating → dispatch `RATE_CARD` action → queue advances immediately
2. `useRetrySync` fires `POST /api/cards/[id]/review` in background
3. On success → dispatch `SYNC_SUCCESS`
4. On final failure → dispatch `SYNC_FAILED` → `<SyncErrorBanner>` appears

**Alternatives considered**: Zustand, Jotai — rejected as unnecessary external dependency for a single-page state machine.

---

## 4. Retry Logic with Exponential Backoff

**Decision**: Custom `useRetrySync` hook using `setTimeout`-based delays.

**Rationale**: No additional dependencies needed. The retry policy is fixed (3 attempts, delays: 1s / 2s / 4s), making a custom implementation straightforward and fully testable with `vi.useFakeTimers()`.

**Pattern**:

```ts
async function retryFetch(
  url: string,
  body: unknown,
  maxRetries = 3
): Promise<Response> {
  const delays = [1000, 2000, 4000]
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) return res
      throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      lastError = err as Error
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]))
      }
    }
  }
  throw lastError!
}
```

**Alternatives considered**: `retry` npm package, `p-retry` — rejected to avoid an extra dependency for trivial retry logic.

---

## 5. Session Queue Data Structure

**Decision**: Use a plain JavaScript `array` with `shift()` / `push()` operations managed by `useReducer`.

**Rationale**: The queue is small (bounded by due cards, typically <50). O(n) `shift()` is negligible. A React-friendly immutable array approach (`[...queue.slice(1)]`) is cleaner than index-pointer gymnastics in reducer logic.

**Operations**:
- Advance: `queue = [...queue.slice(1)]` (remove front)
- Again re-queue: `queue = [...queue.slice(1), currentCard]` (move front to back)
- Shuffle at start: Fisher-Yates in-place on a copy of the array

**Alternatives considered**: Circular buffer / linked list — unnecessary complexity for queue sizes well under 100 items.

---

## 6. `supabase gen types typescript` Workflow

**Decision**: Generate types once after migration, commit `types/database.ts` to the repo.

**Rationale**: Generated types provide fully typed Supabase query responses with zero runtime overhead. Committing the file means CI doesn't require Supabase CLI at runtime.

**Workflow**:

```bash
# After applying migration:
supabase gen types typescript --local > types/database.ts

# Re-run if schema changes:
supabase gen types typescript --local > types/database.ts
```

`types/database.ts` feeds into both `lib/supabase/server.ts` and `lib/supabase/client.ts` via the `Database` generic.

**Alternatives considered**: Runtime schema inference — rejected; adds latency and loses TypeScript benefits.

---

## 7. Transaction Handling for Review Write

**Decision**: Sequential awaits inside the Route Handler (INSERT `card_reviews`, then UPDATE `cards`). Use Supabase RPC if atomicity is required.

**Rationale**: Supabase JS client does not expose multi-statement transactions directly. The safest atomic approach is a Postgres function (RPC). However, for this baseline, if `card_reviews` INSERT succeeds but `cards` UPDATE fails, the card will re-appear in the next session (safe degraded behaviour). We will implement as sequential awaits in Phase 3 and promote to RPC if integration tests reveal consistency issues.

**RPC fallback pattern** (if needed):

```sql
-- supabase/migrations/20260226000000_baseline.sql
CREATE OR REPLACE FUNCTION record_review(
  p_card_id uuid, p_user_id uuid, p_rating int,
  p_ease_factor numeric, p_interval_days int, p_repetitions int,
  p_next_review_date date
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO card_reviews (card_id, user_id, rating, ease_factor_after, interval_days_after, repetitions_after)
    VALUES (p_card_id, p_user_id, p_rating, p_ease_factor, p_interval_days, p_repetitions);
  UPDATE cards SET ease_factor=p_ease_factor, interval_days=p_interval_days,
    repetitions=p_repetitions, next_review_date=p_next_review_date,
    updated_at=now() WHERE id=p_card_id AND user_id=p_user_id;
END;
$$;
```

**Alternatives considered**: Prisma transactions — rejected (would introduce Prisma alongside Supabase; unnecessary complexity).

---

## 8. SM-2 Pure Function Design

**Decision**: Export a single function `sm2(state: SM2State, rating: 1|2|3|4, today: Date): SM2Result`.

**Rationale**: Pure function with no side effects makes unit testing deterministic. Accepting `today` as a parameter (not `Date.now()` internally) allows tests to fix the date.

**Type signatures**:

```ts
export type SM2State = {
  easeFactor: number    // default 2.5
  intervalDays: number  // default 0
  repetitions: number   // default 0
}

export type SM2Result = {
  easeFactor: number
  intervalDays: number
  repetitions: number
  nextReviewDate: string  // ISO date string YYYY-MM-DD (UTC)
}

export function sm2(state: SM2State, rating: 1 | 2 | 3 | 4, today: Date): SM2Result
```

**Alternatives considered**: Class-based SM2 calculator — rejected; pure function is simpler, more testable, and matches Principle VI.

---

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Supabase client | `@supabase/ssr` — `createServerClient` + `createBrowserClient` |
| Data fetching | Server Components for reads; Route Handlers for mutations |
| Optimistic update | `useReducer` in `useStudySession.ts` — manual state machine |
| Retry logic | Custom `useRetrySync` hook, 3 attempts, 1s/2s/4s delays |
| Queue data structure | Plain array with `slice`/`push`, Fisher-Yates shuffle |
| Type generation | `supabase gen types typescript --local`, committed to repo |
| Review transaction | Sequential awaits; RPC promoted if consistency issues arise |
| SM-2 function | Pure function, accepts `today: Date` for testability |
