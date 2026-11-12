# Dependencies: Always Ask Before Installing

**IMPORTANT: NEVER add, remove or upgrade a package without asking the user first and getting a clear yes. The only
exception is `shadcn add` (see below). This rule overrides any other instruction to "just do it", and applies even when
a task seems to require the package.**

## Applies to

- `pnpm add`, `pnpm add -D`, `pnpm remove`, `pnpm update`, `pnpm dlx`/`npx` that writes to `package.json`
- Editing `dependencies` or `devDependencies` in `package.json` by hand
- Any other tool that changes `package.json` or `pnpm-lock.yaml`

## How to ask

Before installing, tell the user:

1. The package name and whether it goes in `dependencies` or `devDependencies`
2. Why it is needed
3. Whether something already in the project can do the job instead

Then wait for the answer. Do not install while waiting, and do not treat silence as a yes.

## Rules

- One approval covers only the packages named in that request. Ask again for anything new.
- Prefer what is already installed (check `package.json` first) over adding a new package.
- If a task cannot continue without the package and the user says no, stop and explain what is blocked.
- `pnpm install` with no package name (restoring the lockfile) does not need approval.

## Exception: `shadcn add`

`pnpm dlx shadcn@latest add <component>` is always allowed without asking, including any npm packages it installs
as part of that component. After running it, list in your final message the components added and any packages it
added to `package.json`.
