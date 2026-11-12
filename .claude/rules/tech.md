# Tech Stack

## Framework

- React 19 with TypeScript
- TanStack Start (full-stack React, SSR) on Vite 8
- TanStack Router (file-based routing in `src/routes/`)

## State & Data

Reach for the TanStack ecosystem first, and only use something else when it has no fitting package.

- Server state / data fetching: TanStack Query
- Forms: TanStack Form
- Tables: TanStack Table
- Lists: TanStack Virtual
- Validation and schemas: Zod (form values with TanStack Form, route search params, API inputs and responses)
- Client state that no TanStack package covers (shared UI state across routes, etc.): Zustand, only when needed
- Prefer router state (search params, loaders, route context) and local `useState` before adding a Zustand store
- Never use Zustand for server data; that belongs in TanStack Query

Packages are not all installed yet. Adding any of them still requires asking first (see
[dependencies.md](dependencies.md)).

## UI & Styling

- Tailwind CSS 4 (utility-first CSS, config in `src/styles.css`)
- shadcn/ui (component library, base-nova style)
- Base UI primitives (`@base-ui/react`)
- Lucide React (icons)
- class-variance-authority + `cn` (styling utilities)

## Code Quality

- ESLint 10 with TypeScript support (`typescript-eslint`, `react-hooks`, `eslint-config-prettier`)
- Prettier with organize-imports and tailwindcss plugins
- Package manager: pnpm

## Common Commands

```bash
# Development
pnpm dev             # Start dev server on port 3000

# Build
pnpm build           # Vite build
pnpm typecheck       # TypeScript check

# Routing
pnpm generate-routes # Regenerate src/routeTree.gen.ts

# Code Quality
pnpm lint            # ESLint check
pnpm lint:fix        # ESLint fix
pnpm format          # Prettier format
pnpm format:check    # Prettier check
pnpm check           # Prettier check + ESLint
```
