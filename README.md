# NewsPlus

AI-powered news assistant for monitoring, summarisation, translation, and report writing.

## Stack

- **Next.js 16** — Web app + API routes
- **Tailwind CSS 4** — Styling with design tokens
- **OpenAI API** — AI generation (to be connected)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
design-system/     Brand assets, colors, tokens
docs/              Scope of work & documentation
public/            Static assets, PWA manifest, logos
src/
  app/             Pages & API routes
  components/      UI components
```

## Features (Roadmap)

| Feature | Route | Status |
|---------|-------|--------|
| News summaries | `/news` | UI ready |
| Content generation | `/generate` | UI ready |
| Translation | `/translate` | UI ready |
| OpenAI integration | `/api/*` | Next |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `NEXT_PUBLIC_APP_NAME` | App display name |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

## Design System

See `design-system/newsplus-design-system.md` for colors, typography, and logo usage.
