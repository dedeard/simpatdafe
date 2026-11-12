# Docs Hygiene: Clean Dead Markdown

Stale docs mislead agents and humans more than missing docs. Every task leaves the Markdown in this
repo accurate: update what drifted, delete what is dead.

## When to check

At the end of every task, before reporting done:

1. If you renamed, moved or removed a file, route, field, env var, port, script or feature,
   grep all `*.md` for the old name (`grep -rn "<old-name>" --include=*.md .` excluding
   `node_modules`, `dist`, `.output`, `.git`) and fix or remove each hit.
2. Check the docs you read during the task. If one was wrong, fix it in the same task.
3. If you deleted a doc, grep for its filename and fix every link to it.

## What counts as dead

Delete a Markdown file when **any** of these is true:

| Dead because                      | Examples                                                                    |
| --------------------------------- | --------------------------------------------------------------------------- |
| Describes things that don't exist | Endpoints, files, folders or features that were removed                     |
| Fully superseded                  | Content now lives in a rule in `.claude/rules/`, `README.md` or another doc |
| Scratch output from a past task   | `*-snapshot.md`, debug dumps, one-off prompts or notes whose task is done   |
| Requirements that are now built   | Requirement docs once the feature exists                                    |
| Empty or placeholder              | Only a title, `TODO`, or template text                                      |

If a doc is **partly** stale, update it instead of deleting it.

## Never delete

- `README.md`, `CLAUDE.md`, `AGENTS.md`, `CHANGES.md`
- `.claude/rules/*.md` — edit them; remove one only when its whole topic is gone, and update `CLAUDE.md` in the same change
- Anything under `node_modules/`, `dist/`, generated folders, or files you weren't sure about

## How to delete

- Verify first: grep the code for what the doc describes. Don't delete on a hunch.
- Use `git rm` for tracked files so the deletion shows in the diff.
- If a doc holds information that exists nowhere else and might still matter, move that part to the
  right doc before deleting, or ask the user.
- List every deleted or rewritten doc in your final message with a one-line reason.
