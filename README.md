# TanStack Start + shadcn/ui

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from '@/components/ui/button'
```

## Deploy

The app deploys to Vercel through the Nitro Vite plugin (`nitro()` in `vite.config.ts`). The Vercel project is
connected to this GitHub repository, so every push to `master` deploys to production and every other branch gets a
preview deployment. Vercel detects TanStack Start and runs `pnpm build`; no `vercel.json` is needed.

The dummy backend keeps data in memory, so on Vercel it resets whenever a function instance starts.
