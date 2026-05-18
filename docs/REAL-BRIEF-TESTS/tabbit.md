# Tabbit · AI 浏览器 — Real Brief Test

End-to-end test of Linkr's discovery flow against a real influencer brief.

> **Purpose:** Stop the discovery flow from returning "敏感肌修复面霜 + CeraVe + 12,430 帖子" no matter what the user inputs. Exercise the AI against a real brief and verify it adapts.
>
> **Scope this round:** Only ② Discovery is being touched. Library / Outreach / Tracking are out of scope until discovery is solid.

## 1. Brief (extracted from screenshot 2026-05-08)

```yaml
project:
  id: 20260403
  name: Tabbit · AI 浏览器
  url: https://www.tabbit-ai.com/?lang=zh
  type: AI 工具 / 生产力 / 浏览器扩展
  market: 美/加/英 等发达国家

deliverables:
  count: 30
  mix:
    head: 50%      # 15 人
    mid:  40%      # 12 人
    tail: 10%      # 3 人  (Micro 1K-10K)

platform:
  primary: [youtube, x]
  secondary: [tiktok]

audience_profile_must:
  - AI 教程类
  - AI 产品类
  - AI 测评类
  - AI & 科技工具类（工具横评 / AI 应用测评）
  - 职场 / 生产力类（Personal Productivity / Notion / 工作流 / Second Brain）
  - 学生 / 学术圈（研究生 / 博士生 · 文献整理 + AI 辅助写作痛点）

audience_profile_must_not:
  - AI 主播（要真人出镜）
  - 最近纯广告无互动无内容生产力
  - 带的产品偏 APP 居多的优先级降低

follower_tiers:
  head:        ">=100K"
  mid:         "10K-100K"
  tail_micro:  "1K-10K"

median_views:
  head:        "15K-80K"
  mid:         "1.5K-15K"
  tail_micro:  "200-1.5K"

requirements:
  language: en
  gender: any
  must_voiceover: true              # 口播
  content_retention: 90d            # 三个月内不允许删除

budget:
  cpm_based: true
  flat_fee_rmb: 400
  rights:
    paid_ads: 60d
    distribute_platforms: [tiktok, instagram, youtube]

deliverables_per_creator:
  youtube: 1 支整合视频（5-15 分钟，最长 20 分钟）
  x:       1 条主 Thread (5-8 推) + 1 条 Follow-up（48-72h 内）
  tiktok_or_yt_shorts: 1 条短视频（60-120s）
```

## 2. Linkr 全局功能流程（这次仅动 ②）

```
brief 文件
    │
    ▼
① Project Setup        (ProjectSwitcher · 项目记忆 · 客户硬条件)
    │
    ▼
② Discovery 博主发现   ← 这次跑通的就是这里
    ├─ Tab 1 找同行投过的
    ├─ Tab 2 按营销场景找   ◄── Tabbit brief 主要落在这里
    └─ Tab 3 找爆款达人
    │
    ▼
③ Library 博主库      (收藏池 · 项目分组 · 候选/已建联/已合作/No)
    │
    ▼
④ Outreach 外联        (邮件模板 · 发件 + 状态 · 议价记录)
    │
    ▼
⑤ Tracking 投后追踪    (帖子录入 · 数据回流 · 跟预算对账)
    │
    ▼
⑥ Settings             (项目结算 / 团队 / 集成)
```

**为什么 Tabbit 落在 Tab 2「按营销场景找」：** 这份 brief 没指定要找投过同类竞品的人（不是 Tab 1），也不是只要近期爆款（不是 Tab 3），而是按"作者类型 × 合作方式"去配 — 这是 Tab 2 的核心。

## 3. Discovery 段细化流程（标真/假）

```
A. 产品识别
   输入: 项目 URL = https://www.tabbit-ai.com/?lang=zh
   要做:
     ① 抓 og:title / og:description / og:image
     ② LLM 提取 产品名 / 品类 / 核心卖点 / 受众
   后端: ✅ Anthropic LLM
   现状: StructuredEditor 接受 URL chip，解析是 mock

B. 意图识别（用户选 Tab + freeText）
   输入: 用户在哪个 Tab + 输入框里写的话
   要做:
     用户可贴整段 brief 进 freeText
     LLM 解析出 平台/地区/语言/粉丝分级/均播分级/画像清单/绝对不要的画像/Deliverables
     → 写到 ChatChips + 项目记忆
   后端: ✅ Anthropic LLM
   现状: Tab 显式选；freeText 不解析

C. Agent 流式中段（按 Tab 走）
   Tab 2 三步:
     Step C 配作者类型     基于 brief 画像清单 → AI 教程类 / AI 测评类 / 工具横评 / Productivity / 学术圈
     Step D 配合作方式     基于 Deliverables → YTB 整合视频 / X Thread+Follow-up / TT 短视频
     Step E 场景组合推荐    top 4 卡（作者类型 × 合作方式）
   后端: ✅ Anthropic LLM
   现状: 写死的"敏感肌修复面霜"

D. 候选博主筛选（出口）
   硬过滤: 平台 ∈ {YT, X, TT} · 地区 ∈ {US, CA, GB, ...} · 粉丝级 50/40/10 · 排除 AI 主播 / 纯广告
   软排序: LLM 给每个候选打 0-100 + 推荐理由
   后端: ✅ LLM 跑软排序；博主池保持 mock
   现状: MOCK_CREATORS 写死；applyHardFilters 只看 platform/country/follower/views

E. 出口卡 + ResultsCanvas
   要做:
     - 副标题里加 brief 摘要（30 位需求 · 美/加/英 · ...）
     - Tab 2 列表按作者类型分组
     - 每张卡片显示「为什么推荐」
   后端: ✅ LLM 写推荐理由；分组逻辑客户端
```

