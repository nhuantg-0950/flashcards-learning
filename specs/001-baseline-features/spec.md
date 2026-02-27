# Feature Specification: Baseline Features — Deck Management, Card Management, Study Session, Spaced Repetition, Auth & Tooling

**Feature Branch**: `001-baseline-features`
**Created**: 2026-02-26
**Updated**: 2026-02-27
**Status**: Draft
**Input**: User description: "Baseline features: Deck Management, Card Management, Study Session with due-card queue, SM-2 Spaced Repetition algorithm, Logout functionality, and Context7 MCP Server tooling"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Manage Decks (Priority: P1)

A registered user can create a named Deck, view all their Decks in a list, rename a Deck,
and permanently delete a Deck (including all its Cards and review history).

**Why this priority**: Decks are the top-level container for all content. Without the
ability to create at least one Deck, no other feature is reachable. This is the foundation
of every other user story.

**Independent Test**: Can be fully tested by creating, renaming, listing, and deleting a
Deck with no Cards present. Delivers a usable content-organisation tool even before Cards
exist.

**Acceptance Scenarios**:

1. **Given** a logged-in user with no Decks, **When** they submit a non-empty Deck name,
   **Then** a new Deck appears in their Deck list and no other user can see it.
2. **Given** a logged-in user with an existing Deck, **When** they change the name to a
   different non-empty string, **Then** the Deck list shows the updated name immediately.
3. **Given** a logged-in user with an existing Deck, **When** they confirm deletion,
   **Then** the Deck and all its Cards and review records are permanently removed and the
   list no longer shows it.
4. **Given** a logged-in user, **When** they view the Deck list, **Then** they see only
   their own Decks (not decks belonging to other users).
5. **Given** any user, **When** they attempt to access or modify another user's Deck
   (e.g., via direct URL or API), **Then** the system rejects the request with an
   authorisation error.

---

### User Story 2 — Manage Cards inside a Deck (Priority: P2)

A registered user can add Cards to one of their Decks (each Card has a front face /
question and a back face / answer), view all Cards in a Deck, edit Card content, and delete
individual Cards.

**Why this priority**: Cards are the atomic unit of learning. A Deck without Cards has no
study value. This story unlocks the ability to populate content before any study session
begins.

**Independent Test**: Can be fully tested by adding, listing, editing, and deleting Cards
inside a single Deck, with no study session required. Delivers a complete
content-authoring workflow.

**Acceptance Scenarios**:

1. **Given** a logged-in user viewing one of their Decks, **When** they submit a Card with
   a non-empty front and a non-empty back, **Then** the Card appears in the Card list for
   that Deck.
2. **Given** a logged-in user with an existing Card, **When** they save edited front or
   back text, **Then** the Card list reflects the updated content.
3. **Given** a logged-in user with an existing Card, **When** they confirm deletion,
   **Then** the Card and all associated review history are permanently removed.
4. **Given** a logged-in user viewing a Deck, **When** they open a Card's detail,
   **Then** both the front and back text are displayed correctly.
5. **Given** any user, **When** they attempt to add, edit, or delete a Card in a Deck they
   do not own, **Then** the system rejects the request with an authorisation error.

---

### User Story 3 — Conduct a Study Session (Priority: P3)

A registered user can start a Study Session for a Deck. The session shows only Cards that
are due today (or overdue). For each Card the user sees the front face first; pressing
"Reveal Answer" shows the back face and four rating buttons: **Again**, **Hard**, **Good**,
**Easy**. After rating the last due Card, the session ends with a completion summary.

**Why this priority**: This is the primary learning interaction. It depends on Decks and
Cards existing (US1, US2), but also drives the scheduling data that US4 (SM-2 algorithm)
depends on.

**Independent Test**: Can be fully tested by seeding a Deck with a few Cards that have a
review date of today or earlier, starting a session, rating each Card, and verifying the
session completes and shows a summary. Delivers the core learning loop even before the
full scheduling algorithm is wired in.

**Acceptance Scenarios**:

1. **Given** a Deck with Cards whose review date is today or earlier, **When** the user
   starts a Study Session, **Then** only the due Cards are presented (not future-scheduled
   Cards).
2. **Given** a Deck with no Cards due today, **When** the user navigates to Study Session,
   **Then** a "Nothing to review today" message is shown and no Cards are presented.
3. **Given** a Card is being reviewed, **When** the user sees the front face, **Then** the
   back face is hidden until the user explicitly taps "Reveal Answer".
