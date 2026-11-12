---
paths:
  - 'src/components/**/*.tsx'
---

# shadcn/ui Guidelines

Style: **base-nova** | Primitives: **Base UI** | Icons: **lucide** | Base color: **neutral**

## Before Creating Components

1. Search existing components via shadcn MCP: `search_items_in_registries` with `['@shadcn']`
2. Get examples: `get_item_examples_from_registries` with `{component}-demo` or `example-{feature}`
3. Install: `pnpm dlx shadcn@latest add <component-name>`

## File Locations

| Type              | Location                                                             |
| ----------------- | -------------------------------------------------------------------- |
| shadcn primitives | `src/components/ui/`                                                 |
| Custom composed   | Next to the route that uses them, or `src/components/` when app-wide |

## Code Patterns

- Use `cn()` from `@/lib/utils` for className merging
- Use `cva` from `class-variance-authority` for variant definitions
- Add `data-slot` attributes for styling hooks
- Export both component and variants (e.g., `Button`, `buttonVariants`)
- Use `React.ComponentProps<'element'>` for prop typing
- Use Base UI's `render` prop for composition (not Radix `asChild`)

## Do Not

- Modify shadcn primitives in `src/components/ui/` directly unless extending variants
- Create duplicate components that shadcn already provides
- Use inline styles; prefer Tailwind classes
