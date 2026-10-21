@AGENTS.md

# ProfitKit

Open-source, self-hosted profit tracker for Shopify dropshippers in the Czech Republic and Slovakia. Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma 7 + PostgreSQL, Better Auth.

**Start with `docs/README.md`.** The docs folder holds every product and architecture decision (it's local only and gitignored). The build plan is `docs/18-implementation-plan.md`.

## Ground rules

- Use `pnpm` - do NOT use `npm`. (Use `pnpm dlx` / `pnpm exec` instead of `npx`.)
- **Develop only locally. Don't deploy anything anywhere** (no Vercel projects, no `vercel` CLI, no pushing).
- **Database:** the local Postgres server, database **`profitkit_dev`** (tests use `profitkit_test`). New databases for this project always end in `_dev` (or `_test` for tests).
- Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (see `AGENTS.md`). This Next.js version differs from older ones.
- The UI is in **Czech**, with `cs-CZ` formatting and Kč. All user-facing text goes through the dictionary, never hard-coded in components.
- Never print or commit secrets (`.env.local`, `.env.video`).
- Make commits continuously (many smaller ones, rather than a few larger ones)

## Page patterns

### Data loading: never throw, use `tryCatch()`

Every dynamic page loads its data with the `tryCatch()` utility (based on https://gist.github.com/t3dotgg/a486c4ae66d32bf17c09c73609dacc5b). It wraps a promise and returns a discriminated union: `{ data, error: null }` on success or `{ data: null, error }` on failure.

- **On error, the page renders the shared page error component.** It doesn't throw. Following Next.js best practice, a page should not throw and fall into `error.tsx`.
- **If something throws anyway,** the route's `error.tsx` renders **the same error component**, plus two buttons:
  - **"Zkusit znovu"** (try again): calls the error boundary's `retry()` prop, which re-fetches and re-renders the segment (check the exact API in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`)
  - **"Obnovit stránku"** (refresh): reloads the whole page

### Loading: skeletons with zero layout shift

- **Every dynamic page has a loading Suspense state** (`loading.tsx` and/or inner `<Suspense>` boundaries) built with shadcn's **`<Skeleton />`** component.
- The skeleton **mirrors the fully loaded page as closely as possible**: same layout components, grid, paddings, tile and chart heights, text line heights. **Not even a 1px layout jump on load.**
- Verify it: compare the positions and sizes of the key regions in the loading state and the loaded state (Playwright).

### Auth: proxy for optimism, every page for real

- **`proxy.ts`** (formerly `middleware.ts`; in `src/`, next to `app/`) performs **only an optimistic cookie check**: is the Better Auth session cookie present, and is it valid as far as can be checked locally from the cookie itself (format, signature, expiry)? If not, **redirect** to sign-in.
  - **It must NEVER call any API**, the database or Better Auth's session endpoint.
  - The goal: an unauthorized user never sees the loading skeleton and never gets a glimpse of the page layout.
  - Exclude public routes in the matcher: sign-in, the 2FA code step of sign-in, Better Auth's API routes, the Shopify webhook route, the cron route, static files and fonts.
  - Check which cookie helpers the installed Better Auth version offers for this.
- **Every page performs its own auth check** with the shared auth helper (see `docs/03-auth-decisions.md`). A check only in `layout.tsx` is not enough. Server actions and route handlers check too (webhooks are verified by HMAC, the cron route by `CRON_SECRET`).

## UI, theme and fonts

- **The brand guidelines are the source of truth:** `docs/brand/profitkit-brand-guidelines.html`. Summary and rules: `docs/17-brand-and-ui.md`.
- **Use shadcn's theme variables.** Install the theme with `pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/cmvioyor1000104jrbs11ebf7`. That theme is only the shadcn form of the brand; **if it differs from the brand guidelines, the brand guidelines win**.
- **Fonts:** only Bricolage Grotesque and DM Mono, from `/Users/martinsil/Work/Ecommerce/Software/ProfitKit/Fonts`. **Don't use any other fonts** (and no Google Fonts import). Load them with `next/font/local`.
- **Font optimization:** spin up a subagent to take those fonts and optimize them for **Czech, Slovak and English** (subset + WOFF2), so the file size stays small. Requirements: `docs/17-brand-and-ui.md#fonts`.

### Frontend subagent (initial app development only)

While building the app initially (the build plan), **delegate frontend work to a new subagent** with:

- model **Claude Opus 5.5**, effort **`high`**
- the **`/frontend-design:frontend-design`** skill (it must invoke it first)
- the brand guidelines, `docs/17-brand-and-ui.md` and the docs for the feature
- the instruction to **think about how users will be working with this app** (who they are, when and on which device they open it, what they need first; see "How users work with ProfitKit" in `docs/17-brand-and-ui.md`)

**Don't do this when the owner is iterating on the UI manually with you in a session.** Then make the changes directly.

## Working on a project this size

- **Keep a work log** in `docs/implementation-log.md` (format in `docs/18-implementation-plan.md`). Any session must be able to resume from it.
- **Outsource the work to subagents** so the main session doesn't run out of context. The main session orchestrates: it briefs subagents, verifies results (lint, typecheck, tests, build, e2e), and updates the log.
- Record every decision that isn't in the docs in the log.

## After v1 is built

Produce the Czech training video, delegated to a subagent: `docs/19-training-video.md`.
