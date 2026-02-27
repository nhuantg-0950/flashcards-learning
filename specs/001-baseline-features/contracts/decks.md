# API Contracts: Decks

**Base path**: `/api/decks`  
**Auth**: All endpoints require an authenticated session cookie (Supabase `@supabase/ssr`). Unauthenticated requests receive `401 Unauthorized`.  
**Ownership**: All operations are scoped to the authenticated user. Attempting to access another user's deck returns `403 Forbidden`.

---

## `GET /api/decks`

List all decks belonging to the authenticated user.

**Request**

```
GET /api/decks
Cookie: <supabase-session>
```

No query parameters or request body.

**Response 200 OK**

```json
{
  "decks": [
    {
      "id": "uuid",
      "name": "string",
      "cardCount": 42,
      "createdAt": "2026-02-26T00:00:00Z",
      "updatedAt": "2026-02-26T00:00:00Z"
    }
  ]
}
```

`cardCount` is computed via a `count` aggregate join on `cards`.  
Ordered by `created_at DESC`.

**Error Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `401` | `{ "error": "Unauthorized" }` | No valid session |
| `500` | `{ "error": "Internal server error" }` | DB failure |

---

## `POST /api/decks`

Create a new deck.

**Request**

```
POST /api/decks
Content-Type: application/json
Cookie: <supabase-session>
```

```json
{
  "name": "string"   // required, 1–255 chars
}
```

**Zod schema**:
```ts
z.object({ name: z.string().min(1).max(255) })
```

**Response 201 Created**

```json
{
  "deck": {
    "id": "uuid",
    "name": "string",
    "cardCount": 0,
    "createdAt": "2026-02-26T00:00:00Z",
    "updatedAt": "2026-02-26T00:00:00Z"
  }
}
```

**Error Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` | Invalid/missing name |
| `401` | `{ "error": "Unauthorized" }` | No valid session |
| `500` | `{ "error": "Internal server error" }` | DB failure |

---

## `PATCH /api/decks/[deckId]`

Rename an existing deck.

**Request**

```
PATCH /api/decks/{deckId}
Content-Type: application/json
Cookie: <supabase-session>
```

```json
{
  "name": "string"   // required, 1–255 chars
}
```

**Zod schema**:
```ts
z.object({ name: z.string().min(1).max(255) })
```

**Response 200 OK**

```json
{
  "deck": {
    "id": "uuid",
    "name": "string",
    "cardCount": 42,
    "createdAt": "2026-02-26T00:00:00Z",
    "updatedAt": "2026-02-26T12:00:00Z"
  }
}
```

**Error Responses**

| Status | Body | Condition |
|--------|------|-----------|
| `400` | `{ "error": "Validation failed", "details": [...] }` | Invalid/missing name |
| `401` | `{ "error": "Unauthorized" }` | No valid session |
| `403` | `{ "error": "Forbidden" }` | Deck belongs to another user |
| `404` | `{ "error": "Deck not found" }` | `deckId` does not exist |
| `500` | `{ "error": "Internal server error" }` | DB failure |

---

## `DELETE /api/decks/[deckId]`

Permanently delete a deck and all associated cards and review records (cascaded via DB FK `ON DELETE CASCADE`).

**Request**

```
DELETE /api/decks/{deckId}
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
| `403` | `{ "error": "Forbidden" }` | Deck belongs to another user |
| `404` | `{ "error": "Deck not found" }` | `deckId` does not exist |
| `500` | `{ "error": "Internal server error" }` | DB failure |
