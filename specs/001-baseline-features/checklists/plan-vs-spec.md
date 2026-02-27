# Plan-vs-Spec Quality Checklist: Baseline Features

**Purpose**: Validate that the Implementation Plan (`plan.md`) fully and accurately covers every requirement in the Specification (`spec.md`), with deep focus on: (1) Authentication & session handling, (2) User data security & ownership, (3) SM-2 algorithm correctness — Again / Hard / Good / Easy state transitions.  
**Created**: 2026-02-26  
**Feature**: [`specs/001-baseline-features/spec.md`](../spec.md) ↔ [`specs/001-baseline-features/plan.md`](../plan.md)  
**Audience**: PR reviewer  
**Depth**: Formal gate — all items must pass before implementation begins

---

## A. Authentication — Requirement Completeness & Clarity

- [ ] CHK001 — Are the HTTP status codes for unauthenticated requests (`401`) explicitly specified for **every** API endpoint in the plan, not just described generically? [Completeness, Spec §FR-001–FR-010, Contracts §decks/cards/study]

- [ ] CHK002 — Does the plan define which Supabase client factory (`createServerClient` vs. `createBrowserClient`) is required in **each layer** (Route Handlers, Server Components, Client Components) rather than leaving it implied? [Clarity, Plan §Phase 1, Research §1]

- [ ] CHK003 — Is the authentication scope boundary ("Auth is out of scope; all stories assume the user is already authenticated") explicitly re-stated in the plan so that no Phase delivers a login/signup flow as a dependency blocker? [Consistency, Spec §Assumptions, Plan §Summary]

- [ ] CHK004 — Are the requirements for session propagation via cookies (set/get via `@supabase/ssr`) documented in the plan with enough specificity that an implementer knows which cookies to read in Route Handlers vs. middleware? [Clarity, Plan §Phase 1, Research §1]

- [ ] CHK005 — Does the plan specify what happens when a session cookie is expired or missing mid-request — i.e., is a `401` response the required behaviour, or is a redirect to login also acceptable? [Ambiguity, Spec §FR-001, Plan §Phase 2]

