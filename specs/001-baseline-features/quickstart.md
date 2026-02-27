# Quickstart: Baseline Features

**Branch**: `001-baseline-features` | **Date**: 2026-02-26

Get a local development environment running from scratch in ~10 minutes.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) |
| npm | 10+ | bundled with Node.js |
| Supabase CLI | latest | `npm install -g supabase` |
| Docker Desktop | latest | required for local Supabase |

---

## 1. Clone and install

```bash
git clone <repo-url> flashcards-learning
cd flashcards-learning
git checkout 001-baseline-features
npm install
```

---

## 2. Start local Supabase

```bash
supabase start
```

This starts a local Postgres + Auth + Studio instance via Docker. On first run, this may take 2–3 minutes.

After startup, note the output values:

```
API URL:     http://localhost:54321
anon key:    eyJ...
service_role key:  eyJ...
Studio URL:  http://localhost:54323
DB URL:      postgresql://postgres:postgres@localhost:54322/postgres
```

---

## 3. Apply the migration

```bash
supabase db reset
```

This applies all migrations in `supabase/migrations/` and runs `supabase/seed.sql` (if present). This creates the `decks`, `cards`, and `card_reviews` tables with all RLS policies and indexes.

To verify:

```bash
supabase db status
# Should show: "All migrations applied"
```

---

## 4. Generate TypeScript types

```bash
supabase gen types typescript --local > types/database.ts
```

Re-run this command any time you modify the schema.

---

## 5. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from step 2>
```

> ⚠️ Never commit `.env.local`. It is in `.gitignore`.  
> ⚠️ Never put `service_role` key in `.env.local` — it is never needed client-side.

---

## 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 7. Run the tests

```bash
# Unit tests (includes SM-2 coverage check)
npm run test

# Watch mode
npm run test:watch

# Coverage report (must be ≥90% on lib/scheduling/)
npm run test:coverage
```

---

## 8. View data in Supabase Studio

```bash
# Studio is already running after `supabase start`
open http://localhost:54323
```

Or use the Prisma-style table editor at the Studio URL to inspect `decks`, `cards`, and `card_reviews`.

---

## Common Commands

```bash
# Stop local Supabase
supabase stop

# Reset DB (re-runs all migrations + seed)
supabase db reset

# Regenerate types after schema change
supabase gen types typescript --local > types/database.ts

# Add a new migration
supabase migration new <migration-name>

# Lint (TypeScript strict, no type errors allowed)
npm run type-check

# Build production bundle
npm run build
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Docker not running | Start Docker Desktop, then `supabase start` |
| Port 54321 already in use | `supabase stop` then `supabase start` |
| Types file out of date | Run `supabase gen types typescript --local > types/database.ts` |
| RLS blocking all queries in tests | Tests must authenticate as a real user; use Supabase test helpers or set `SUPABASE_SERVICE_ROLE_KEY` for integration test setup only |
| `NEXT_PUBLIC_SUPABASE_URL` undefined | Ensure `.env.local` exists and dev server is restarted |
