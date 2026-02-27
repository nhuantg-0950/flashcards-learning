# API Contracts: Cards

**Base paths**:
- `/api/decks/[deckId]/cards` — collection operations (list, create)
- `/api/cards/[cardId]` — single-card operations (edit, delete)

**Auth**: All endpoints require an authenticated session cookie. Unauthenticated requests receive `401 Unauthorized`.  
**Ownership**: The authenticated user must own the parent deck. Any operation on a card in a deck they do not own returns `403 Forbidden`.

---

## `GET /api/decks/[deckId]/cards`

List all cards within a deck.

**Request**

```
GET /api/decks/{deckId}/cards
Cookie: <supabase-session>
```

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
      "nextReviewDate": "2026-02-26",
      "createdAt": "2026-02-26T00:00:00Z",
      "updatedAt": "2026-02-26T00:00:00Z"
    }
  ]
}
```

Ordered by `created_at ASC` (creation order, as per spec assumptions).

**Error Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `401` | `{ "error": "Unauthorized" }` | No valid session |
| `403` | `{ "error": "Forbidden" }` | Deck belongs to another user |
| `404` | `{ "error": "Deck not found" }` | `deckId` does not exist |
| `500` | `{ "error": "Internal server error" }` | DB failure |

---

## `POST /api/decks/[deckId]/cards`

Create a new card in the specified deck. Initialises scheduling state per FR-021.

**Request**

```
POST /api/decks/{deckId}/cards
Content-Type: application/json
Cookie: <supabase-session>
```

```json
{
  "front": "string",   // required, 1–2000 chars
  "back": "string"     // required, 1–2000 chars
}
```

**Zod schema**:
```ts
z.object({
  front: z.string().min(1).max(2000),
  back: z.string().min(1).max(2000),
})
```

**Response 201 Created**

```json
{
  "card": {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "easeFactor": 2.5,
    "intervalDays": 0,
    "repetitions": 0,
    "nextReviewDate": "2026-02-26",
    "createdAt": "2026-02-26T00:00:00Z",
    "updatedAt": "2026-02-26T00:00:00Z"
  }
}
```

`nextReviewDate` is set to today (UTC) at creation time per FR-021.

**Error Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` | Invalid/missing front or back |
| `401` | `{ "error": "Unauthorized" }` | No valid session |
| `403` | `{ "error": "Forbidden" }` | Deck belongs to another user |
| `404` | `{ "error": "Deck not found" }` | `deckId` does not exist |
| `500` | `{ "error": "Internal server error" }` | DB failure |

---

## `PATCH /api/cards/[cardId]`

Edit the front and/or back text of a card. Does not touch scheduling state.

**Request**

```
PATCH /api/cards/{cardId}
Content-Type: application/json
Cookie: <supabase-session>
```

```json
{
  "front": "string",   // optional, 1–2000 chars if provided
  "back": "string"     // optional, 1–2000 chars if provided
}
```

At least one of `front` or `back` must be provided.

**Zod schema**:
```ts
z.object({
  front: z.string().min(1).max(2000).optional(),
  back: z.string().min(1).max(2000).optional(),
}).refine(
  (data) => data.front !== undefined || data.back !== undefined,
  { message: "At least one of front or back must be provided" }
)
```

**Response 200 OK**

```json
{
  "card": {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "easeFactor": 2.5,
    "intervalDays": 0,
    "repetitions": 0,
    "nextReviewDate": "2026-02-26",
    "createdAt": "2026-02-26T00:00:00Z",
    "updatedAt": "2026-02-26T12:00:00Z"
  }
}
```

**Error Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` | Invalid fields |
| `401` | `{ "error": "Unauthorized" }` | No valid session |
| `403` | `{ "error": "Forbidden" }` | Card belongs to another user's deck |
| `404` | `{ "error": "Card not found" }` | `cardId` does not exist |
| `500` | `{ "error": "Internal server error" }` | DB failure |

---

## `DELETE /api/cards/[cardId]`

Permanently delete a single card and all associated review records (cascaded via DB FK `ON DELETE CASCADE`).

**Request**

```
DELETE /api/cards/{cardId}
Cookie: <supabase-session>
```

No request body.

**Response 200 OK**

```json
{
  "success": true
}
```

**Error Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `401` | `{ "error": "Unauthorized" }` | No valid session |
| `403` | `{ "error": "Forbidden" }` | Card belongs to another user's deck |
| `404` | `{ "error": "Card not found" }` | `cardId` does not exist |
| `500` | `{ "error": "Internal server error" }` | DB failure |
