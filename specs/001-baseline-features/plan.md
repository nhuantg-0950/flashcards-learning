# Implementation Plan: Baseline Features — Deck Management, Card Management, Study Session, Spaced Repetition, Auth & Tooling

**Branch**: `001-baseline-features` | **Date**: 2026-02-26 | **Updated**: 2026-02-27 | **Spec**: `specs/001-baseline-features/spec.md`
**Input**: Feature specification from `specs/001-baseline-features/spec.md`

## Summary

Build the core features of the Flashcards Learning app: (1) Deck CRUD with ownership enforcement; (2) Card CRUD with cascading deletes; (3) Study Session with optimistic-update rating loop and exponential-backoff retry; (4) SM-2 Spaced Repetition scheduling as a pure TypeScript function; (5) Context7 MCP Server for AI-assisted development; and (6) Logout functionality with complete session clearing. The technical approach uses Next.js App Router with Supabase PostgreSQL (RLS enforced), a pure `lib/scheduling/sm2.ts` module, and shadcn/ui components. Execution is split into six phases.

**Phases**:
- **Phase 1** — Supabase Setup: migrations, RLS policies, type generation, Next.js environment & Supabase client utilities ✅
- **Phase 2** — Core CRUD: Deck and Card API routes, DB layer, services, and list/detail pages ✅
- **Phase 3** — Spaced Repetition Backend: `lib/scheduling/sm2.ts` pure function, unit tests, review API route ✅
- **Phase 4** — Study Session UI: session queue hook, card flip, rating buttons, optimistic updates, retry logic, completion summary ✅
- **Phase 5** — Context7 MCP Server Setup: AI tooling configuration for development workflow 🔲 **NEXT**
- **Phase 6** — Logout Feature: Complete session clearing on client and server, redirect to login 🔲

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode — `"strict": true`, zero type errors, no `any`)  
**Primary Dependencies**: Next.js 14+ (App Router), `@supabase/ssr`, `@supabase/supabase-js`, Zod 3.x, Tailwind CSS 3.x, shadcn/ui, vitest, `@testing-library/react`, supertest  
**Storage**: Supabase PostgreSQL (hosted); migrations in `supabase/migrations/`; types generated via `supabase gen types typescript`  
**Testing**: vitest (unit + API integration via supertest), React Testing Library (component tests); ≥90% coverage on `lib/scheduling/`  
**Target Platform**: Web — desktop and mobile browsers (responsive)  
**Project Type**: web-service (fullstack Next.js — Server Components + Route Handlers)  
**Performance Goals**: ≤200ms p95 API response; <1s card transition UX (optimistic); <2s list load for 50 decks / 500 cards per deck  
**Constraints**: RLS on all user tables (non-negotiable); no service-role key in client bundle; TypeScript strict zero errors; Zod on all external inputs; no stack traces to client  
**Scale/Scope**: Single-user focus; up to 50 decks, 500 cards/deck; plain text content only for this baseline

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | **Performance-First**: ≤200ms p95 API; optimistic UI on card grading; no blocking DB queries in review handlers except single indexed row | ✅ PASS | Optimistic update in FR-014; `next_review_date` btree-indexed on `cards`; single-row update in review handler |
| II | **Schema Integrity**: `cards` table holds live scheduling state; `card_reviews` is append-only audit log | ✅ PASS | Confirmed in clarification Q1; entities match spec §Key Entities |
| III | **Security/RLS** (NON-NEGOTIABLE): RLS on all user tables; `auth.uid() = user_id`; defence-in-depth in route handlers | ✅ PASS | Phase 1 migration must include RLS policies for `decks`, `cards`, `card_reviews` in the same file |
| IV | **TypeScript Strict** (NON-NEGOTIABLE): zero type errors; Zod for all external inputs | ✅ PASS | All API route handlers use Zod schemas; `supabase gen types` feeds into all DB calls |
| V | **Test-Driven**: SM-2 unit tests mandatory; ≥90% coverage on `lib/scheduling/` | ✅ PASS | SM-2 pure function tested before Phase 3 is merged; all 4 rating branches covered |
| VI | **Modularity**: SM-2 in `lib/scheduling/sm2.ts` (pure function); DB in `lib/db/`; services in `lib/services/`; types in `types/` | ✅ PASS | Project structure below enforces this layout |
| VII | **Observability**: structured `{error: string}` JSON responses; no stack traces; graceful network failure in review loop | ✅ PASS | FR-016 retry + error banner; all route handlers return `NextResponse.json({error: ...}, {status: ...})` |

