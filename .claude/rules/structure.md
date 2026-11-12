# Project Structure

The tree below shows the target layout. Module names (`dashboard`, `projects`, `settings`, ...) are examples; follow the
same shape for real modules.

```
src/
├── components/              # App-wide shared components
│   ├── ui/                 # shadcn/ui primitives (button, dialog, input, etc.)
│   ├── app-logo/           # Example: global brand component
│   └── theme-toggle/       # Example: global theme switcher
│
├── routes/                  # TanStack Router file routes (every file here is a route unless prefixed with `-`)
│   ├── __root.tsx          # Root document (html, head, devtools)
│   ├── index.tsx           # Landing page
│   │
│   ├── _auth/              # Pathless layout: `_` prefix adds no URL segment
│   │   ├── route.tsx       # Auth layout (two-column, shadcn login-02)
│   │   ├── -components/    # Shared components for ALL auth pages
│   │   ├── login/          # /login
│   │   ├── register/       # /register
│   │   └── forgot-password/ # /forgot-password
│   │
│   └── _app/               # Pathless layout: pages live at /dashboard, /projects, ... (no /app prefix)
│       ├── route.tsx       # Authenticated app layout (sidebar + <Outlet />)
│       ├── -components/    # Shared components for ALL app pages
│       ├── -hooks/         # Shared hooks for ALL app pages
│       │
│       ├── dashboard/
│       │   ├── index.tsx
│       │   └── -components/
│       │
│       ├── projects/
│       │   ├── index.tsx           # List page
│       │   ├── -components/
│       │   ├── -hooks/             # Shared by list, create and detail pages
│       │   ├── -types/
│       │   ├── create/
│       │   │   ├── index.tsx
│       │   │   └── -components/
│       │   └── $projectId/         # Dynamic segments use `$` prefix
│       │       ├── route.tsx       # Detail layout (tabs + <Outlet />)
│       │       ├── index.tsx
│       │       ├── -components/
│       │       ├── tasks/
│       │       └── edit/
│       │
│       ├── reports/
│       │
│       └── settings/
│           ├── route.tsx           # Settings layout (settings nav + <Outlet />)
│           ├── index.tsx           # Redirects to general
│           ├── -components/        # Shared by ALL settings pages
│           ├── general/
│           ├── profile/
│           ├── members/
│           ├── appearance/
│           └── notifications/
│
├── lib/                     # Global utilities (no isolation)
│   ├── api/
│   │   ├── client.ts       # HTTP client / server function helpers
│   │   ├── types.ts        # Shared API types
│   │   └── resources/      # One file per domain (projects.ts, members.ts, etc.)
│   └── utils.ts            # General helpers (cn, formatters, etc.)
│
├── hooks/                   # Global hooks (data hooks + app-wide utilities)
├── contexts/                # Global contexts (Auth, Theme)
├── providers/               # Provider wrappers (QueryProvider, etc.)
├── router.tsx               # Router setup
├── routeTree.gen.ts         # Generated, never edit by hand
└── styles.css               # Tailwind entry and theme
```

## Non-Route Files Inside `src/routes/`

TanStack Router turns every file under `src/routes/` into a route. Anything that is not a route must start with `-`
so the router ignores it:

| Kind       | Name            |
| ---------- | --------------- |
| Components | `-components/`  |
| Hooks      | `-hooks/`       |
| Contexts   | `-contexts/`    |
| Types      | `-types/`       |
| Helpers    | `-utils.ts`     |
| Constants  | `-constants.ts` |
| Tests      | `-__tests__/`   |

Wrong: `src/routes/_app/projects/components/ProjectCard.tsx` (becomes the route `/projects/components/ProjectCard`).
Right: `src/routes/_app/projects/-components/ProjectCard.tsx`.

## Isolation Rules

All layers (components, hooks, contexts, types) follow the same isolation hierarchy.

### Hierarchy (most specific → most general)

```
Page layer/          → Only used by that specific page
  ↑
Parent layer/        → Shared by sibling pages only
  ↑
Section layer/       → Shared across section (e.g., all settings pages)
  ↑
App layer/           → Shared across entire app (src/routes/_app/)
  ↑
src/{layer}/         → Global (used everywhere)
```

### Rules

1. Isolate by default: each page owns its own `-components/`, `-hooks/`, `-contexts/`, `-types/` as needed
2. Promote only when shared: move to parent folder only when used by 2+ sibling pages
3. Never skip levels: don't put page-specific items in `src/hooks/` or `src/contexts/`
4. No cross-sibling imports: never import from a sibling page's folder

### Placement Examples

