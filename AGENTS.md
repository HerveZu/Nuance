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

Group code by **feature / related logic**, not by technical concern. Keep the
things that change together close together — a feature's component, its state,
its types, and its helpers — instead of scattering them across "all types
here / all hooks there" buckets. Within a file, order by feature flow rather
than by kind. Shared primitives are the exception: genuinely cross-feature
building blocks belong in the shared locations above.

# Commits

Make **focused, single-purpose commits**: one logical change per commit, with a
clear conventional-commit message (`feat:`, `fix:`, `refactor:`, `docs:`,
`chore:`). Don't bundle unrelated changes. Keep formatting/rename noise in
separate commits from behavioural changes.