**Post-Phase-1 Re-check**: After `data-model.md` and `contracts/` are finalised, verify RLS policies cover all 3 tables and all FK indexes are declared in migration.

## Project Structure

### Documentation (this feature)

```text
specs/001-baseline-features/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   ├── decks.md
│   ├── cards.md
│   └── study.md
└── tasks.md             ← Phase 2 output (speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
.cursor/
└── mcp.json                              # Context7 MCP Server configuration

app/
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── decks/
│   ├── page.tsx                          # Deck list (Server Component)
│   ├── new/page.tsx                      # Create deck form
│   └── [deckId]/
│       ├── page.tsx                      # Deck detail + card list (Server Component)
│       ├── edit/page.tsx                 # Rename deck form
│       ├── cards/
│       │   ├── new/page.tsx              # Add card form
│       │   └── [cardId]/
│       │       └── edit/page.tsx         # Edit card form
│       └── study/
│           └── page.tsx                  # Study Session UI (Client Component)
├── api/
│   ├── auth/
│   │   └── logout/
│   │       └── route.ts                  # POST /api/auth/logout
│   ├── decks/
│   │   ├── route.ts                      # GET /api/decks, POST /api/decks
│   │   └── [deckId]/
│   │       ├── route.ts                  # PATCH /api/decks/[id], DELETE /api/decks/[id]
│   │       ├── cards/
│   │       │   └── route.ts              # GET /api/decks/[id]/cards, POST /api/decks/[id]/cards
│   │       └── study/
│   │           └── route.ts              # GET /api/decks/[id]/study
│   └── cards/
│       └── [cardId]/
│           ├── route.ts                  # PATCH /api/cards/[id], DELETE /api/cards/[id]
│           └── review/
│               └── route.ts             # POST /api/cards/[id]/review
├── layout.tsx
└── globals.css

lib/
├── scheduling/
│   └── sm2.ts                           # Pure SM-2 function (no DB, no side effects)
├── db/
│   ├── decks.ts                         # Raw Supabase queries for Deck table
│   ├── cards.ts                         # Raw Supabase queries for Card table
│   └── reviews.ts                       # Raw Supabase queries for CardReview table
├── services/
│   ├── deck-service.ts                  # Business logic + validation for Deck ops
│   ├── card-service.ts                  # Business logic + validation for Card ops
│   └── review-service.ts               # Orchestrates SM-2 + DB write in review handler
├── supabase/
│   ├── server.ts                        # createServerClient (RSC / Route Handlers)
│   └── client.ts                        # createBrowserClient (Client Components)
└── validation/
    ├── deck-schemas.ts                  # Zod schemas for Deck API inputs
    ├── card-schemas.ts                  # Zod schemas for Card API inputs
    └── review-schemas.ts               # Zod schemas for review rating input

types/
├── database.ts                          # Auto-generated by `supabase gen types typescript`
└── domain.ts                            # App-level types (Deck, Card, CardReview, SM2State, SM2Result)

components/
├── ui/                                  # shadcn/ui primitives
├── layout/
│   ├── Header.tsx                       # App header with navigation + logout button
│   └── LogoutButton.tsx                 # Client component for logout action
├── decks/
│   ├── DeckList.tsx
│   ├── DeckCard.tsx
│   └── DeckForm.tsx
├── cards/
│   ├── CardList.tsx
│   └── CardForm.tsx
└── study/
    ├── StudySession.tsx                 # Main session orchestrator (Client Component)
    ├── CardViewer.tsx                   # Front/back flip display
    ├── RatingButtons.tsx                # Again / Hard / Good / Easy
    ├── SessionSummary.tsx               # Completion screen
    └── SyncErrorBanner.tsx             # Persistent retry error banner

hooks/
├── useStudySession.ts                  # Session queue state machine + optimistic updates
├── useRetrySync.ts                     # Exponential backoff retry logic
└── useLogout.ts                        # Logout action hook with error handling

supabase/
├── migrations/
│   └── 20260226000000_baseline.sql     # All tables + RLS + indexes in one migration
└── seed.sql                            # Optional dev seed data

tests/
├── unit/
│   └── lib/
│       └── scheduling/
│           └── sm2.test.ts             # ≥90% coverage required
├── integration/
│   └── api/
│       ├── decks.test.ts
│       ├── cards.test.ts
│       ├── review.test.ts
│       └── logout.test.ts              # Logout API integration tests
└── components/
    └── study/
        └── StudySession.test.tsx

docs/
└── tooling.md                           # Context7 MCP setup documentation
```

