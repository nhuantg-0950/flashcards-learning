# Data Model: Baseline Features

**Branch**: `001-baseline-features` | **Date**: 2026-02-26

---

## Overview

Three tables: `decks`, `cards`, `card_reviews`. A Supabase Auth `users` table exists implicitly via `auth.users`; all user-owned tables reference `auth.uid()` in RLS policies.

```
auth.users (Supabase managed)
    │
    ├──< decks (user_id FK)
    │       │
    │       └──< cards (deck_id FK, user_id FK)
    │               │
    │               └──< card_reviews (card_id FK, user_id FK)
```

---

## Table: `decks`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NOT NULL | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `name` | `text` | NOT NULL | — | 1–255 chars (enforced by CHECK + Zod) |
| `created_at` | `timestamptz` | NOT NULL | `now()` | |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Updated by trigger |

**Indexes**:
- `decks_pkey` (btree) on `id` — primary key
- `decks_user_id_idx` (btree) on `user_id` — for RLS policy + list query

**Constraints**:
- `CHECK (char_length(name) >= 1 AND char_length(name) <= 255)`

---

## Table: `cards`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `deck_id` | `uuid` | NOT NULL | — | FK → `decks(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | NOT NULL | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `front` | `text` | NOT NULL | — | 1–2000 chars |
| `back` | `text` | NOT NULL | — | 1–2000 chars |
| `ease_factor` | `numeric(4,2)` | NOT NULL | `2.50` | SM-2; floor 1.3; init 2.5 |
| `interval_days` | `integer` | NOT NULL | `0` | SM-2; days until next review |
| `repetitions` | `integer` | NOT NULL | `0` | SM-2; successful review streak |
| `next_review_date` | `date` | NOT NULL | `current_date` | Study session filter |
| `created_at` | `timestamptz` | NOT NULL | `now()` | |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Updated by trigger |

**Indexes**:
- `cards_pkey` (btree) on `id` — primary key
- `cards_deck_id_idx` (btree) on `deck_id` — FK + card list query
- `cards_user_id_idx` (btree) on `user_id` — RLS policy
- `cards_next_review_date_idx` (btree) on `next_review_date` — **critical** for study session query (`WHERE next_review_date <= current_date`)

**Constraints**:
- `CHECK (char_length(front) >= 1 AND char_length(front) <= 2000)`
- `CHECK (char_length(back) >= 1 AND char_length(back) <= 2000)`
- `CHECK (ease_factor >= 1.3)`
- `CHECK (interval_days >= 0)`
- `CHECK (repetitions >= 0)`

---

## Table: `card_reviews`

Append-only audit log. Never updated after insert.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `card_id` | `uuid` | NOT NULL | — | FK → `cards(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | NOT NULL | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `rating` | `integer` | NOT NULL | — | 1=Again, 2=Hard, 3=Good, 4=Easy |
| `ease_factor_after` | `numeric(4,2)` | NOT NULL | — | EF after this review |
| `interval_days_after` | `integer` | NOT NULL | — | interval after this review |
| `repetitions_after` | `integer` | NOT NULL | — | repetitions after this review |
| `reviewed_at` | `timestamptz` | NOT NULL | `now()` | |

**Indexes**:
- `card_reviews_pkey` (btree) on `id`
- `card_reviews_card_id_idx` (btree) on `card_id` — history lookup + cascade
- `card_reviews_user_id_idx` (btree) on `user_id` — RLS policy

**Constraints**:
- `CHECK (rating IN (1, 2, 3, 4))`

---

## RLS Policies

All three tables have Row Level Security enabled. The pattern is identical across tables: `auth.uid() = user_id`.

### `decks`

```sql
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);
```

### `cards`

```sql
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards"
  ON cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON cards FOR DELETE
  USING (auth.uid() = user_id);
```

### `card_reviews`

```sql
ALTER TABLE card_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews"
  ON card_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
  ON card_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies — append-only by design
```

---

## Triggers

A single reusable trigger function sets `updated_at = now()` on every UPDATE:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER decks_set_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER cards_set_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

`card_reviews` has no `updated_at` column and no update trigger (append-only).

---

## State Transitions: Card Scheduling

```
NEW CARD CREATED
  ease_factor = 2.50
  interval_days = 0
  repetitions = 0
  next_review_date = current_date (UTC)
          │
          ▼
  DUE (next_review_date ≤ today)
          │
    ┌─────┴──────────────────┐
    │ Rate: AGAIN (1)        │ → ease_factor -= 0.20 (floor 1.3)
    │                        │   interval_days = 1
    │                        │   repetitions = 0
    │                        │   next_review_date = today + 1
    │                        │   → re-queued in current session
    │                        │
    │ Rate: HARD (2)         │ → ease_factor -= 0.15 (floor 1.3)
    │                        │   interval_days = max(1, round(interval × 1.2))
    │                        │   repetitions unchanged
    │                        │   next_review_date = today + new_interval
    │                        │
    │ Rate: GOOD (3)         │ → ease_factor unchanged
    │                        │   repetitions++
    │                        │   interval = 1 if rep=1, 6 if rep=2,
    │                        │             else round(interval × EF)
    │                        │   next_review_date = today + new_interval
    │                        │
    │ Rate: EASY (4)         │ → ease_factor += 0.15
    └────────────────────────┘   repetitions++
                                 interval = round(interval × EF × 1.3)
                                 next_review_date = today + new_interval
```

---

## Migration File Summary

Single migration file: `supabase/migrations/20260226000000_baseline.sql`

Contents in order:
1. `set_updated_at` trigger function
2. `decks` table + index + trigger
3. `cards` table + indexes + trigger
4. `card_reviews` table + indexes
5. RLS enable + all policies (decks, cards, card_reviews)
6. Optional: `record_review` RPC function (atomic review write — see research.md §7)