4. **Given** the answer is revealed, **When** the user selects **Again**,
   **Then** the Card is pushed to the end of the current session queue, a new
   `CardReview` record is written for this rating, and the next Card in the queue is shown.
   **Given** the user selects **Hard / Good / Easy**, **Then** the rating is recorded, the
   Card is removed from the queue, and the next due Card is shown (or the session ends if
   it was the last Card).
5. **Given** the session completes, **When** the last Card has been rated, **Then** a
   summary screen shows how many Cards were reviewed and a breakdown by rating.
6. **Given** a network error occurs during rating submission, **When** the user taps a
   rating button, **Then** the UI reflects the rating immediately (optimistic update),
   the client retries silently up to 3 times with exponential backoff. If all retries
   fail, a persistent error banner appears with a "Retry" button; the session does not
   terminate and the user does not need to re-rate the Card.

---

### User Story 4 — SM-2 Spaced Repetition Scheduling (Priority: P4)

After the user rates a Card during a Study Session, the system recalculates the Card's
scheduling parameters (`ease_factor`, `interval_days`, `repetitions`) using the SM-2
algorithm and sets a new `next_review_date`. The Card reappears in future sessions on the
correct computed date.

**Why this priority**: This story provides the intelligence behind the app. It depends on
the Study Session (US3) to supply ratings. Without it the app is a plain flashcard viewer;
with it retention is scientifically optimised.

**Independent Test**: Can be fully tested by rating a Card with each of the four options
and verifying that `next_review_date`, `interval_days`, `ease_factor`, and `repetitions`
are updated according to SM-2 rules. No additional UI work is required beyond what US3
already provides.

**Acceptance Scenarios**:

1. **Given** a brand-new Card reviewed for the first time with "Good", **When** the rating
   is submitted, **Then** `interval_days` is 1, `repetitions` is 1, `ease_factor` remains
   2.5, and `next_review_date` is tomorrow.
2. **Given** a brand-new Card reviewed for the first time with "Easy", **When** the rating
   is submitted, **Then** `interval_days` is 4, `repetitions` is 1, and `next_review_date`
   is 4 days from today.
3. **Given** a Card with any prior history reviewed with "Again", **When** the rating is
   submitted, **Then** `interval_days` resets to 1, `repetitions` resets to 0, and the
   Card is rescheduled to tomorrow.
4. **Given** any review, **When** the computed `ease_factor` would fall below 1.3,
   **Then** the system floors `ease_factor` at exactly 1.3 (it never goes lower).
5. **Given** a Card is reviewed repeatedly with "Good" across multiple sessions, **When**
   each session is completed, **Then** `interval_days` grows according to the SM-2 formula
   and `next_review_date` advances by the computed interval.
6. **Given** a Card rated "Hard", **When** the rating is submitted, **Then** `ease_factor`
   decreases by 0.15 (floored at 1.3) and `interval_days` becomes
   `max(1, round(current_interval × 1.2))` — independent of `ease_factor`. Example:
   interval=10 → new interval=12.

---

### User Story 5 — Logout (Priority: P5)

A registered user can log out from the application. The logout action clears the session
completely on both client and server side (including Next.js middleware), and redirects
the user to the login page.

**Why this priority**: Logout is a fundamental auth operation for multi-user environments
or shared devices. It depends on existing Supabase Auth integration but is independent of
Deck/Card/Study features.

**Independent Test**: Can be fully tested by logging in, triggering logout, verifying
session is cleared (no access to protected routes), and confirming redirect to login page.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they click the Logout button, **Then** the Supabase
   session is invalidated on the server, cookies are cleared, and the user is redirected
   to the login page.
2. **Given** a user has just logged out, **When** they attempt to access any protected
   route (e.g., `/decks`), **Then** they are redirected to the login page without seeing
   protected content.
3. **Given** a user has just logged out, **When** they press the browser back button,
   **Then** they cannot access cached protected pages; they are redirected to login.
4. **Given** the logout API call fails due to network error, **When** the user clicks
   Logout, **Then** a user-friendly error message is displayed and the user remains logged
   in (no partial state).
5. **Given** a user is logged in on multiple tabs, **When** they log out from one tab,
   **Then** other tabs detect the session invalidation and redirect to login on next
   interaction.

---

### User Story 6 — Context7 MCP Server Tooling (Priority: P6)

The development environment is configured with Context7 MCP Server to provide AI-assisted
context management during development. This enables AI tools (like GitHub Copilot, Claude)
to access up-to-date library documentation directly within the development workflow.