**Structure Decision**: Single Next.js App Router project (fullstack). All business logic is in `lib/`; `app/api/` provides thin Route Handler adapters. No separate backend process.

## Implementation Phases

### Phase 1 — Supabase Setup & Next.js Configuration

**Goal**: Running Supabase project with all tables, RLS policies, indexes; `supabase gen types` feeding TypeScript; Next.js environment configured with Supabase client utilities.

**Deliverables**:
1. `supabase/migrations/20260226000000_baseline.sql` — complete migration (see `data-model.md`)
2. `lib/supabase/server.ts` and `lib/supabase/client.ts` — `@supabase/ssr` wrappers
3. `types/database.ts` — generated by `supabase gen types typescript --local > types/database.ts`
4. `.env.local` entries: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. `next.config.ts` — no special changes required beyond default App Router config

**Key constraints**:
- RLS policies for `decks`, `cards`, `card_reviews` MUST be in the same migration file as table creation
- `next_review_date` btree index MUST be declared in migration
- `updated_at` auto-update trigger function MUST be reusable across all three tables

---

### Phase 2 — Core CRUD: Decks & Cards

**Goal**: Full CRUD for Deck and Card entities via API Route Handlers, backed by `lib/db/` query functions and `lib/services/` business logic, with Zod input validation and list/detail UI pages.

**Deliverables**:
1. `lib/db/decks.ts` — `getDecks`, `getDeck`, `createDeck`, `updateDeck`, `deleteDeck`
2. `lib/db/cards.ts` — `getCards`, `getCard`, `createCard`, `updateCard`, `deleteCard`
3. `lib/services/deck-service.ts` — input sanitisation + ownership check delegation
4. `lib/services/card-service.ts` — input sanitisation + ownership check delegation
5. `lib/validation/deck-schemas.ts`, `lib/validation/card-schemas.ts` — Zod schemas
6. `app/api/decks/route.ts` — GET list, POST create
7. `app/api/decks/[deckId]/route.ts` — PATCH rename, DELETE cascade
8. `app/api/decks/[deckId]/cards/route.ts` — GET list, POST create
9. `app/api/cards/[cardId]/route.ts` — PATCH edit, DELETE single
10. UI pages: Deck list, Deck detail/card list, Deck form, Card form

**Key constraints**:
- All route handlers: authenticate via `createServerClient`, return `{error: string}` on failure, never expose stack traces
- Cascade delete for Deck relies on Postgres `ON DELETE CASCADE` (set in migration FK definitions)
- FR-021 initial scheduling state set in `createCard` DB function

---

### Phase 3 — SM-2 Spaced Repetition (Backend Logic)