| Used by                                | Place in                |
| -------------------------------------- | ----------------------- |
| Only `members/index.tsx`               | `members/-components/`  |
| `members/` + `profile/`                | `settings/-components/` |
| All settings pages                     | `settings/-components/` |
| `projects/index.tsx` + `$projectId/`   | `projects/-components/` |
| `settings/` + `projects/` + `reports/` | `_app/-components/`     |
| Entire app (including auth)            | `src/components/`       |

Replace `-components/` with `-hooks/`, `-contexts/`, or `-types/` as appropriate.

### Global Directories

- `src/lib/` — API client, dummy backend, resources and utilities (`dates.ts`, `tax.ts`, `slug.ts`, `utils.ts`). Always global.
- `src/hooks/` — Data hooks wrapping API resources, plus app-wide utility hooks. One file per domain: `use-{domain}.ts`.
- `src/contexts/` — Auth and Theme contexts only.
- `src/components/` — UI primitives and app-wide components only.
- `src/providers/` — React provider wrappers (QueryProvider, etc.).

## File Conventions

### Route Module Structure

```
src/routes/_app/{module}/
├── route.tsx          # Layout with <Outlet /> (only if the module has child pages)
├── index.tsx          # Main page (exports `Route` from createFileRoute)
├── -components/       # Module-scoped components
│   ├── index.ts      # Barrel exports
│   └── {Name}.tsx    # PascalCase component files
├── -hooks/            # Module-scoped hooks (if needed)
│   ├── index.ts
│   └── use-{name}.ts
├── -types/            # Module-scoped types (if needed)
│   └── index.ts
├── -utils.ts          # Module-scoped helpers (if needed)
└── -__tests__/        # Module tests
```

### Route Files

- `index.tsx` is the page; `route.tsx` is the layout for the folder and renders `<Outlet />`.
- Keep the route file thin: route config, loader, and a page component that composes `-components/`.
- Page component name: `{Module}Page` (`ProjectsPage`), layout name: `{Module}Layout` (`SettingsLayout`).

### API Resources

- Location: `src/lib/api/resources/{domain}.ts`
- One file per domain. Contains types, API call functions, and constants for that domain.
- Barrel export via `src/lib/api/resources/index.ts`
- Resource files import only `call` from `src/lib/api/rpc.ts`; pages never call server functions directly.

### Dummy API (until the real backend exists)

All data is served by an in-memory dummy backend that runs on the server only:

- `src/lib/api/rpc.ts` — one `createServerFn` that dispatches `call('module.operation', args)` to a handler. Handler names and
  types are checked through `Handlers`, so a wrong name fails `pnpm typecheck`.
- `src/lib/api/dummy/handlers/{module}.ts` — one file per module, flat `'module.operation': async (args) => …` objects, merged in
  `handlers/index.ts`. Validation errors use `assert()` from `dummy/lookup.ts` and surface as form errors.
- `src/lib/api/dummy/seed/` — deterministic seed (`createRng(20261112)`), demo "today" is `2026-11-12` (`src/lib/dates.ts`).
  Generate in dependency order; payments are collected as intents and numbered by date in `finalizePayments`.
- `src/lib/api/dummy/db.ts` — the `Db` type and `getDb()`, kept on `globalThis` so it survives hot reload. Data resets when the dev
  server restarts.
- `src/lib/tax.ts` and `src/lib/dates.ts` — pure calculations shared by the client (live form previews) and the handlers.
  The server always recomputes; never trust a client total.
- Handlers may `import type` from `resources/` but must not import values that import `rpc.ts`.
- To swap in the real backend, replace handler bodies only; resource files and pages stay as they are.

### Document IDs in URLs

Document numbers contain `/` (for example `SPTPD/2026/11/004160`). Use `toSlug()` / `fromSlug()` from `src/lib/slug.ts` for route
params. `NOP` and `wp-0001` style IDs are already URL-safe.

### Global Hooks

- Location: `src/hooks/use-{domain}.ts`
- Naming: `use{Entity}()`, `useCreate{Entity}()`, `useUpdate{Entity}()`
- Barrel export via `src/hooks/index.ts`

### Components

- PascalCase files: `ProjectCard.tsx`. shadcn primitives in `src/components/ui/` keep kebab-case.
- Global components get their own kebab-case folder with a barrel: `src/components/app-logo/{AppLogo.tsx,index.ts}`.

### Dynamic Routes

- Use `$` prefix for dynamic segments: `$projectId/`, `$slug/`
- Nested under the parent module: `src/routes/_app/projects/$projectId/`
- Read params with `Route.useParams()`

### Generated Files

- `src/routeTree.gen.ts` is generated by TanStack Router. Run `pnpm generate-routes` instead of editing it.

### Path Alias

- `@/*` maps to `src/*`
- Always use `@/` imports instead of relative paths when crossing directory boundaries
- Relative imports are fine inside a module (`./-components`, `../-hooks`)