**Why this priority**: This is a developer experience enhancement that accelerates
development velocity. It has no runtime dependencies and can be set up independently of
application features.

**Independent Test**: Can be verified by confirming the MCP server configuration is present
in the project, the server can be started, and AI tools can query library documentation
through the Context7 endpoint.

**Acceptance Scenarios**:

1. **Given** a developer clones the repository, **When** they check the MCP configuration,
   **Then** the Context7 server configuration exists in `.cursor/mcp.json` or
   `.vscode/mcp.json` (depending on the IDE).
2. **Given** the MCP configuration is in place, **When** the developer starts the AI
   assistant, **Then** the Context7 server is available as a tool for fetching library
   documentation.
3. **Given** Context7 is configured, **When** the developer asks the AI about a library
   used in the project (e.g., Supabase, Next.js, Zod), **Then** the AI can retrieve
   up-to-date documentation from Context7 to provide accurate answers.
4. **Given** the project uses specific versions of libraries, **When** Context7 is queried,
   **Then** the documentation returned matches the library versions in `package.json`.

---

### Edge Cases

- What happens when a user creates a Deck with an empty or whitespace-only name? → The
  system MUST reject the request with a validation error; no Deck is created.
- What happens when a user adds a Card with a blank front or back? → The system MUST
  reject the request; both fields are mandatory.
- What happens when a Deck is deleted while a Study Session is active for it? → The
  session ends gracefully; no scheduling writes occur for the deleted Deck's Cards.
- What happens when `next_review_date` is far in the past (card never reviewed)? → The
  Card is included in the first session run on or after today (treated as overdue).
- What happens if a user rates a card "Again" repeatedly? → Each "Again" pushes the Card
  to the end of the queue and writes a new `CardReview` record. There is no hard cap on
  re-queues within a single session; the session only ends when the queue is empty.
- What happens when the user closes the browser mid-session? → Cards already rated have
  their scheduling persisted; unrated Cards remain due for the next session.
- What happens if two sessions are opened simultaneously for the same Deck? → Each session
  operates independently; the last write wins on scheduling state; no data corruption.
- What happens if a Card has no prior review record (brand new)? → The SM-2 algorithm
  initialises with `ease_factor = 2.5`, `interval_days = 0`, `repetitions = 0`,
  `next_review_date = today (UTC)`.
- What happens if the logout API call fails? → The user sees an error message and remains
  logged in; no cookies are cleared to avoid partial logout state.
- What happens if the user's session expires while they are on a protected page? → On the
  next server interaction, Next.js middleware detects the invalid session and redirects
  to login.
- What happens if Context7 MCP server is not running? → AI tools gracefully degrade to
  their built-in knowledge; no application functionality is affected.

## Requirements *(mandatory)*

### Functional Requirements

#### Deck Management

- **FR-001**: The system MUST allow authenticated users to create a Deck with a name of
  1–255 characters.
- **FR-002**: The system MUST display a list of all Decks belonging to the authenticated
  user, showing at minimum the Deck name and total Card count.
- **FR-003**: The system MUST allow authenticated users to rename an existing Deck they
  own.
- **FR-004**: The system MUST allow authenticated users to permanently delete a Deck they
  own, cascading deletion to all associated Cards and review records.
- **FR-005**: The system MUST reject any read or write operation on a Deck by a user who
  does not own it, returning an authorisation error.

#### Card Management

- **FR-006**: The system MUST allow authenticated users to add a Card to a Deck they own;
  both the front (question) and back (answer) fields are mandatory and accept plain text of
  1–2000 characters each.
- **FR-007**: The system MUST display all Cards within a Deck, showing at minimum the front
  text and creation date.
- **FR-008**: The system MUST allow authenticated users to edit the front and/or back text
  of a Card they own.
- **FR-009**: The system MUST allow authenticated users to permanently delete a Card they
  own, including all associated review records.
- **FR-010**: The system MUST reject any read or write operation on a Card by a user who
  does not own the parent Deck, returning an authorisation error.

#### Study Session

- **FR-011**: The system MUST provide a Study Session for a given Deck that serves only
  Cards where `next_review_date ≤ today (UTC)`, including brand-new Cards with no prior
  review. The full set of due Cards MUST be fetched in a single query and shuffled
  randomly on the application side before the session begins; the server MUST NOT impose
  any ordering.
- **FR-012**: The system MUST display the front face of each Card first, hiding the back
  face until the user explicitly requests to reveal it.