**Goal**: Pure `lib/scheduling/sm2.ts` function implementing the locked SM-2 variant, fully unit-tested (≥90% coverage), wired into `POST /api/cards/[id]/review` via `lib/services/review-service.ts`.

**Deliverables**:
1. `lib/scheduling/sm2.ts` — pure function: `sm2(state: SM2State, rating: 1|2|3|4, today: Date): SM2Result`
2. `tests/unit/lib/scheduling/sm2.test.ts` — covers all 4 rating branches × multiple prior states
3. `lib/db/reviews.ts` — `insertReview`, `updateCardScheduling`
4. `lib/services/review-service.ts` — calls `sm2()`, then `updateCardScheduling` + `insertReview` atomically
5. `lib/validation/review-schemas.ts` — Zod: `{ rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]) }`
6. `app/api/cards/[cardId]/review/route.ts` — POST handler
7. `app/api/decks/[deckId]/study/route.ts` — GET handler (returns due cards, no server-side ordering)

**SM-2 formula reference** (locked — per clarification session 2026-02-26):

| Rating | repetitions | interval_days | ease_factor |
|--------|-------------|---------------|-------------|
| Again (1) | reset to 0 | set to 1 | EF -= 0.20 (floor 1.3) |
| Hard (2) | unchanged | `max(1, round(interval × 1.2))` | EF -= 0.15 (floor 1.3) |
| Good (3) | +1 | 1 if rep=1, 6 if rep=2, else `round(interval × EF)` | unchanged |
| Easy (4) | +1 | `round(interval × EF × 1.3)` | EF += 0.15 |

Init state: `EF=2.5`, `interval=0`, `repetitions=0`, `next_review_date=today(UTC)`

**Key constraints**:
- `sm2.ts` MUST be a pure function — no imports from `lib/db/`, no side effects; accepts `today: Date` as parameter for deterministic tests
- Review API MUST write `card_reviews` INSERT + `cards` UPDATE atomically
- SM-2 unit tests MUST pass before Phase 3 PR merges

---

### Phase 4 — Study Session UI

**Goal**: Complete Study Session UI with session queue state machine, card flip, optimistic updates, exponential backoff retry, and completion summary.

**Deliverables**:
1. `hooks/useStudySession.ts` — manages `queue: Card[]`, `currentIndex`, `reviewedCount`, `ratingCounts`, handles Again re-queue logic
2. `hooks/useRetrySync.ts` — wraps `fetch` with up to 3 retries (delays: 1s, 2s, 4s), returns `{status, retry}`
3. `components/study/StudySession.tsx` — top-level orchestrator
4. `components/study/CardViewer.tsx` — front/back flip (back hidden until "Reveal Answer")
5. `components/study/RatingButtons.tsx` — four buttons disabled until answer revealed
6. `components/study/SyncErrorBanner.tsx` — persistent banner with manual Retry button
7. `components/study/SessionSummary.tsx` — total reviewed, per-rating breakdown
8. `app/decks/[deckId]/study/page.tsx` — fetches due cards server-side, passes to `<StudySession>`
9. `tests/components/study/StudySession.test.tsx` — RTL tests for flip, rating, re-queue, error banner

**Session queue algorithm**:
```
queue ← fisherYatesShuffle(dueCards)
while queue is not empty:
  card ← queue[0]
  show card.front; wait for "Reveal Answer"
  show card.back + rating buttons
  onRate(rating):
    optimisticAdvance()            // immediately move to next card in UI
    enqueueSync(card.id, rating)   // fire-and-forget with retry hook
    if rating === 1 (Again):
      queue.push(card)             // re-append to end of queue
    queue.shift()                  // remove from front
show SessionSummary
```

