# Tech Stack

## Framework

- React 19 with TypeScript
- TanStack Start (full-stack React, SSR) on Vite 8
- TanStack Router (file-based routing in `src/routes/`)

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
