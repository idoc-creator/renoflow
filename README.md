# Bench

**Stop pinning. Start building.**

Bench is the platform where DIYers browse inspo, grab templates, plan
projects, build the thing, share what they made, and earn from it. From
bathroom remodels to handmade jewelry — if you make it, Bench is where you
plan it.

## What's in here

- **Next.js 16** with App Router, TypeScript, Tailwind CSS 4
- **Supabase** for auth, Postgres database, and image storage
- **Claude Haiku** (`claude-haiku-4-5`) for contextual help in "Ask Bench"
- **Stripe** plumbing for future template sales and Pro tier

## Local dev

```bash
npm install
npm run dev
```

App runs at http://localhost:3000.

Required environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
ANTHROPIC_API_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Bench works without the Stripe and Anthropic keys — those features gracefully
disable until keys are set.

## Key routes

| Path | What |
|---|---|
| `/` | Browse — masonry grid of templates |
| `/explore/[category]` | Category filter (renovation, furniture, decor, craft, outdoor) |
| `/project/[id]` | Public template detail page |
| `/bunker` | Builder's Bunker — your active projects (auth required) |
| `/bunker/project/[id]` | Project workspace — stages, mood board, shopping list |
| `/bunker/project/new` | Start blank or from template |
| `/pricing` | Revenue model + future Pro tools |

## Scripts

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # ESLint
```