- [ ] CHK006 — Is the requirement that `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not service-role key) must be used for all user-facing operations present in the plan's Phase 1 deliverables, not only in the constitution? [Completeness, Constitution §III, Plan §Phase 1]

- [ ] CHK007 — Are the integration test requirements for the **auth-failure path** (unauthenticated request returns `401`) explicitly listed as a Phase 2 and Phase 3 deliverable, matching Constitution Principle V? [Completeness, Constitution §V, Plan §Phase 2–3, Gap]

---

## B. User Data Security & Ownership — Requirement Completeness & Consistency

- [ ] CHK008 — Does the plan require RLS policies for **all three tables** (`decks`, `cards`, `card_reviews`) to be in the **same migration file** as table creation, as mandated by the Security Policy? [Consistency, Constitution §Security Policy, Plan §Phase 1, Data-Model §RLS Policies]

- [ ] CHK009 — Is the defence-in-depth ownership check (route handler validates `user_id` even when RLS is active) documented as a deliverable for every mutating endpoint in Phase 2 and Phase 3, not only mentioned in the constitution? [Completeness, Constitution §III, Spec §FR-005/FR-010, Plan §Phase 2–3]

- [ ] CHK010 — Are the `403 Forbidden` response requirements for cross-user access attempts specified with the same consistency across all nine mutating endpoints (POST/PATCH/DELETE decks, POST/PATCH/DELETE cards, POST review)? [Consistency, Contracts §decks/cards/study, Spec §FR-005/FR-010]

- [ ] CHK011 — Does the plan explicitly state that the `service_role` key must **never** appear in `lib/supabase/client.ts` or any client-bundle path, and is this a Phase 1 acceptance criterion? [Clarity, Constitution §Security Policy, Plan §Phase 1, Gap]

- [ ] CHK012 — Is the ownership enforcement for the **review endpoint** (`POST /api/cards/[cardId]/review`) documented as requiring a check that the card's `user_id` matches the authenticated user, separate from RLS alone? [Completeness, Spec §FR-017, Plan §Phase 3, Constitution §III]

- [ ] CHK013 — Does the plan define what happens when the authenticated user submits a review for a `cardId` that does not belong to their deck — i.e., is the required error response (`403`) clearly specified? [Clarity, Contracts §study, Spec §US3 Scenario 5]

- [ ] CHK014 — Are `card_reviews` INSERT policies specified as **insert-only** (no UPDATE, no DELETE policies) in `data-model.md`, consistent with the "append-only audit log" requirement in the spec? [Consistency, Spec §Key Entities, Data-Model §card_reviews RLS]

- [ ] CHK015 — Is there a documented requirement that the `card_reviews` table's RLS SELECT policy restricts rows to `auth.uid() = user_id`, preventing a user from reading another user's review history via the API? [Completeness, Data-Model §card_reviews RLS, Gap]

- [ ] CHK016 — Does the plan specify that cascading deletes (`ON DELETE CASCADE` on `cards` and `card_reviews` FKs) are declared in the migration file, so that a Deck delete atomically removes all child records without application-layer loops? [Completeness, Spec §FR-004/FR-009, Plan §Phase 2, Data-Model §cards]

- [ ] CHK017 — Are requirements for the `SUPABASE_SERVICE_ROLE_KEY` environment variable — specifically that it must NOT be prefixed with `NEXT_PUBLIC_` — explicitly listed in the Phase 1 environment configuration deliverable? [Completeness, Constitution §Security Policy, Plan §Phase 1, Quickstart §5]

---

## C. SM-2 Algorithm — Correctness Requirements Coverage

- [ ] CHK018 — Are all four rating branches (Again=1, Hard=2, Good=3, Easy=4) individually specified with their **exact output formulas** in the plan, without relying solely on the spec cross-reference? [Completeness, Spec §FR-017, Plan §Phase 3 SM-2 table]

- [ ] CHK019 — Is the `ease_factor` floor of `1.3` documented as a **hard constraint enforced inside the pure function** (not only as a DB `CHECK` constraint), so that the floor is applied before any value is written? [Clarity, Spec §FR-018, Data-Model §cards constraints, Plan §Phase 3]

- [ ] CHK020 — Does the plan specify the **Again branch** resets `repetitions` to `0` (not decrements), `interval_days` to `1` (not `0`), and decreases `ease_factor` by `0.20`? Are all three values independently documented to prevent partial implementation? [Completeness, Spec §FR-017 Again, Plan §Phase 3]

- [ ] CHK021 — Does the plan specify the **Hard branch** leaves `repetitions` **unchanged** (neither incremented nor reset) and uses the fixed multiplier `max(1, round(interval × 1.2))` independent of `ease_factor`? Is the independence from `ease_factor` unambiguously stated? [Clarity, Spec §FR-017 Hard, Clarification Q5, Plan §Phase 3]

- [ ] CHK022 — Does the plan specify the **Good branch** interval has **three distinct sub-cases**: `1` if `repetitions` becomes 1, `6` if `repetitions` becomes 2, and `round(interval × EF)` for all subsequent reviews — and are these sub-cases individually enumerated? [Completeness, Spec §FR-017 Good, Plan §Phase 3]

- [ ] CHK023 — Does the plan specify the **Easy branch** formula as `round(interval × ease_factor × 1.3)` (three-factor multiplication), and is `ease_factor += 0.15` listed as a **post-computation** step (applied after computing the interval, not before)? [Clarity, Spec §FR-017 Easy, Plan §Phase 3]

- [ ] CHK024 — Is the SM-2 initial state (`ease_factor=2.5`, `interval_days=0`, `repetitions=0`, `next_review_date=today`) specified as a **card creation responsibility** (not a first-review default), and is this linked to both `lib/db/cards.ts` and the migration column defaults? [Consistency, Spec §FR-021, Plan §Phase 2, Data-Model §cards]

- [ ] CHK025 — Does the plan require `next_review_date` to be computed as `today (UTC) + interval_days` **server-side**, and is "UTC" explicitly stated to prevent client-timezone drift? [Clarity, Spec §FR-019, Spec §Assumptions, Plan §Phase 3]

- [ ] CHK026 — Is the `sm2.ts` function signature documented to accept `today: Date` as an explicit parameter (not `Date.now()` internally), so that unit tests can fix the date deterministically? [Clarity, Research §8, Plan §Phase 3, Gap — not in spec but required by constitution §V]

- [ ] CHK027 — Does the plan specify that `card_reviews` records capture `ease_factor_after`, `interval_days_after`, and `repetitions_after` (the **post-computation** values, not pre-computation), making the audit trail accurately reflect what was stored on the card? [Completeness, Spec §FR-020, Spec §Key Entities, Data-Model §card_reviews]

- [ ] CHK028 — Are the unit test cases for SM-2 specifically enumerated in the plan (e.g., "first review Good", "first review Easy", "repeat Again lowers ease_factor", "ease_factor floor at 1.3", "Hard interval growth", "Good interval escalation rep=1/2/n")? [Completeness, Constitution §V, Plan §Phase 3, Spec §SC-005]

- [ ] CHK029 — Does the plan document that the `review-service.ts` writes `card_reviews` INSERT and `cards` UPDATE **atomically**, and are the recovery requirements specified if one write succeeds but the other fails? [Coverage, Research §7, Plan §Phase 3, Spec §VII Observability]

- [ ] CHK030 — Is the Again re-queue behaviour (`card` pushed to end of in-memory session queue, **not** rescheduled to a future date, **but** a `card_reviews` record IS written immediately) specified consistently between the spec acceptance scenarios, FR-013, and the plan's Phase 4 session queue algorithm? [Consistency, Spec §US3 Scenario 4, Spec §FR-013, Plan §Phase 4]

---

## D. Plan–Spec Traceability & Coverage

- [ ] CHK031 — Does every Functional Requirement (FR-001 through FR-021) map to at least one named deliverable in one of the four plan phases? [Completeness, Spec §Requirements, Plan §Phases 1–4]

- [ ] CHK032 — Are all seven Success Criteria (SC-001 through SC-007) traceable to at least one plan phase deliverable or acceptance criterion — specifically SC-003 (zero scheduling drift) and SC-005 (SM-2 exact match verified by automated tests)? [Completeness, Spec §Success Criteria, Plan §Phase 3]

- [ ] CHK033 — Are the five clarification decisions (Q1–Q5 from 2026-02-26) each reflected in at least one concrete plan deliverable or constraint, rather than being documented only in the spec? [Traceability, Spec §Clarifications, Plan §Phase 3–4]

- [ ] CHK034 — Do the edge cases in the spec (mid-session Deck delete, browser close mid-session, simultaneous dual sessions, repeated Again with no cap) each have a corresponding requirement or explicit out-of-scope note in the plan? [Coverage, Spec §Edge Cases, Plan §Phase 4, Gap]

- [ ] CHK035 — Are all nine API endpoints listed in the contracts (`contracts/decks.md`, `contracts/cards.md`, `contracts/study.md`) traceable to a specific Route Handler file in the plan's project structure tree? [Completeness, Plan §Project Structure, Contracts]

---

## E. Non-Functional Requirements — Specification Clarity

- [ ] CHK036 — Is the `≤200ms p95` API response requirement specified with enough scope clarity to know whether it applies to the study fetch endpoint (`GET /api/decks/[id]/study`) with up to 500 cards, or only to the single-row review endpoint? [Clarity, Constitution §I, Spec §SC-002, Plan §Technical Context]

- [ ] CHK037 — Is the `<1s card transition` UX performance goal (SC-002) tied to a specific, measurable definition — e.g., "time from rating button tap to next card rendered" — rather than left as a subjective target? [Measurability, Spec §SC-002, Plan §Technical Context]

- [ ] CHK038 — Is the `≥90% coverage on lib/scheduling/` requirement expressed as a **merge blocker** (CI gate) in the plan, not just a best-effort goal? [Clarity, Constitution §V, Plan §Phase 3]

- [ ] CHK039 — Is the exponential backoff retry policy (delays: 1s, 2s, 4s; max 3 retries) quantified consistently across the spec (FR-016), the contracts (study.md retry table), and the plan (Phase 4 `useRetrySync` constraints)? [Consistency, Spec §FR-016, Contracts §study, Plan §Phase 4, Research §4]

- [ ] CHK040 — Are performance requirements for the Deck/Card list load (`<2s for 50 decks / 500 cards`) linked to a specific implementation approach (e.g., single query with aggregate join, btree index on `next_review_date`) in the plan? [Traceability, Spec §SC-007, Plan §Technical Context, Data-Model §indexes]

---

## Notes

- Mark items `[x]` when the requirement is confirmed present, clear, and consistent.
- Mark items with `[~]` if the requirement exists but needs wording improvement before implementation.
- Mark items `[!]` if a gap or ambiguity is found — open a spec/plan amendment before proceeding.
- **Gate rule**: All items in sections A (Auth), B (Security), and C (SM-2) must be `[x]` before Phase 1 implementation begins. Sections D and E must be resolved before Phase 3.
