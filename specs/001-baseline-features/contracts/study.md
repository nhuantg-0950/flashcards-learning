# API Contracts: Study Session

**Base paths**:
- `GET /api/decks/[deckId]/study` — fetch due cards to seed the session
- `POST /api/cards/[cardId]/review` — submit a rating and persist SM-2 scheduling update

**Auth**: All endpoints require an authenticated session cookie. Unauthenticated requests receive `401 Unauthorized`.  
**Ownership**: The authenticated user must own the deck/card. Any operation on resources they do not own returns `403 Forbidden`.

---

## `GET /api/decks/[deckId]/study`

Fetch all due cards for a study session. A card is "due" when `next_review_date ≤ today (UTC)`.

The server returns cards in **database insertion order** (no server-side shuffle). The client is responsible for shuffling randomly before the session begins (FR-011).

**Request**

```
GET /api/decks/{deckId}/study
Cookie: <supabase-session>
```

No query parameters or request body.

**Response 200 OK**

```json
{
  "cards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "easeFactor": 2.5,
      "intervalDays": 0,
      "repetitions": 0,
      "nextReviewDate": "2026-02-26"
    }
  ],
  "totalDue": 12
}
```

`totalDue` equals `cards.length`. An empty `cards` array (`totalDue: 0`) means the deck has no cards due today — the UI MUST show the "Nothing to review today" empty state (FR-011).

**Error Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `401` | `{ "error": "Unauthorized" }` | No valid session |
| `403` | `{ "error": "Forbidden" }` | Deck belongs to another user |
| `404` | `{ "error": "Deck not found" }` | `deckId` does not exist |
| `500` | `{ "error": "Internal server error" }` | DB failure |

---

## `POST /api/cards/[cardId]/review`

Submit a rating for a card. The server:
1. Reads the card's current scheduling state.
2. Runs the SM-2 algorithm (`lib/scheduling/sm2.ts`).
3. Writes an immutable `card_reviews` record.
4. Updates the card's scheduling state in-place on the `cards` table.
5. Returns the updated scheduling state.

This endpoint is called **optimistically** — the UI has already advanced before this request resolves. If the request fails, the client retries up to 3 times with exponential backoff (FR-016).

**Request**

```
POST /api/cards/{cardId}/review
Content-Type: application/json
Cookie: <supabase-session>
```

```json
{
  "rating": 3   // integer, one of: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
}
```

**Zod schema**:
```ts
z.object({
  rating: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
})
```

**Response 200 OK**

```json
{
  "card": {
    "id": "uuid",
    "easeFactor": 2.5,
    "intervalDays": 1,
    "repetitions": 1,
    "nextReviewDate": "2026-02-27"
  },
  "review": {
    "id": "uuid",
    "rating": 3,
    "reviewedAt": "2026-02-26T10:00:00Z"
  }
}
```

`nextReviewDate` is the newly computed date (`today (UTC) + intervalDays`).

**Error Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` | `rating` not in {1,2,3,4} |
| `401` | `{ "error": "Unauthorized" }` | No valid session |
| `403` | `{ "error": "Forbidden" }` | Card belongs to another user's deck |
| `404` | `{ "error": "Card not found" }` | `cardId` does not exist |
| `500` | `{ "error": "Internal server error" }` | DB failure or SM-2 computation error |

---

## SM-2 Formula Reference (for contract consumers)

Applied inside `POST /api/cards/[cardId]/review`:

| Rating | repetitions | interval_days | ease_factor |
|--------|-------------|---------------|-------------|
| 1 — Again | reset to `0` | set to `1` | `EF -= 0.20` (floor `1.3`) |
| 2 — Hard | unchanged | `max(1, round(prev × 1.2))` | `EF -= 0.15` (floor `1.3`) |
| 3 — Good | `+1` | `1` if rep=1, `6` if rep=2, else `round(prev × EF)` | unchanged |
| 4 — Easy | `+1` | `round(prev × EF × 1.3)` | `EF += 0.15` |

`next_review_date = today (UTC) + interval_days`

---

## Client Retry Behaviour (FR-016 reference)

The client MUST implement the following retry policy when `POST /api/cards/[cardId]/review` fails:

```
Attempt 1:  immediate
Attempt 2:  after 1 000 ms
Attempt 3:  after 2 000 ms
Attempt 4:  after 4 000 ms
→ All fail: show persistent SyncErrorBanner with manual Retry button
```

The session does not terminate and the user is not forced to re-rate the card.
