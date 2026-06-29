# Nuance.day

A daily colour-mixing puzzle with a **server-authoritative** engine and a
**global leaderboard**.

## Architecture (anti-cheat)

The secret recipe never reaches the browser. The client receives only the
palette, the target colour, and the cell weights; every guess is graded by a
server action (`src/app/actions.ts`) that holds the recipe, counts the guesses,
decides win/loss, and reveals the recipe only once the game is over. Scores are
written by the server alone, so they can't be tampered with from the client.
(A determined player could still write a *solver* that brute-forces the visible
target — that's inherent to showing the target and out of scope here.)

- **Leaderboard:** ranked by average guesses-to-solve (lower is better; a loss
  counts as 7). Shows the top 100 plus your own row/rank. Secondary column is
  your streak of consecutive days played. Only today's puzzle is scored.
- **Auth (optional):** [better-auth](https://better-auth.com) with email+password
  and Discord. Anonymous play works; sign in to appear on the leaderboard.
- **Stack:** Next.js 16, Drizzle ORM + Neon Postgres, shadcn/ui, Tailwind v4.

## Setup

1. Copy the env template and fill it in:

   ```bash
   cp .env.local .env.local   # already scaffolded; fill in the values
   ```

   | Variable | What |
   | --- | --- |
   | `DATABASE_URL` | Neon Postgres connection string (pooled/serverless URL) |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | App origin, e.g. `http://localhost:3000` |
   | `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth app. Redirect URL: `http://localhost:3000/api/auth/callback/discord` |

2. Create the database tables (auth + game):

   ```bash
   pnpm db:generate   # generate SQL from src/db/schema.ts (already run once)
   pnpm db:migrate    # apply to Neon
   ```

3. Run the dev server:

   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
