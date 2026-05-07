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

### 0. Visual / interaction language has one source

- The **only** authoritative visual + interaction spec for Linkr 3 is [`docs/DESIGN.md`](./docs/DESIGN.md). Cream `#fffefb` canvas, `#201515` warm near-black text, `#ff4f00` Linkr Orange accent, `#c5c0b1` sand borders, Degular Display + Inter + GT Alpina (or licensed substitutes recorded in `docs/DESIGN.md` §3).
- This **supersedes** the previous Claude/Anthropic-inspired spec. Do not re-introduce the parchment palette (`#f5f4ed`, `#c96442`, `#d97757`) anywhere. The old spec is archived for reference at [`design-presets/claude.DESIGN.md`](./design-presets/claude.DESIGN.md).
- Color, typography, radius, spacing, depth, button shape, tab indicator, pill vs icon-button rules — **all** come from `docs/DESIGN.md`. Do not invent new tokens or copy values from a different design system.
- Logic, data flow, state, and API shapes are **out of scope** for this rule. The design system applies to visual + interaction only; existing behavior must be preserved when restyling.

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

## Known god components — split, do not extend

The 2026-05 refactor stopped at stage 7. The following files exceed the size budget and **must not be edited in place** for new features. Instead: extract the part you're touching into a new component under `features/<feature>/components/`, then wire it back in.

| File                                              | Lines  | Suggested split direction                                                                                                      |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `features/plugin/components/plugin-path-demo.tsx` | ~6,979 | Per-panel: SidebarPanel, EmailModule, CreatorCard, SearchModule. Data already in `features/plugin/data/`.                      |
| `app/(workspace)/workspace/discovery/page.tsx`    | ~4,190 | Per discovery flow: CompetitorSearch, ScenarioSearch, TrendingSearch, SimilarSearch, plus a shared ResultsList + QuickFilters. |
| `app/(workspace)/workspace/outreach/page.tsx`     | ~2,542 | OutreachInbox, MailTemplates, EmailSettings, OutreachDashboard (one per `?tab=` value).                                        |
| `app/(workspace)/workspace/settings/page.tsx`     | ~2,274 | Per tab: ProjectsTab, BillingTab, IntegrationsTab, TeamTab.                                                                    |

> The 2026-05-04 library/drawer rewrite split `app/(workspace)/workspace/library/page.tsx` (was ~2,774 lines) and `features/creator/components/creator-profile-drawer.tsx` (was ~1,210 lines) into `features/library/**` and `features/creator/components/drawer/**`. The page is now ≤ 200 lines and the drawer is a thin re-export.

When you split, **keep DOM and classNames byte-identical** — these are refactors, not redesigns. Verify with the user that the page looks the same in `npm run dev` before merging.

If a request would force you to add code inside one of these files, tell the user: _"this would extend a known oversized file — let me split the part I need first, then add the new behavior into the new file."_ Don't just edit in place.

## Mock 数据开关

博主库 mock 数据通过 `features/creator/data/index.ts` 集中导出。所有 UI 与 service 层 (`lib/services/library.ts`) 都只通过该入口取数据。

上线打包时设置环境变量：

```
NEXT_PUBLIC_USE_MOCK=false
```

当此变量为 `false` 时，`getCreators()` 返回 `[]`，由 service 层走真实 API；切换数据源不需要改任何 UI 组件。完全切到真实数据后，可直接删除 `features/creator/data/mock.ts`。
