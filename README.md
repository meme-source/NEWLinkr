# Linkr 2

跨境 DTC 品牌的达人投放工作台（TikTok / Instagram / YouTube）。

## 快速开始

```bash
npm install
cp .env.example .env.local      # 填入真实值
npm run dev                      # http://localhost:3000
```

## 路由结构

| URL | 说明 |
|---|---|
| `/` | 重定向到 `/demo`（插件预览） |
| `/demo` | 浏览器插件原型预览页（找相似 / 找平替） |
| `/landing` | 营销落地页 |
| `/workspace` | 工作台首页（→ `/workspace/discovery`） |
| `/workspace/discovery` | 博主发现 |
| `/workspace/library` | 博主库 |
| `/workspace/outreach` | 建联中心 |
| `/workspace/tracking` | 投放追踪 |
| `/workspace/settings` | 设置 |
| `/api/*` | 后端 API（详见 `app/api/`） |

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19 + TypeScript
- **样式**: Tailwind CSS 4 + 自定义 design tokens
- **动效**: Framer Motion + GSAP
- **数据**（规划中）: Prisma + Supabase + 第三方 Provider（Modash/Apify）+ Claude SDK

## 目录约定

```
app/
├── (plugin)/        ← 插件视觉，独立 design tokens（plugin.css）
└── (workspace)/     ← 后台视觉，独立 design tokens（workspace.css）

features/            ← 按业务域聚合的组件 + hooks + 客户端 fetcher
components/ui/       ← 原子组件（Button、Input...）
lib/
├── api/             ← API 工具（envelope）
├── ai/              ← Claude SDK 封装
├── data/            ← DB / Provider / Supabase
├── scoring/         ← 评分公式
├── mock/            ← 假数据
└── schemas/         ← zod 校验（待加）
types/api.ts         ← 前后端契约（合约文件，改动需双方 review）
docs/                ← 设计文档与实现说明
```

详见 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

## 协作约定

- **`main`** 稳定发布版
- **`dev`** 集成测试分支
- **`feat/frontend`** 视觉 / 交互 / 组件
- **`feat/backend`** API / 数据层 / Provider 接入

任何对 `types/api.ts` 的改动都视为合约变更，PR 标题打 `[contract]` 标签，前后端互相 review。
