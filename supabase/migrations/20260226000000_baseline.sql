-- ============================================================================
-- Baseline Migration: decks, cards, card_reviews
-- Feature: 001-baseline-features
-- Date: 2026-02-26
--
-- Constitution compliance:
--   II. Schema Integrity   — all SM-2 fields present with correct defaults
--   III. Security/RLS      — RLS enabled + policies for all 3 tables
--   DB Standards           — FKs indexed, created_at/updated_at on all tables,
--                            next_review_date btree-indexed, rating as CHECK int
-- ============================================================================

-- ============================================================================
-- 1. Reusable trigger function: auto-set updated_at on UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Table: decks
-- ============================================================================

CREATE TABLE public.decks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL
                          CONSTRAINT decks_name_length CHECK (
                            char_length(name) >= 1 AND char_length(name) <= 255
                          ),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Index: user_id — for RLS policy evaluation + list-my-decks query
CREATE INDEX decks_user_id_idx ON public.decks (user_id);

-- Trigger: auto-update updated_at
CREATE TRIGGER decks_set_updated_at
  BEFORE UPDATE ON public.decks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. Table: cards
-- ============================================================================

CREATE TABLE public.cards (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id           uuid        NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front             text        NOT NULL
                                CONSTRAINT cards_front_length CHECK (
                                  char_length(front) >= 1 AND char_length(front) <= 2000
                                ),
  back              text        NOT NULL
                                CONSTRAINT cards_back_length CHECK (
                                  char_length(back) >= 1 AND char_length(back) <= 2000
                                ),
  -- SM-2 scheduling state (authoritative source of truth — Constitution §II)
  ease_factor       numeric(4,2) NOT NULL DEFAULT 2.50
                                CONSTRAINT cards_ease_factor_floor CHECK (ease_factor >= 1.3),
  interval_days     integer     NOT NULL DEFAULT 0
                                CONSTRAINT cards_interval_positive CHECK (interval_days >= 0),
  repetitions       integer     NOT NULL DEFAULT 0
                                CONSTRAINT cards_repetitions_positive CHECK (repetitions >= 0),
  next_review_date  date        NOT NULL DEFAULT current_date,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Index: deck_id — FK + card-list-for-deck query
CREATE INDEX cards_deck_id_idx ON public.cards (deck_id);

-- Index: user_id — RLS policy evaluation
CREATE INDEX cards_user_id_idx ON public.cards (user_id);

-- Index: next_review_date — CRITICAL for study session query
-- (WHERE next_review_date <= current_date)
CREATE INDEX cards_next_review_date_idx ON public.cards (next_review_date);

-- Trigger: auto-update updated_at
CREATE TRIGGER cards_set_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. Table: card_reviews (append-only audit log — never updated after insert)
-- ============================================================================

CREATE TABLE public.card_reviews (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id               uuid        NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating                integer     NOT NULL
                                    CONSTRAINT card_reviews_rating_range CHECK (
                                      rating IN (1, 2, 3, 4)
                                    ),
  ease_factor_after     numeric(4,2) NOT NULL,
  interval_days_after   integer     NOT NULL,
  repetitions_after     integer     NOT NULL,
  reviewed_at           timestamptz NOT NULL DEFAULT now()
);

-- Index: card_id — history lookup + cascade performance
CREATE INDEX card_reviews_card_id_idx ON public.card_reviews (card_id);

-- Index: user_id — RLS policy evaluation
CREATE INDEX card_reviews_user_id_idx ON public.card_reviews (user_id);

-- ============================================================================
-- 5. Row Level Security — Constitution §III (NON-NEGOTIABLE)
--    Pattern: auth.uid() = user_id for all operations
-- ============================================================================

-- ----- decks -----
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decks"
  ON public.decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
  ON public.decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON public.decks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON public.decks FOR DELETE
  USING (auth.uid() = user_id);

-- ----- cards -----
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards"
  ON public.cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON public.cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON public.cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON public.cards FOR DELETE
  USING (auth.uid() = user_id);

-- ----- card_reviews (append-only: SELECT + INSERT only) -----
ALTER TABLE public.card_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews"
  ON public.card_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews"
  ON public.card_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies — card_reviews is append-only by design.
-- Constitution §II: immutable audit log, never modified after insert.
