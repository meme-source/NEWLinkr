# Discovery v2 — 双屏尺寸规范

参考：Cursor IDE / Vercel v0 / Claude Desktop / ChatGPT Canvas / Linear / Notion AI

## 整页结构

```
┌──────────────┬────────────────────┬──────────────────────────────────────┐
│ Workspace    │ Agent 控制台 (Chat)│ Result Canvas (内容画板)             │
│ Sidebar      │ 对话 + 进度 + 输入 │ 候选博主瀑布流（auto-fill 310px）    │
│ 56 / 224 px  │ 25%                │ 75%, min 640 px                      │
└──────────────┴────────────────────┴──────────────────────────────────────┘
```

> 2026-05 更新：Agent 控制台从 28vw clamp 切到固定 25 % grid 列，匹配
> `/tmp/agent-canvas-mock.html` §1。Canvas 用 `auto-fill, minmax(310px, 1fr)`
> 自适应 2-3 列，无需手动声明断点。

## 各区域宽度

| 区域                      | min    | default    | max    | 说明                            |
| ------------------------- | ------ | ---------- | ------ | ------------------------------- |
| Workspace Sidebar（折叠） | 56 px  | 56 px      | 56 px  | icon-only                       |
| Workspace Sidebar（展开） | 224 px | 224 px     | 224 px | 展示项目导航                    |
| Agent 控制台（左）        | —      | 25%        | —      | grid 列；25:75 splitt           |
| Result Canvas（右）       | 640 px | 75%        | —      | 至少容纳 2 张 310 px 卡片 + gap |
| 卡片单元                  | 280 px | 310–360 px | 360 px | auto-fill minmax(310px, 1fr)    |

## 关键断点

| 视口宽度     | 行为                                                 |
| ------------ | ---------------------------------------------------- |
| < 1024 px    | 触发响应式回退：建议显示提示「使用桌面端」或单栏堆叠 |
| 1024–1279 px | Sidebar 自动折叠为 56 px；Canvas 容纳 2 张卡片       |
| 1280–1599 px | Sidebar 折叠态默认；Canvas 容纳 2 张卡片，宽阔留白   |
| ≥ 1600 px    | Sidebar 可展开；Canvas 容纳 3 张卡片                 |

## 进入双屏自动折叠 Sidebar

进入 `Result Canvas`（即用户已 submit）时，自动调用
`useSidebarCollapse().setCollapsed(true)` —— 让 Canvas 拿到尽量宽的宽度。
退出回 intake hero 时不强制展开，让用户保留自己的偏好。

## 行业参考（用作选型依据）

- Cursor IDE：chat panel 280–560 px，default 360 px
- Vercel v0：chat 380–460 px，canvas grows
- Claude Desktop：chat 280–480 px
- ChatGPT Canvas：默认 50/50，chat 最小 ~380 px
- Linear：side panel 280–360 px
- Notion AI：360 px

我们的取值（340–460）落在共识区间靠右一点，因为 Linkr 的对话里需要展示
带 Step 进度和总结段落 —— 320 太挤会折行多次。