## 4. 后端：Anthropic API

- 仅接 LLM（Claude Haiku 走低成本场景，Claude Sonnet 走产品理解 + 推荐理由生成）
- 博主池保持 `MOCK_CREATORS` 不动
- 每轮完整对话预算 ≈ \$0.018（≈ ¥0.13）；追问 ≈ \$0.0004
- Key 存放：`.env.local` 的 `ANTHROPIC_API_KEY`，不进 git
- Console 设月度预算上限 \$20 防意外烧

**Key 申请 + 配置任务（用户尚未完成）：**
1. 注册 console.anthropic.com
2. Billing 充 \$5
3. Limits 设月度上限 \$20
4. API Keys 创建 `linkr-local-dev`
5. 写入 `.env.local`：`ANTHROPIC_API_KEY=...`
6. 把 `.env.local` 加进 `.gitignore`（确认已存在）

## 5. 实施阶段拆分

| 阶段 | 内容 | 是否需要 LLM Key | 预估 |
|---|---|---|---|
| **S0** | 流程梳理 + brief 提炼 + 备份机制 | ❌ | ✅ 已完成 |
| **S1** | 把 brief 文本作为输入，本地 mock LLM 返回结构化解析（先不发 API） | ❌ | 1 会话 |
| **S2** | Tab 2 中段（Step C/D/E）改成接收 S1 的解析结果，渲染真实数据 | ❌ | 1 会话 |
| **S3** | applyHardFilters 扩展 — 接受 brief 完整硬条件 + 50/40/10 比例采样 | ❌ | 1 会话 |
| **S4** | 接 Anthropic API · 替换 S1 的 mock LLM 为真调用 | ✅ 需要 | 1 会话 |
| **S5** | LLM 软排序 + 推荐理由生成 + ResultsCanvas Tab 2 按作者类型分组 | ✅ 需要 | 1 会话 |

> S0-S3 完全不烧钱，纯前端 + mock LLM。等到 S4 才需要 Key。这意味着我们可以把大部分进度都先做完，最后一公里再用 Key 验证。

## 6. 唤醒契约

要启动这个测试 / 接续进度，用户说以下任意一种即可：

- "继续 Tabbit 测试"
- "用 Tabbit brief 跑一次"
- "看下 Tabbit 那份"

我会：
1. 读 `~/.claude/projects/-Users-meme-Downloads-Linkr-4-0/memory/MEMORY.md`
2. 找到指向 `docs/REAL-BRIEF-TESTS/tabbit.md` 的那一行
3. 读这份文件的 `progress` 块
4. 按 `next:` 列表干活

## 7. 进度