- **FR-013**: The system MUST present four rating options after the answer is revealed:
  **Again** (rating 1), **Hard** (rating 2), **Good** (rating 3), **Easy** (rating 4).
  A Card rated **Again** MUST be pushed to the end of the current session queue and
  presented again before the session ends; ratings Hard/Good/Easy remove the Card from
  the current queue permanently.
- **FR-014**: The system MUST apply an optimistic UI update immediately upon rating
  selection, advancing to the next Card without waiting for server confirmation.
- **FR-015**: The system MUST display a session completion summary after all due Cards have
  been rated (including all re-queued "Again" Cards resolved). The summary MUST show:
  total unique Cards reviewed, total review actions taken (≥ unique Cards due to
  re-queues), and per-rating counts.
- **FR-016**: The system MUST surface a non-blocking error indicator if a rating fails to
  sync to the server, without interrupting or terminating the session. The client MUST
  automatically retry the failed sync up to 3 times using exponential backoff. If all
  3 retries fail, a persistent error banner MUST be displayed with a manual "Retry"
  button; the user MUST NOT be forced to re-rate the Card.

#### Spaced Repetition (SM-2 Algorithm)

- **FR-017**: The system MUST recalculate scheduling parameters after every Card rating
  using the SM-2 algorithm with the following rules:
  - **Again (1)**: reset `repetitions` to 0; set `interval_days` to 1; decrease
    `ease_factor` by 0.20.
  - **Hard (2)**: keep `repetitions` unchanged; set
    `interval_days = max(1, round(interval_days × 1.2))` (fixed multiplier, independent
    of `ease_factor`); decrease `ease_factor` by 0.15.
  - **Good (3)**: increment `repetitions`; set `interval_days` to 1 if `repetitions`
    becomes 1, to 6 if `repetitions` becomes 2, otherwise
    `round(interval_days × ease_factor)`.
  - **Easy (4)**: increment `repetitions`; set `interval_days` to
    `round(interval_days × ease_factor × 1.3)`; increase `ease_factor` by 0.15.
- **FR-018**: The system MUST floor `ease_factor` at 1.3 at all times; it MUST NOT fall
  below this value regardless of repeated low ratings.
- **FR-019**: The system MUST set `next_review_date = today (UTC) + interval_days` after
  every review and persist it to the database synchronously before the response is returned.
- **FR-020**: The system MUST record the full review event — rating, resulting
  `ease_factor`, `interval_days`, `repetitions`, and timestamp — in immutable review
  history for every review action.
- **FR-021**: The system MUST initialise a new Card's scheduling state with
  `ease_factor = 2.5`, `interval_days = 0`, `repetitions = 0`,
  `next_review_date = today (UTC)` at the time of Card creation.

#### Authentication — Logout

- **FR-022**: The system MUST provide a Logout action accessible from any authenticated
  page (e.g., in the navigation header).
- **FR-023**: When the user triggers Logout, the system MUST call Supabase Auth `signOut()`
  to invalidate the session on the server side.
- **FR-024**: The system MUST clear all authentication cookies (including `sb-access-token`,
  `sb-refresh-token`) on both the client and via Next.js server response.
- **FR-025**: After successful logout, the system MUST redirect the user to the login page
  (`/login`).
- **FR-026**: The system MUST ensure that after logout, navigating to any protected route
  (via URL or browser history) results in a redirect to the login page.
- **FR-027**: If the logout operation fails (e.g., network error), the system MUST display
  an error message and NOT clear any cookies or redirect, leaving the user in a valid
  logged-in state.

#### Developer Tooling — Context7 MCP Server

- **FR-028**: The project MUST include a Context7 MCP Server configuration file at
  `.cursor/mcp.json` (for Cursor IDE) or equivalent location for other IDEs.
- **FR-029**: The MCP configuration MUST specify the Context7 server with the command
  `npx -y @upstash/context7-mcp` (or equivalent npm package).
- **FR-030**: The Context7 configuration MUST be documented in the project README or a
  dedicated `docs/tooling.md` file with setup instructions.
- **FR-031**: The Context7 MCP Server MUST be usable by AI assistants to fetch up-to-date
  documentation for libraries used in the project (Next.js, Supabase, Zod, React, etc.).

### Key Entities

- **User**: An authenticated account. Owns Decks. Identified by a unique user ID provided
  by the authentication system. Attributes: `id`, `email`, `created_at`.