**Key constraints**:
- Optimistic update MUST advance UI before server confirms (FR-014)
- `useRetrySync` MUST use exponential backoff: retry 1 after 1 s, retry 2 after 2 s, retry 3 after 4 s
- On 3 consecutive failures: show `<SyncErrorBanner>` with manual Retry; do NOT terminate session (FR-016)
- "Nothing to review today" empty state shown when `dueCards.length === 0` (FR-011)
- Back face MUST be hidden until user explicitly taps "Reveal Answer" (FR-012)

---

### Phase 5 — Context7 MCP Server Setup 🔲 **NEXT**

**Goal**: Configure Context7 MCP Server for AI-assisted development, enabling AI tools to fetch up-to-date library documentation directly within the development workflow.

**Deliverables**:
1. `.cursor/mcp.json` — MCP server configuration for Cursor IDE
2. `.vscode/mcp.json` — MCP server configuration for VS Code (optional, same format)
3. `docs/tooling.md` — Setup instructions and usage guide for Context7

**MCP Configuration** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**Key constraints**:
- Configuration MUST use `npx -y` to auto-install without prompts (FR-029)
- Documentation MUST include instructions for both Cursor and VS Code users (FR-030)
- No runtime dependencies — this is dev-time tooling only

**Verification**:
- Restart IDE after adding config
- AI assistant should show Context7 as available tool
- Query a library (e.g., "How to use Supabase signOut?") and verify Context7 is consulted

---

### Phase 6 — Logout Feature 🔲

**Goal**: Implement complete logout functionality that clears session on both client and server, handles errors gracefully, and redirects to login page.

**Deliverables**:
1. `app/api/auth/logout/route.ts` — POST handler that calls Supabase `signOut()` and clears cookies
2. `hooks/useLogout.ts` — Client-side hook for logout action with loading/error state
3. `components/layout/LogoutButton.tsx` — UI component for logout action
4. `components/layout/Header.tsx` — App header with navigation and logout button
5. Update `middleware.ts` — Ensure session validation redirects to login on invalid/expired session
6. Update `app/layout.tsx` — Include `<Header>` on authenticated pages

**Logout API Flow**:
```
POST /api/auth/logout
  1. Create server Supabase client
  2. Call supabase.auth.signOut()
  3. Clear auth cookies via response headers
  4. Return { success: true } or { error: string }

Client:
  1. useLogout() hook calls POST /api/auth/logout
  2. On success: router.push('/login') + router.refresh()
  3. On error: show toast/alert, do NOT redirect
```

**Key constraints**:
- Server-side signOut MUST be called to invalidate session on Supabase (FR-023)
- All auth cookies (`sb-*`) MUST be cleared in the response (FR-024)
- On network error, user MUST remain logged in — no partial state (FR-027)
- After logout, accessing protected routes MUST redirect to `/login` (FR-026)
- Browser back button after logout MUST NOT show cached protected content (FR-026)

**Cookie clearing approach**:
```typescript
// In route handler response
const response = NextResponse.json({ success: true });
response.cookies.delete('sb-access-token');
response.cookies.delete('sb-refresh-token');
// Clear any other sb-* cookies
return response;
```

**Verification tests**:
- Login → Logout → Verify redirect to /login
- After logout, navigate to /decks → Verify redirect to /login
- After logout, press Back button → Verify no protected content visible
- Simulate network error during logout → Verify user stays logged in

---

## Complexity Tracking

> No constitution violations detected. All design decisions are within established guidelines.

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 — Supabase Setup | ✅ Complete | Migration applied, types generated, env configured |
| Phase 2 — Core CRUD | ✅ Complete | All API routes, services, UI pages implemented |
| Phase 3 — SM-2 Backend | ✅ Complete | Pure function + 22 unit tests passing |
| Phase 4 — Study Session UI | ✅ Complete | Session queue, optimistic updates, retry logic |
| Phase 5 — Context7 MCP | 🔲 Next | Dev tooling — no runtime impact |
| Phase 6 — Logout | 🔲 Pending | Auth flow completion |

*Table left intentionally empty for violations — fill only if a justified violation is introduced during implementation.*
