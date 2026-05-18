# Real Brief Tests

End-to-end product validation against real customer briefs. Each brief sits in its own file; this README is the index.

The point: when we test against a real brief, we exercise the full product on data the team will actually see. Mock-only flows can't catch "the AI returns the same answer no matter what you input."

## Active briefs

| File | Project | Stage | Status |
|---|---|---|---|
| [tabbit.md](./tabbit.md) | Tabbit · AI 浏览器 | 1. brief 提炼 + 流程梳理 | active |

## How to wake the next session

> Anyone (including the next Claude session) should be able to pick up exactly where we left off by reading the brief file directly. Each brief file has a `progress` block at the bottom — that's the source of truth.

If you (Claude) are entering a fresh session and the user says something like:

- "继续 Tabbit 测试"
- "用 Tabbit brief 跑一次"
- "看下 Tabbit 那份"

→ Read the relevant file in this directory, find its `progress` block, do what `next:` says.

## Conventions

- One markdown file per real brief, named after the project (lowercase, kebab-case)
- Sensitive identifiers (contact info, internal project IDs that shouldn't go public) are kept out of these files; substitute with `<PLACEHOLDER>` and document the substitution
- Every file ends with a `progress` YAML block — `stage`, `done`, `next`, `blockers`, `last_updated`
- When marking work done, update both `done:` (append) and `next:` (rewrite)
