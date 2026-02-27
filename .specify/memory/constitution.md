<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0  (initial ratification)
Modified principles: N/A – first version
Added sections:
  - Core Principles (I–VII)
  - Database & Schema Standards
  - Security & Data Ownership
  - Development Workflow
  - Governance
Templates checked:
  - .specify/templates/plan-template.md   ✅ aligned (Constitution Check section present)
  - .specify/templates/spec-template.md   ✅ aligned (FR/entity model section present)
  - .specify/templates/tasks-template.md  ✅ aligned (phase structure maps to principles)
Follow-up TODOs: none – all fields resolved
-->

# Flashcards Learning Constitution

## Core Principles

### I. Performance-First Learning Loop (NON-NEGOTIABLE)

Every user-facing action in the study/review flow MUST complete without perceptible lag.

- API routes that serve the active review session MUST respond in **≤ 200 ms p95** under
  normal load.
- Card grading (submitting a review result) MUST be optimistic: the UI MUST update
  immediately on the client side; the server sync runs in the background.
- Heavy computations (scheduling, statistics aggregation) MUST be deferred out of the
  hot path (background jobs, server components, or React Suspense boundaries).
- No blocking database queries are permitted inside the review session route handlers
  unless they touch a single indexed row.

**Rationale**: Spaced repetition effectiveness depends on a frictionless review experience.
Any perceptible stutter breaks user flow and undermines retention.

### II. Schema Integrity for Spaced Repetition

The database schema is the contract for the scheduling algorithm and MUST NOT be
compromised for short-term convenience.

- The `card_reviews` table MUST store: `ease_factor`, `interval_days`, `repetitions`,
  `next_review_date`, `last_reviewed_at`, `rating` (0-5 scale), and a FK to both `card_id`
  and `user_id`.
- `ease_factor` defaults MUST follow SM-2 initialisation: `2.5`.
- `next_review_date` MUST always be maintained as an indexed column.
- Schema migrations MUST be additive; destructive changes require a constitution amendment
  and a data-migration plan.
- No application logic that recalculates scheduling state is permitted to skip writing the
  result back to the canonical columns listed above.

**Rationale**: Correctness of the spaced-repetition algorithm depends entirely on the
fidelity of the persisted scheduling state. Drift between application state and DB state
produces incorrect intervals and harms learner outcomes.

### III. Security & Row-Level Ownership (NON-NEGOTIABLE)

Users MUST only ever read or mutate their own data.

- Supabase Row Level Security (RLS) MUST be enabled on every table that holds user data:
  `decks`, `cards`, `card_reviews`, and any future user-scoped tables.
- RLS policies MUST enforce `auth.uid() = user_id` for SELECT, INSERT, UPDATE, and DELETE
  on all user-scoped tables.
- API route handlers MUST NOT bypass RLS (i.e., MUST use the anon/user Supabase client, not
  the service-role client, for user-data operations).
- The service-role key MUST only be used for server-side administrative tasks
  (seeding, migrations, webhooks) and MUST never be exposed to the client bundle.
- All API routes that modify data MUST validate that the authenticated user owns the
  target resource before any write is performed, even if RLS is active (defence in depth).

**Rationale**: Multi-tenant SaaS applications face significant risk from insecure direct
object references. RLS provides a database-level guarantee, and the defence-in-depth
check in the route handler provides an application-level guard.

### IV. TypeScript Strict Mode (NON-NEGOTIABLE)

All TypeScript code in this project MUST compile with `"strict": true` and zero type
errors.

- `any` is FORBIDDEN unless accompanied by a `// eslint-disable-next-line` comment with
  a written justification.
- All function signatures (parameters and return types) exposed in `lib/`, `services/`,
  and `app/api/` MUST be explicitly typed; inference is acceptable only for internal,
  non-exported values.
- Zod (or an equivalent runtime validator) MUST be used to validate all external inputs
  (request bodies, query params, Supabase responses cast from `unknown`).

**Rationale**: Strict TypeScript prevents entire classes of runtime bugs and makes the
codebase refactorable with confidence, especially important as the scheduling algorithm
evolves.

### V. Test-Driven Quality Gates

Automated tests MUST exist before a PR can be merged for any scheduling or data-mutation
logic.

- The SM-2 scheduling algorithm MUST have unit tests covering: first review, repeated
  correct answers, hard/fail ratings, ease-factor floor (≥ 1.3), and interval-reset on
  failure.
- API route handlers MUST have integration tests (using `vitest` + `supertest` or
  Next.js route testing utilities) for the happy path and auth-failure path.
- UI components for the review flow MUST have component tests (React Testing Library)
  verifying optimistic updates and error fallback rendering.