- **Deck**: A named collection of Cards belonging to one User. Attributes: `id`,
  `user_id` (FK → User), `name`, `created_at`, `updated_at`.
- **Card**: A single flashcard with a front (question) and back (answer), belonging to one
  Deck. Carries live scheduling state as the authoritative source of truth — updated
  in-place after every review. Attributes: `id`, `deck_id` (FK → Deck),
  `user_id` (FK → User), `front`, `back`, `ease_factor`, `interval_days`, `repetitions`,
  `next_review_date`, `created_at`, `updated_at`.
- **CardReview**: An immutable, append-only audit record of a single review event. Never
  updated after insert; used for history/analytics only — not the source of truth for
  scheduling. Attributes: `id`, `card_id` (FK → Card), `user_id` (FK → User),
  `rating` (1–4), `ease_factor_after`, `interval_days_after`, `repetitions_after`,
  `reviewed_at`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a Deck, add 10 Cards, and start a Study Session in under
  3 minutes on first use.
- **SC-002**: During an active Study Session, each card transition (reveal answer → submit
  rating → next card) completes in under 1 second from the user's perspective, including
  on a standard mobile connection (simulated 3G).
- **SC-003**: 100% of Cards rated in a Study Session have their `next_review_date`
  correctly updated; zero scheduling-state drift is detectable after 30 consecutive review
  cycles across multiple sessions.
- **SC-004**: A user attempting to access another user's Deck or Card via any pathway
  receives an authorisation error 100% of the time.
- **SC-005**: The SM-2 scheduling produces interval and ease-factor values that exactly
  match the reference SM-2 formula output for all combinations of rating (1–4) and prior
  state (new, after 1st review, after 5th review) — verified by automated unit tests.
- **SC-006**: The Study Session remains usable (cards can be rated, session can complete)
  even when individual rating syncs fail due to transient network errors, with zero data
  corruption.
- **SC-007**: Deck and Card lists load within 2 seconds for a user with up to 50 Decks and
  500 Cards per Deck.
- **SC-008**: After logout, 100% of attempts to access protected routes result in redirect
  to login page — verified by automated integration tests.
- **SC-009**: Logout completes within 2 seconds under normal network conditions.
- **SC-010**: Context7 MCP Server configuration is present and functional; AI tools can
  query library documentation without manual intervention.

---

## Clarifications

### Session 2026-02-26

- Q: Scheduling state (`ease_factor`, `interval_days`, `repetitions`, `next_review_date`) — nguồn chân lý nằm ở đâu? → A: Option A — lưu trực tiếp trên bảng `cards` (mutable live state); `card_reviews` là append-only audit log.
- Q: Card bị "Again" trong session — có xuất hiện lại trong cùng session không? → A: Option A — Card bị "Again" được push vào cuối queue của session hiện tại và xuất hiện lại trong cùng session.
- Q: Thứ tự hiển thị Card trong session — theo tiêu chí nào? → A: Option B — shuffle ngẫu nhiên phía ứng dụng sau khi fetch, mỗi khi session bắt đầu.
- Q: Optimistic update thất bại — có retry tự động không? → A: Option B — retry tự động tối đa 3 lần (exponential backoff); nếu vẫn thất bại → hiển thị lỗi persistent + nút "Retry" thủ công.
- Q: Hard (rating 2) — interval multiplier cụ thể là bao nhiêu? → A: Option A — `interval_new = max(1, round(interval × 1.2))`, multiplier cố định, độc lập với `ease_factor`.

## Assumptions

- Authentication (sign-up, login, session management) is handled by the existing Supabase
  Auth integration. Logout functionality is now in scope as part of this specification.
- The application is a web application accessible on desktop and mobile browsers; native
  iOS/Android apps are out of scope.
- Card content is plain text only for this baseline; rich text, images, audio, and LaTeX
  rendering are deferred to a future iteration.
- The SM-2 variant used follows the four-button (Again/Hard/Good/Easy) mapping described
  in FR-017; deviations from this mapping require a spec amendment.
- "Today" is determined server-side in UTC to avoid timezone-driven inconsistencies across
  user locales.
- Deck sharing or collaboration between users is explicitly out of scope for this baseline.
- The Card list within a Deck does not need to support sorting or filtering beyond creation
  order for this baseline.
- Context7 MCP Server is a development-time dependency only; it does not affect runtime
  application behaviour or end-user functionality.
- AI assistants (Cursor, VS Code Copilot, etc.) that support MCP protocol are assumed for
  Context7 tooling to be useful.
