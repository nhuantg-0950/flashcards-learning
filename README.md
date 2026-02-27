# Flashcards Learning

A spaced repetition flashcard application built with Next.js, Supabase, and the SM-2 algorithm.

## Features

- **Deck Management**: Create, rename, and delete flashcard decks
- **Card Management**: Add, edit, and delete cards within decks
- **Study Sessions**: Review due cards with front/back reveal
- **SM-2 Spaced Repetition**: Intelligent scheduling based on your performance
- **Rating System**: Again, Hard, Good, Easy ratings for optimal learning

## Documentation

| Document | Description |
|----------|-------------|
| [User Guide](docs/USER_GUIDE.md) | Hướng dẫn sử dụng chi tiết |
| [Product Documentation](docs/product.md) | Technical product documentation |
| [Developer Tooling](docs/tooling.md) | Context7 MCP setup guide |
| [Screenshots](docs/screenshots/README.md) | Application screenshots |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase CLI (`npm install -g supabase`)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start local Supabase:
   ```bash
   supabase start
   ```

4. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

5. Run development server:
   ```bash
   npm run dev
   ```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

## Developer Tooling

This project uses **Context7 MCP Server** for AI-assisted development. Context7 allows AI assistants (Cursor AI, GitHub Copilot) to access up-to-date library documentation directly within your IDE.

### Setup

Configuration files are already included:
- `.cursor/mcp.json` — Cursor IDE
- `.vscode/mcp.json` — VS Code

After cloning, restart your IDE to enable Context7.

📖 See [docs/tooling.md](docs/tooling.md) for detailed setup and usage instructions.

## Project Structure

```
app/                    # Next.js App Router pages and API routes
├── api/               # REST API endpoints
├── decks/             # Deck management pages
└── login/             # Authentication page

lib/                    # Business logic
├── db/                # Database queries
├── scheduling/        # SM-2 algorithm
├── services/          # Service layer
├── supabase/          # Supabase client utilities
└── validation/        # Zod schemas

components/             # React components
├── ui/                # shadcn/ui primitives
├── decks/             # Deck-related components
├── cards/             # Card-related components
└── study/             # Study session components

hooks/                  # Custom React hooks
types/                  # TypeScript type definitions
supabase/              # Supabase migrations and config
tests/                 # Test files
```

## License

MIT