- Test coverage for `lib/scheduling/` MUST remain ≥ 90 %.

**Rationale**: The scheduling algorithm is algorithmic logic with correctness requirements;
regression testing is mandatory. API security tests ensure RLS and route-level guards work
together correctly.

### VI. Component & API Modularity

Code MUST be organised so that scheduling logic, data access, and UI concerns are
separated and independently testable.

- The SM-2 implementation MUST live in `lib/scheduling/sm2.ts` as a pure function with no
  framework or DB dependencies.
- All Supabase queries MUST be encapsulated in `lib/db/` modules; no raw Supabase calls
  are permitted in React components or route handlers directly.
- API route handlers MUST delegate to service functions in `lib/services/`; route files
  MUST contain only: input validation, service call, and response serialisation.
- Shared TypeScript types MUST be defined in `types/` and imported, never re-declared.

**Rationale**: Modularity makes the scheduling logic portable (e.g., testable in isolation,
replaceable with SM-2 variants or FSRS in the future) and prevents the route-handler layer
from becoming a ball-of-mud.

### VII. Observability & Error Transparency

Errors MUST be surfaced to the developer without leaking sensitive data to the client.

- All API route handlers MUST catch errors and return structured JSON: `{ error: string }`.
- Internal error details (stack traces, DB error messages) MUST be logged server-side
  (via `console.error` or a structured logger) and MUST NOT appear in client responses.
- The review session MUST gracefully handle network failures with a visible error state
  (not a blank screen or silent failure).
- Supabase client errors MUST be checked (never fire-and-forget on mutations affecting
  scheduling state).

**Rationale**: Silent failures in the review loop corrupt scheduling state without the
user knowing, which is worse than a visible error.

## Database & Schema Standards

These standards extend Principle II and apply to all Supabase migrations.

- Migrations MUST be idempotent and written in SQL under `supabase/migrations/`.
- Every foreign key MUST have a corresponding index unless it is already the primary key.
- `created_at` and `updated_at` (auto-managed via trigger) columns MUST exist on every
  table.
- `next_review_date` on `card_reviews` MUST be indexed (`btree`) to support efficient
  "cards due today" queries.
- Enums (e.g., card rating scale) MUST be defined as Postgres `enum` types or constrained
  integer columns — never free-text strings.

## Security & Data Ownership Policy

This section operationalises Principle III.

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  are safe for client exposure. `SUPABASE_SERVICE_ROLE_KEY` MUST only exist in server
  environment and MUST be excluded from the client bundle (never prefix with
  `NEXT_PUBLIC_`).
- New developers MUST run `supabase db reset` locally to ensure RLS policies are active
  before any manual testing.
- Any PR that adds a new table MUST include the corresponding RLS policies in the same
  migration file.
- Auth session tokens MUST be handled exclusively via Supabase Auth helpers
  (`@supabase/ssr`); custom JWT handling is forbidden.

## Development Workflow

- **Branching**: `main` is always deployable. Feature work happens on
  `[###-short-description]` branches. PRs require at least one approval.
- **Constitution Check in PRs**: Every PR description MUST include a "Constitution Check"
  section confirming compliance with Principles I–VII or documenting justified exceptions.
- **Migrations**: Database schema changes MUST be reviewed independently from feature
  logic changes (separate commits strongly preferred, separate PR acceptable).
- **Performance budget**: Before merging any change to the review session flow, run
  Lighthouse or equivalent; Core Web Vitals regression is a merge blocker.
- **Dependency additions**: New `npm` packages MUST be evaluated for bundle size impact
  (`bundlephobia`) before adoption. Client-side packages adding > 50 kB gzipped require
  explicit justification in the PR.

## Governance

This constitution supersedes all other written or verbal project conventions. In cases of
conflict, the constitution takes precedence.

**Amendment procedure**:
1. Open a PR modifying `.specify/memory/constitution.md`.
2. State the version bump type (MAJOR / MINOR / PATCH) and rationale in the PR description.
3. Obtain approval from at least one other contributor (or the project owner for solo
   projects).
4. Update `LAST_AMENDED_DATE` to the merge date.
5. Update all dependent templates and agent guidance files as identified in the Sync
   Impact Report (embedded as an HTML comment at the top of this file).

**Versioning policy** (semantic):
- MAJOR — backward-incompatible removal or redefinition of a principle.
- MINOR — new principle or section added, or materially expanded guidance.
- PATCH — clarifications, wording fixes, typo corrections.

**Compliance review**: All PRs must self-certify compliance in the PR description. The
tech lead (or solo author) is responsible for periodic audits (recommended: every sprint).

**Version**: 1.0.0 | **Ratified**: 2026-02-26 | **Last Amended**: 2026-02-26
