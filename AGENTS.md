<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Package manager

This is a **pnpm** project (`pnpm-lock.yaml`). Use `pnpm` for installs and scripts — never `npm install` (it fights pnpm's `node_modules` layout and the lockfile).

# Data fetching: use TanStack Query

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
- Genuine UI state (form inputs, open/closed, which screen) stays local
  `useState` — TanStack Query is for *server* state only.

`useNuance` (`src/hooks/useNuance.ts`) is the reference pattern.

# Reusability

Prefer shared components, hooks, and helpers over duplication. Before adding a
class string, hard-coded colour/size, or a bit of logic, check whether a shared
primitive already covers it (`src/components/ui/*`, theme tokens in
`globals.css`, `src/lib/*`) and extend that instead. When the same pattern
appears 2–3 times, extract it (a component, a theme token, a utility) rather
than copy-pasting. Use theme variables instead of hard-coded values.

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

# Commits

Make **focused, single-purpose commits**: one logical change per commit, with a
clear conventional-commit message (`feat:`, `fix:`, `refactor:`, `docs:`,
`chore:`). Don't bundle unrelated changes. Keep formatting/rename noise in
separate commits from behavioural changes.
