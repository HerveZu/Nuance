<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Package manager

This is a **pnpm** project (`pnpm-lock.yaml`). Use `pnpm` for installs and scripts — never `npm install` (it fights pnpm's `node_modules` layout and the lockfile).

# Environment variables

All env vars are declared and validated in **`src/env.ts`** (via
`@t3-oss/env-nextjs` + Zod). **Never read `process.env` directly** in app code —
import `env` from `@/env` instead, so a missing/malformed var fails loudly at
startup with a typed value at every call site. Adding a new var means adding it
to the schema in `src/env.ts` first (server vs. `NEXT_PUBLIC_*` client). The
only exception is `drizzle.config.ts`, which runs outside the Next.js runtime
(its env is loaded by dotenv after imports are hoisted) and reads `process.env`
directly.

# Async state: use TanStack Query

All server/async state in client components goes through **TanStack Query**
(`@tanstack/react-query`) — `useQuery` for reads, `useMutation` for writes,
keyed by what the data depends on. **Do not hand-roll fetch state** with
`useState` + `useEffect` (no manual `loading`/`error`/`data` flags, no effects
that refetch when a dependency changes, no manual cache/refetch plumbing). A
dependency change should be a new query key, not a manual reload.

- Reads: `useQuery({ queryKey: [...], queryFn })`. Use `placeholderData:
  keepPreviousData` to avoid flashing on key changes.
- Writes: `useMutation`. When the server returns the new state, `setQueryData`
  it into the cache; otherwise `invalidateQueries`.
- Server actions and the HTTP API are fine as the `queryFn`/`mutationFn` body.
- **Not just data fetching.** Reach for `useQuery`/`useMutation` for *any* async
  operation whose lifecycle you'd otherwise track by hand — anything that
  benefits from `isPending`, `error`/`onError`, `onSuccess`/`onSettled`, retries
  or in-flight de-duping. The operation needn't be a network request (a
  clipboard write, a Web Share call, an async storage write all qualify); the
  win is the managed pending/error/success state, not the fetch.
- Genuine *synchronous* UI state (form inputs, open/closed, which screen) stays
  local `useState` — TanStack Query is for async work, not view state.

`useNuance` (`src/game/useNuance.ts`) is the reference pattern.

# Reusability

Prefer shared components, hooks, and helpers over duplication. Before adding a
class string, hard-coded colour/size, or a bit of logic, check whether a shared
primitive already covers it (`src/components/ui/*`, theme tokens in
`globals.css`, `src/lib/*`) and extend that instead. When the same pattern
appears 2–3 times, extract it (a component, a theme token, a utility) rather
than copy-pasting. Use theme variables instead of hard-coded values.

# Dates & durations: use date-fns

Reach for **date-fns** before writing any custom date or timing logic. Don't
hand-roll calendar maths or epoch arithmetic (`new Date()` juggling,
`d.getTime()` subtraction, `* 60 * 1000` magic numbers) — there's almost always
a named helper (`differenceInCalendarDays`, `subDays`, `format`, …) that is
clearer and handles month/DST edge cases for you.

**Express every duration with `milliseconds()`** (or a sibling like `seconds()`/
`hoursToMilliseconds()`) so the unit is explicit at the literal — write
`milliseconds({ seconds: 1.8 })`, never a bare `1800`, and
`milliseconds({ years: 1 })` instead of `60 * 60 * 24 * 365 * 1000`. When an API
wants a different unit (e.g. cookie `max-age` is in seconds), convert from the
millisecond value (`milliseconds({ years: 1 }) / 1000`) rather than recomputing.

# Comments

Comment the **why**, not the **what**. Explain intent, constraints, and
non-obvious decisions (e.g. "the server clock is the sole authority so a client
offset can't score a future puzzle"). Do **not** add comments that restate the
code ("// loop over items", "// set loading to true"), label obvious structure,
or narrate the diff. If the code already says it, delete the comment.

# Code organization

Organise the tree by **feature**, not by technical role. A feature owns its
components, hooks, server logic, types and helpers in one folder:

```
src/
  game/            # the puzzle: engine, daily, service (core), actions,
    components/     #   useNuance, schemas, storage, keyboard, color + its UI
  leaderboard/     # queries + view
  auth/            # better-auth setup, client, guards, AuthControl/Dialog
  db/              # drizzle client + schema
  components/ui/   # ONLY genuinely cross-feature primitives (design system)
  lib/             # ONLY truly generic helpers (cn, HTTP/CORS)
  app/             # routing only (page/layout/route) — thin, imports features
```

Next.js requires routing files under `app/`, so keep those **thin** and have
them import the feature (e.g. `app/leaderboard/page.tsx` re-exports
`@/leaderboard/LeaderboardView`). Don't create technical-bucket folders like
`hooks/`, `providers/`, `utils/`, `types/` for feature code — a game hook lives
in `src/game/`, not `src/hooks/`. Only put something in `components/ui` or
`lib` when it is **truly generic** (used across features or a pure design-system
primitive); if it serves one feature, colocate it there. Keep things that
change together close together; within a file, order by feature flow.

# Linting & formatting: Biome

**Biome** is the single linter and formatter (there is no ESLint/Prettier). Run
`pnpm lint` (`biome check`) before finishing; `pnpm lint:fix`
(`biome check --write`) applies safe fixes and `pnpm format` formats. Config is
`biome.json` (2-space indent, 100-col, double quotes, trailing commas). Match
that style and keep `pnpm lint` green — if a rule is a genuine false positive,
add a scoped `// biome-ignore <rule>: <reason>` rather than disabling it
project-wide.

# Commits

Make **focused, single-purpose commits**: one logical change per commit, with a
clear conventional-commit message (`feat:`, `fix:`, `refactor:`, `docs:`,
`chore:`). Don't bundle unrelated changes. Keep formatting/rename noise in
separate commits from behavioural changes.
