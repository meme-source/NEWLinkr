# Linkr 3 — AI Working Rules

> This file is **automatically loaded by Claude Code** at the start of every session in this repo.
> Read it before making any code changes. These rules exist because earlier AI passes drifted; following them prevents the same drift from recurring.

## What this project is

A Next.js 16 / React 19 / Tailwind 4 app with three product surfaces:

- `app/(plugin)/demo/` — browser-extension prototype preview
- `app/(workspace)/landing/` — marketing landing page
- `app/(workspace)/workspace/{discovery,library,outreach,tracking,settings}` — SaaS workspace

The backend is currently stubbed. API routes exist but return mock or `TODO` responses. Real DB / auth / Anthropic integration is **Phase 0+** work and is intentionally not wired up yet.

## Hard rules — do not violate

### 1. Types come from one place

- The single source of truth for shared types is **`types/api.ts`**.
- Do **not** declare a local `interface Creator`, `interface Project`, etc. inside a page or component. Import from `types/api.ts`.
- If you need a UI-only extension of an API type, name it explicitly (e.g. `DiscoveryCreatorView`) and put it in `features/<feature>/types.ts`. Never re-define an existing name.

### 2. API routes use `zod`

- Every `app/api/**/route.ts` must call `Schema.safeParse(body)` on input. **No `as XxxRequest`** type casts — they bypass validation.
- Request schemas live in **`lib/api/schemas.ts`**, named `<TypeName>Schema`, and `satisfies z.ZodType<TypeName>` so they stay in sync with `types/api.ts`.
- Use **`ok()` / `fail()` / `failValidation()`** from `lib/api/envelope.ts` for responses. Do not return ad-hoc `NextResponse.json` shapes. Do not echo the raw request body back in the response.

### 3. Business logic does not live in `route.ts`

- Route handlers do **only**: parse input → call a service function → format response.
- Services live in `lib/services/<feature>.ts` and are pure(ish) async functions that take a typed input and return typed output.

### 4. Mock data has one home per feature

- A feature's mock data lives in `features/<feature>/data/`.
- **Do not** define mock arrays inline in a page or component file. Import them.
- **Do not** add a second mock file at `lib/mock/`. There is no `lib/mock/`.

### 5. File size budget

- Components: **≤ 300 lines** (target), **400 hard cap**.
- Pages: **≤ 200 lines** — they should compose components, not contain them. If a page exceeds 200 lines, extract pieces to `features/<feature>/components/`.
- If you need to write a large file, **split it as you write**. Do not produce a 1000-line file with the intent of "splitting later".

### 6. Hooks discipline

- **Never** disable `react-hooks/exhaustive-deps`. If the lint complains, fix the dependency array — do not silence it.
- All event-handler functions exposed via React Context **must** be wrapped in `useCallback`, otherwise `useMemo`-ed context values are invalid.
- Cleanup `useEffect` with explicit return functions when subscribing, scheduling timers, or attaching listeners.

### 7. Server / client boundary

- Files that read `process.env.*_SERVICE_ROLE_KEY` or any server secret must start with `import "server-only";`.
- `app/(workspace)/workspace/layout.tsx` should remain a **Server Component** as much as possible. Sidebar interactivity belongs in dedicated `"use client"` subcomponents (`WorkspaceSidebar`, `NotificationMenu`, `UserMenu`).

### 8. Images

- Use `next/image` for all rendered images. Do **not** add `eslint-disable @next/next/no-img-element` to bypass the rule.
- If an image source is dynamic, declare its hostname in `next.config.ts` `images.remotePatterns`.

### 9. Phase stubs fail loud

- `lib/data/db.ts`, `lib/data/supabase.ts`, `lib/ai/claude.ts` are intentional Phase placeholders. They throw on access. Do **not** turn them into silent no-ops.
- When you wire up the real backend, replace the stub bodies entirely; do not edit around them.

### 10. No console.log

- Use `console.warn`, `console.error`, or `console.info`. `console.log` will warn from ESLint.
- Production code should not log at all on success paths.

## Workflow rules

### Before any change

1. **Read `types/api.ts`** if you're touching API or data shapes.
2. **Read the feature's existing components** before adding a new one — mirror the existing pattern.

### After any change

Run: `npm run check`

This runs **typecheck → lint → format-check** in sequence. If any step fails, fix the cause; do **not** weaken the config to make it pass.

If the user asks for a change that would require weakening lint or type strictness, push back and propose an alternative.

### Visual changes

This codebase has strict no-visual-change rules during refactor work. If a task is framed as "refactor" or "cleanup":

- The DOM tree, className strings, and inline styles must stay byte-identical when possible.
- If you must change a className, document why in the commit message.

## Directory map (terse)

```
app/                         Next.js routes (do not put logic here)
  api/**/route.ts            HTTP boundary — zod.parse + service call only
  (plugin)/demo/             Plugin preview surface
  (workspace)/               SaaS workspace + landing
features/<feature>/
  components/                React components (≤ 300 lines each)
  data/                      Feature mock data (only place for mocks)
  types.ts                   Feature-internal types (UI extensions of api types)
lib/
  api/                       respond.ts, schemas.ts, with-auth.ts
  services/<feature>.ts      Business logic (Phase 1+)
  data/                      DB + provider clients (Phase 0 stubs)
  ai/                        Anthropic wrappers (Phase 2 stub)
  scoring/                   Pure scoring functions
  utils.ts                   cn() and small generic helpers only
types/
  api.ts                     Single source of truth for shared types
```

## What "done" means for any task

- [ ] `npm run check` passes
- [ ] No new file > 400 lines
- [ ] No new local re-declarations of existing types
- [ ] No new `eslint-disable` comments
- [ ] No new `console.log`
- [ ] If touching an API route: input is zod-validated and response uses `apiOk` / `apiError`
- [ ] If touching a Client Component with effects: deps array passes exhaustive-deps without disable

If you cannot satisfy a checkbox, surface it to the user **before** committing.
