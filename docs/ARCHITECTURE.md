# Linkr 2 架构说明

> 本文档沉淀 Round 1 结构整理方案，后续架构演进也写在这里。

## 一、产品定位

Linkr 是跨境 DTC 品牌的达人投放工作台（TikTok / IG / YouTube）。

### 三大功能模块

```
┌─────────────────────────────────────────────────┐
│           博主发现（Discovery）                  │
│ ① 找同行投过的     按证据强度排序                │
│ ② 按营销场景找     产品 → 卖点 → 推荐场景 → 人   │
│ ③ 找爆款达人       近期内容明显高于自身/品类基线 │
└─────────────────────────────────────────────────┘
                ↓ 选中候选
┌─────────────────────────────────────────────────┐
│           建联（Outreach）                       │
│ 起草个性化邮件 → 发送（Resend） → 状态追踪      │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│           浏览器插件（Plugin / 找相似 + 找平替） │
│ 用户浏览博主主页 → 触发插件                      │
│ ├ 找相似：内容/形式/视觉/数据接近的候选池        │
│ └ 找平替：相似池 + 成本节省排序                  │
└─────────────────────────────────────────────────┘
```

## 二、目录结构

```
app/
├── layout.tsx              ← 极简根布局
├── page.tsx                ← 站点首页（→ /demo）
├── globals.css             ← 仅 reset
├── (plugin)/
│   ├── layout.tsx          ← 插件主题/字体
│   ├── plugin.css          ← 插件 design tokens
│   └── demo/page.tsx       ← 原型预览页
├── (workspace)/
│   ├── layout.tsx          ← 工作台主题/Provider
│   ├── workspace.css       ← 工作台 design tokens
│   ├── landing/page.tsx
│   └── workspace/
│       ├── layout.tsx      ← 工作台侧边栏 layout
│       ├── discovery/page.tsx
│       ├── outreach/page.tsx
│       ├── library/page.tsx
│       ├── settings/page.tsx
│       └── tracking/page.tsx
└── api/                    ← 后端路由（同事维护）
    ├── creators/[id]/route.ts
    ├── discovery/{competitor,scenario,trending}/route.ts
    ├── outreach/route.ts
    ├── projects/route.ts
    └── health/route.ts

features/                   ← 按业务域聚合
├── plugin/
│   └── components/         ← plugin-path-demo, similar-*
├── creator/
│   └── components/         ← creator-profile-drawer, context
└── project/
    └── components/         ← project-bar, sheet, context

components/ui/              ← 原子组件 (Button, Input, Dialog...)

lib/
├── api/envelope.ts         ← ok/fail 统一返回
├── ai/claude.ts            ← Claude SDK 封装
├── data/
│   ├── db.ts               ← Prisma
│   ├── supabase.ts
│   └── providers/          ← Modash / Apify / Mock
├── scoring/                ← 评分公式（已实现）
├── mock/                   ← 假数据（前端开发用）
├── schemas/                ← zod 校验（待加）
└── utils.ts

types/
└── api.ts                  ← 前后端契约（合约文件）

docs/                       ← 设计文档与实现说明
prisma/schema.prisma
public/
```

## 三、视觉隔离机制

`app/(plugin)/` 和 `app/(workspace)/` 是 Next.js Route Groups（括号目录不影响 URL）。两个 group 各自的 `layout.tsx` 加载独立的 CSS 文件：

- `(plugin)/plugin.css`：插件 design tokens（白底简约）
- `(workspace)/workspace.css`：工作台 design tokens（米黄 SaaS）

修改任何一边的视觉都不会影响另一边。`globals.css` 只保留 reset 和 Tailwind 基础。

## 四、数据流

```
Provider (Modash/Apify)   → Tier 1 原始数据
       ↓
lib/scoring/*             → Tier 2 派生指标 + 排序
       ↓
lib/ai/claude             → Tier 3 语义（仅必要时）
       ↓
PostgreSQL (Prisma)       → 缓存
       ↓
app/api/*/route.ts        → ApiResponse<T> envelope
       ↓
features/*/api.ts         → client fetcher
       ↓
features/*/components/*   → UI
```

### 数据成本三层模型

| Tier | 成本 | 用途 |
|---|---|---|
| Tier 1 | 极低（免费/几乎免费） | Apify/TikHub 一次抓全：粉丝、帖子原始字段 |
| Tier 2 | 几乎免费 | 后端纯算：中位播放、ER、活跃天数、hashtag 重叠 |
| Tier 3 | 高（Claude） | bio embedding、内容形式标签、视觉向量 |

**严格收口**：每个种子博主 3-5 次 AI 调用，与候选数无关。

## 五、前后端契约

`types/api.ts` 是**唯一的接缝**。

- 任何修改都视为合约变更
- PR 标题打 `[contract]` 标签
- 前后端两侧必须互相 review

```typescript
// 标准 envelope
type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};
```

## 六、协作分支模型

```
main          ← 稳定发布版
 └── dev      ← 集成测试分支
      ├── feat/frontend    ← 视觉/交互/组件
      └── feat/backend     ← API/数据层
```

**纪律**：
- 各自在 `feat/*` 上开发 → PR 到 `dev`
- 稳定后从 `dev` 合到 `main`
- 视觉文件（`app/(plugin)/`、`app/(workspace)/`、`features/*/components/`）仅前端改
- `app/api/*`、`lib/data/`、`lib/ai/` 仅后端改
- `types/api.ts`、`lib/mock/` 双方改动都需对方 review

## 七、后续 Roadmap

| Phase | 内容 | 关键产出 |
|---|---|---|
| 0 | Prisma + Supabase 真接入 | DB 可读写 + 用户能登录 |
| 1 | 项目 CRUD + 鉴权 | `/api/projects` 落地 |
| 2 | Claude SDK + 场景解析 | `/api/discovery/scenario?action=parse` 可用 |
| 3 | 第一个 Provider（建议 Modash） | `/api/discovery/competitor` 可用 |
| 4 | 找爆款 trending | `/api/discovery/trending` 可用 |
| 5 | 建联 + Resend 邮件 | `/api/outreach` 可用 |
| 6 | 插件打包（Vite + CRX） | 真正的 Chrome 扩展上线 |

### 横向架构改进（任意时机推进）

1. **运行时校验**：引入 zod，把 `types/api.ts` 升为 schema，API 入参用 `schema.parse`
2. **客户端数据层**：引入 `@tanstack/react-query` 或 SWR
3. **Provider 抽象 + Mock**：`MOCK_MODE` env 切换
4. **API 中间层**：`withAuth` / `withErrorHandler` / `withRateLimit` wrapper
5. **成本追踪**：`usage` 表，按 user/project 统计
6. **可观测性**：Vercel Analytics + Axiom/Logtail
7. **测试**：Vitest（scoring/schema） + Playwright（关键流程）