```yaml
progress:
  stage: "S3. brief 驱动筛选 + 50/40/10 采样 — 已完成"
  done:
    # S0
    - 全局流程图已确认
    - Discovery 段细化流程已确认
    - Tabbit brief 提炼并存档
    - 项目 URL 已收：https://www.tabbit-ai.com/?lang=zh
    - 备份机制就位（docs + memory 双写）
    - 阶段 S0-S5 拆分完毕
    # S1
    - 接口契约：ParsedBrief / ParsedProduct（features/discovery/v2/lib/parsed-brief-types.ts）
    - 两份 fixture：tabbit-fixture.ts（Tabbit）+ demo-fixture.ts（CeraVe，原写死内容已抽出）
    - mock parsers：brief-parser.ts + product-parser.ts，关键词路由到 fixture，PARSE_LATENCY 模拟 LLM 延迟
    - mockProductTitle 加 tabbit 路由，跟 parseProduct 同步
    - DiscoverySplitView.handleIntakeSubmit 串接：先 parseBrief → setParsedBrief + 同步 ChatChips（platform/countries）→ 再 runStreamingAgent
    - parsedBrief 用 console.info 打印供 devtools 验证（S2 时移除）
    - Discard 时清空 parsedBrief
    - typecheck / lint / format 全干净
    - **修：S1 引入的双提交 bug** —— 用户在 parseBrief 的 1.1s 异步窗口内多按几次 Enter / 提交按钮，会有多个并发 runStreamingAgent 把 step DOM 重复写入同一个 stepsContainer。修法：加 `intakeInFlightRef` 同步守卫，覆盖 intake 与 follow-up 两个入口
    - **修：用户气泡 URL 重复** —— 上方 chip 已显示 URL，下方 freeText 又把 productLine 整段打一遍。修法：UserBubble 加 stripProductLine() 过滤掉 "我的产品：..." 行
    # S2
    - ParsedBrief 类型扩展：sceneCombos / cooperationMethods / competitorBrands / categoryBaseline / trendLabels / scanSummary 全部写进类型契约
    - tabbit-fixture 补完 Tab 2 内容（cooperationMethods + sceneCombos）
    - demo-fixture 补完三 Tab 全部内容（保留旧体验）
    - agent-steps.ts 重写：getAgentSteps(intent, brief)，三 Tab 各自 buildXxxSteps(brief) 动态构建
    - STEP_PRODUCT/ICP 不再写死，从 brief.product 读 name / brand / market / sellingPoints / audience
    - 缺字段时静默跳过对应 step（避免空 chip 行）
    - run-agent-flow 接 brief 参数；split-view 把 parsedBrief 传给 runStreamingAgent
    - follow-up 复用上一次的 parsedBrief（不重新 parse）
    - 移除 S1 console.info 验证日志
    - parsedBrief state 真正被消费
    # S3
    - Creator 类型扩展：audienceProfileTags?: string[]（可选，老博主不填）
    - MOCK_CREATORS 从 24 → 54（新增 c25-c54），全部 US/CA/GB，覆盖 head/mid/tail 三档，带 AI / Productivity / 学术圈 / Notion 等画像 tag
    - filters.ts 加 applyBriefFilters(creators, brief)：多平台并集、多国并集、按 brief.followerMix 50/40/10 比例采样、不足 backfill 余下候选
    - 内部 sampleByMix：每档按 evidence + ER + followers 排序后取 quota；rounding 误差由最大档吸收
    - split-view intake 改用 applyBriefFilters；chip 切换 / follow-up 仍走 applyHardFilters（不破坏交互）
    - 移除 runStreamingAgent 多余的 chatChips 依赖
    # S3.1 修复：诚实表现"未识别产品"
    - 新增 unknown-fixture（sourceVariant: "unknown"），所有 step content 字段留空让 builder 自动跳过
    - brief-parser：未命中 Tabbit/Demo 关键词时改返 UNKNOWN_BRIEF（之前会偷偷退到 DEMO_BRIEF 让用户看到错误的"敏感肌面霜"）
    - mockProductTitle：未识别 URL 改成"未识别 · 待 AI 解析"（之前是"已识别产品"，假装识别成功）
    - Step A/B 在 unknown 时显示"未识别产品 / AI 暂无法从该链接提取产品信息"
    - getExitCopy 接 brief 参数，unknown 时副标题显示"AI 未识别产品 — 列表按通用条件筛选，接入 LLM 后将自动重排"
    - ResultsCanvas 把 parsedBrief 传给 getExitCopy
  next:
    # S4
    - 接 Anthropic API（需用户 Key），替换 brief-parser/product-parser 内部为真调用
    # S5
    - LLM 软排序 + 推荐理由生成
    - ResultsCanvas Tab 2 按作者类型分组
    # S3.5（可选 · 等用户启动）
    - 黑名单过滤（audienceProfilesMustNot）—— 当前 MOCK_CREATORS 没有"AI 主播"等 tag，等真接 LLM 后由 LLM 标注
  blockers:
    - 无
last_updated: 2026-05-08
```

## S3 验收方法

**场景 A — Tabbit URL：** 贴 `https://www.tabbit-ai.com/?lang=zh`，提交
- 出口卡 N 应该接近 30（具体值取决于 youtube/tiktok 平台并集 + US/CA/GB 三国）
- 列表里**绝大多数博主头像旁是 🇺🇸 🇨🇦 🇬🇧 三种国旗**（不再混着 SEA / KR / JP 老博主）
- 粉丝级分布大致 50/40/10（头部 100K+ 占多 · 中腰部 10K-100K 居中 · 尾部 1K-10K 少数）
- 看到 @matt.aiworkflow / @productivitypaige / @daniel.toolsreview / @sara.aiproductivity / @notion.amelia 等新博主 — **而非敏感肌护肤博主**

**场景 B — Demo URL：** 贴 `https://www.cerave.com/`，提交
- 出口卡仍是旧的 24 个博主 demo 体验（demo-fixture 的 platformsPrimary=tiktok / countries=us，会过滤掉新加的 c25-c54 中没有 tiktok 的、CA/GB 国家的博主）

**场景 C — 切 chip：** Tabbit 路径完成后，在 chip bar 切国家或粉丝级
- 列表实时按 chip 重新过滤（applyHardFilters 路径）—— 这是为了不破坏现有交互
- 切完之后再"重提交" intake 才会重走 applyBriefFilters

