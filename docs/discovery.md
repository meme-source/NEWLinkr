# Linkr「博主发现」页实现逻辑

生成日期：2026-04-25  
适用页面：Web 工作台「博主发现」页  
核心入口：

- 找同行投过的
- 按营销场景找
- 找爆款达人

文档目的：说明「博主发现」页前端应该如何展示、后端需要调用哪些数据、系统如何做判断，以及如何让用户觉得结果可信、易懂、可执行。

---

## 1. 核心判断

「博主发现」页不应该只是一个普通达人搜索页。

它本质上是给用户三种不同的找人策略：

```text
找同行投过的 = 找被市场验证过的人
按营销场景找 = 找适合把当前产品拍出来的人
找爆款达人 = 找当前品类里最近正在起量的人
```

这三个入口的后台逻辑不一样，前端解释方式也不一样。

| 入口         | 用户真实问题                 | 核心判断                                   |
| ------------ | ---------------------------- | ------------------------------------------ |
| 找同行投过的 | 同品类品牌都在用谁？         | 是否有合作证据，以及合作内容表现如何       |
| 按营销场景找 | 我的产品适合找什么类型达人？ | 产品适合哪些内容场景，哪些达人擅长这些场景 |
| 找爆款达人   | 最近谁在这个品类里内容变火？ | 近期内容是否明显高于本人基线和品类基线     |

---

## 2. 页面整体前端结构

### 2.1 首页入口卡片

页面首页保留三张入口卡：

```text
找同行投过的
同品类品牌都在用谁，直接找被验证过的达人

按营销场景找
输入产品，AI 匹配最适合的内容场景和达人

找爆款达人
你的品类里最近谁的内容最火
```

建议每张卡点击后进入不同的发现流程，不要直接共用同一个搜索逻辑。

### 2.2 点击入口后的流程

每个入口建议都有三层：

```text
输入条件 → 系统解释判断依据 → 结果列表
```

不要用户一点卡片就直接看到一堆达人。

更好的方式是先让用户理解系统会怎么找：

```text
你正在使用：找同行投过的

系统将根据：
- 品牌提及
- #ad / sponsored
- 品牌 @
- 产品链接 / 折扣码
- 合作帖表现
来判断哪些达人可能投过同类品牌。
```

这样用户会更信任结果。

### 2.3 结果页顶部信息

结果页顶部应该显示「本次搜索依据」。

示例：

```text
本次搜索依据
平台：TikTok
品类：护肤
时间范围：近 90 天
分析内容：12,430 条帖子
找到候选：286 位达人
已过滤：项目已 No / 长期不活跃 / 高风险账号
```

这个区域很重要，因为它告诉用户：

- 系统不是随便推荐。
- 系统真的分析了数据。
- 系统知道过滤了哪些不该出现的人。

---

## 3. 入口一：找同行投过的

### 3.1 产品定义

「找同行投过的」不是找同行品牌的粉丝，也不是找提到过某个品牌的人。

它真正要回答：

> 哪些达人曾经给同品类品牌、竞品品牌、相似产品做过内容，并且这些内容表现还不错？

### 3.2 用户输入

前端输入可以有两种：

#### 方式 A：输入竞品品牌

```text
输入品牌名 / 官网 / 社媒账号
例如：CeraVe、Rhode、Glow Recipe
```

#### 方式 B：选择同品类品牌

系统根据当前项目的品类和产品，推荐同品类品牌。

```text
AI 推断：同品类竞品
- CeraVe
- La Roche-Posay
- The Ordinary
- Glow Recipe
```

### 3.3 后端需要的数据

#### 品牌数据

```text
brand_id
brand_name
brand_aliases
official_social_handles
official_domains
product_keywords
category
country_or_market
```

用途：

- 识别帖子里是否提到品牌。
- 识别品牌 @、官网链接、折扣码、常见缩写。

#### 内容数据

```text
post_id
creator_id
platform
post_url
caption
hashtags
mentions
external_links
published_at
views
likes
comments
shares
saves
cover_url
ocr_text_optional
```

用途：

- 从帖子里识别品牌提及和疑似合作。
- 计算合作内容表现。

#### 合作证据数据

```text
brand_mention_type
ad_disclosure_detected
discount_code_detected
product_link_detected
official_brand_mention
evidence_strength
evidence_post_url
```

合作证据强度建议分级：

```text
强证据：
#ad / sponsored + 品牌 @ + 产品内容

中证据：
品牌 @ / 折扣码 / 官网链接 / 明确合作话术

弱证据：
只在 caption 或 hashtag 中提到品牌名
```

#### 达人数据

```text
creator_id
handle
platform
followers
median_views
engagement_rate
recent_active_at
estimated_price
has_email
email_status
risk_level
```

用途：

- 判断这个达人是否值得联系。
- 判断合作内容表现是否高于本人平时水平。

### 3.4 后端判断逻辑

```text
1. 用户输入竞品品牌或选择同品类品牌
2. 后台扩展品牌关键词、品牌别名、官方账号、官网域名
3. 在帖子库中搜索品牌提及、@、hashtag、链接、折扣码
4. 判断每条内容是否为疑似合作内容
5. 为每条内容打合作证据强度
6. 提取内容作者，按 creator_id 去重
7. 聚合每个达人的合作证据和表现数据
8. 过滤当前项目已 No、长期不活跃、高风险账号
9. 按合作证据强度、内容表现、品类相关性、可联系性排序
```

### 3.5 推荐排序

建议排序公式：

```text
同行合作推荐分 =
  合作证据强度 35%
+ 合作内容表现 25%
+ 品类相关性 20%
+ 近期活跃 10%
+ 可联系性 10%
```

解释：

- 合作证据强度：决定「是否真的投过」。
- 合作内容表现：决定「投过之后效果怎么样」。
- 品类相关性：决定「是不是当前项目也适合」。
- 近期活跃：避免推荐已经不更新的人。
- 可联系性：邮箱、外链、合作入口是否可用。

### 3.6 前端结果卡片

卡片应该突出「证据」。

示例：

```text
@skincare_sam
同行合作证据：高

为什么推荐：
- 近 60 天发布过 CeraVe 相关合作内容
- 帖子含 #ad 和品牌 @cerave
- 合作帖播放 86K，高于本人中位播放 1.8x

关键数据：
粉丝 320K
中位播放 45K
合作帖播放 86K
ER 5.4%
邮箱已找到

操作：
查看证据帖 / 收藏 / No / 发邮件
```

### 3.7 详情页展示

详情页建议显示：

```text
合作证据

品牌：CeraVe
证据强度：高
证据来源：
- caption 提到 CeraVe
- 包含 #ad
- @cerave 官方账号
- 内容为产品测评

证据帖：
标题：My honest CeraVe routine review
发布时间：2026-04-12
播放：86K
点赞：5.2K
评论：410
高于本人中位播放：1.8x

系统结论：
该达人有明确同品类合作经验，且合作帖表现高于本人平时水平，适合作为优先建联对象。
```

### 3.8 MVP 实现路径

MVP 可以先做轻量版：

- 支持用户输入品牌名。
- 用 caption、hashtag、mentions、links 做合作证据识别。
- 暂不做封面 OCR 和视频内容识别。
- 合作证据只分高 / 中 / 低。
- 结果必须展示证据帖链接。

后续增强：

- 加品牌别名库。
- 加折扣码识别。
- 加封面 OCR。
- 加历史合作品牌列表。
- 加同品类品牌自动推荐。

---

## 4. 入口二：按营销场景找

### 4.1 产品定义

「按营销场景找」不是简单找某个品类达人。

它真正要回答：

> 这个产品适合被拍成什么内容？哪些达人擅长拍这些内容？

比如同样是护肤产品，不应该只找「护肤达人」，而应该拆成：

```text
晚间护肤 routine
成分科普测评
敏感肌修复前后对比
GRWM 妆前护肤
开箱初体验
```

### 4.2 用户输入

前端输入可以支持：

```text
产品链接
产品名称
品类
产品卖点
目标平台
目标市场，可选
预算，可选
```

默认最好让用户输入产品链接或产品描述。

### 4.3 后端需要的数据

#### 产品数据

```text
product_url
product_name
category
brand_name
price
selling_points
target_user
usage_scenarios
product_images
```

如果用户输入产品链接，后台需要解析：

- 页面标题
- 商品主图
- 产品描述
- 卖点文案
- 价格
- 品类
- 使用场景

#### 场景库数据

系统需要维护一套营销场景库：

```text
scene_id
scene_name
category
description
content_format
typical_keywords
example_hooks
best_for_product_traits
```

示例：

```text
晚间护肤 routine
适合：修复、舒缓、连续使用、肤感展示
内容形式：真人出镜 + 步骤教程
常见关键词：night routine, repair, calm skin, sensitive skin
```

#### 达人内容标签

```text
creator_id
scene_tags
scene_distribution
top_scene
scene_median_views
scene_engagement_rate
scene_viral_rate
content_format_tags
```

用途：

- 判断达人是否擅长某个场景。
- 判断该达人在这个场景下表现好不好。

### 4.4 后端判断逻辑

```text
1. 用户输入产品链接或产品描述
2. 后台解析产品信息
3. AI/规则提取品类、卖点、使用场景、目标人群
4. 从营销场景库中匹配 3-6 个适合场景
5. 前端展示场景卡，让用户选择
6. 用户选择一个或多个场景
7. 后台找擅长这些场景的达人
8. 按场景匹配度、该场景内容表现、内容形式、商业可用性排序
```

### 4.5 场景推荐排序

场景本身也要排序。

```text
场景推荐分 =
  产品卖点匹配 40%
+ 内容可表达性 25%
+ 同品类历史表现 20%
+ 达人供给数量 15%
```

解释：

- 产品卖点匹配：这个场景能不能讲清产品价值。
- 内容可表达性：能不能拍出来、有没有前后对比、步骤展示。
- 同品类历史表现：这个场景过去在平台上表现如何。
- 达人供给数量：有没有足够多达人擅长这个场景。

### 4.6 达人排序

```text
场景达人推荐分 =
  场景匹配度 40%
+ 场景内容表现 30%
+ 内容形式适配 15%
+ 商业可用性 10%
+ 数据稳定性 5%
```

### 4.7 前端场景卡片

在展示达人前，先展示 AI 推荐场景。

示例：

```text
AI 推荐场景：晚间护肤 routine

为什么适合：
- 产品卖点是修复和舒缓
- 适合展示连续使用和肤感变化
- 同类内容在 TikTok 美妆类互动较高

可匹配达人：342
平均 ER：6.8%
推荐内容形式：真人出镜 + 步骤教程

操作：
选择这个场景
```

### 4.8 前端达人卡片

示例：

```text
@glowwithsun
场景匹配度 91

为什么推荐：
- 擅长晚间 routine / 敏感肌修复
- 近 10 条内容中 5 条属于该场景
- 该场景中位播放 42K

推荐拍法：
使用前后 + 夜间步骤教程

关键数据：
粉丝 89K
中位播放 42K
ER 6.1%
预估报价 $300-500
邮箱已找到
```

### 4.9 详情页展示

详情页建议显示：

```text
场景适配分析

产品卖点：
修复、舒缓、敏感肌、夜间使用

推荐场景：
晚间护肤 routine

达人为什么适合：
- 过去 30 天发布 5 条 routine 内容
- routine 内容中位播放 42K，高于账号整体中位播放 1.3x
- 评论中高频词包含 sensitive skin、night routine、calm

建议 brief：
让达人以「夜间护肤流程」切入，重点展示使用步骤、肤感、第二天状态变化。
```

### 4.10 MVP 实现路径

MVP 重点：

- 支持产品链接或产品描述输入。
- AI 提取品类和卖点。
- 先维护一套固定场景库。
- 每个品类先支持 5-10 个常见营销场景。
- 达人内容先用标题、caption、hashtag 做场景标签。
- 展示场景推荐理由和达人推荐理由。

后续增强：

- 自动解析商品页面图片。
- 加同品类场景表现基准。
- 根据平台差异推荐不同场景。
- 自动生成 brief。
- 加历史转化/ROI 数据。

---

## 5. 入口三：找爆款达人

### 5.1 产品定义

「找爆款达人」不是找粉丝最多的人，也不是找单条播放最高的人。

它真正要回答：

> 在我的品类里，最近哪些达人内容表现明显高于自己平时水平或同类账号水平？

更准确的产品名可以考虑：

- 近期高表现达人
- 正在起量的达人
- 爆款潜力达人

如果直接叫「爆款达人」，前端需要解释清楚判断依据。

### 5.2 用户输入

```text
品类 / 产品
平台
时间范围：近 7 天 / 14 天 / 30 天
达人量级，可选
是否只看有邮箱，可选
```

### 5.3 后端需要的数据

#### 近期内容数据

```text
post_id
creator_id
platform
category
published_at
views
likes
comments
shares
saves
view_growth_speed
engagement_rate
hashtags
caption
```

#### 达人历史基线

```text
creator_id
median_views_30_posts
median_engagement_rate
typical_posting_frequency
historical_viral_rate
```

#### 品类基线

```text
category
platform
follower_bucket
median_views
median_engagement_rate
viral_threshold
```

用途：

- 判断内容是否只是绝对播放高。
- 判断它是否相对本人或同类账号真的异常好。

### 5.4 后端判断逻辑

```text
1. 用户选择品类、平台、时间范围
2. 后台拉取该范围内相关帖子
3. 计算每条内容相对本人历史中位播放的倍数
4. 计算每条内容相对同品类同量级基线的倍数
5. 聚合到达人维度
6. 区分持续增长型和单条爆款型
7. 过滤长期不活跃、风险高、内容不相关账号
8. 按增长势能、品类相关性、稳定性、可联系性排序
```

### 5.5 爆款达人评分

```text
爆款达人推荐分 =
  近期爆发倍数 35%
+ 品类相关性 25%
+ 增长速度 20%
+ 稳定性 10%
+ 商业可用性 10%
```

### 5.6 达人类型标签

前端不要所有人都叫爆款达人，可以分成：

```text
持续增长
单条爆款
高互动小号
新晋潜力
稳定高表现
```

标签解释：

- 持续增长：近几条内容都高于本人基线。
- 单条爆款：主要由一条内容拉高。
- 高互动小号：粉丝不大，但 ER 明显高。
- 新晋潜力：近 30 天表现明显变好。
- 稳定高表现：不是突然爆，但长期表现优于同量级账号。

### 5.7 前端达人卡片

示例：

```text
@beauty_sora_lab
标签：持续增长
爆款信号：强

为什么推荐：
- 近 14 天有 2 条内容超过本人中位播放 3x
- 最新一条护肤测评播放 180K
- 当前播放仍在增长：日均 +8K
- 品类相关度：高

关键数据：
粉丝 268K
近 14 天最高播放 180K
本人中位播放 52K
ER 7.4%
邮箱已找到

风险提示：
- 爆款集中在测评内容
- 报价可能上升
```

### 5.8 详情页展示

```text
爆款分析

近 14 天表现：
- 2 条内容超过本人中位播放 3x
- 1 条内容超过同量级账号品类基线 2.4x
- 最新内容仍在增长

代表内容：
标题：Testing viral serum for 7 days
播放：180K
高于本人中位：3.4x
高于品类基线：2.1x

系统结论：
该达人近期在护肤测评内容上明显起量，适合需要追热点或做快速测试的项目。但爆款集中在测评内容，brief 应贴近测评形式。
```

### 5.9 MVP 实现路径

MVP 可以先做：

- 近 7 / 14 / 30 天帖子筛选。
- 计算相对本人中位播放倍数。
- 计算近 30 天爆款次数。
- 按品类关键词和 hashtag 判断相关性。
- 展示代表爆款内容。

后续增强：

- 加同品类同粉丝量级基线。
- 加播放增长速度。
- 加趋势图。
- 加平台热点趋势。
- 加爆款风险判断。

---

## 6. 三个入口共用的后端数据底座

### 6.1 核心表/对象

```text
creators
达人基础信息

posts
达人内容数据

post_metrics
帖子表现数据和时间序列

creator_metrics
达人聚合指标

content_labels
内容主题、形式、场景标签

brand_mentions
品牌提及和合作证据

scene_library
营销场景库

creator_scene_stats
达人在各场景下的表现

creator_embeddings
内容向量

project_creator_actions
项目内收藏、No、已建联、已合作状态

contact_info
邮箱、外链、验证状态
```

### 6.2 共用过滤逻辑

所有入口都应该默认过滤：

```text
当前项目已 No
高风险账号
长期不活跃账号
明显数据异常账号
重复账号
```

用户可选过滤：

```text
只看有邮箱
只看某个平台
只看某个粉丝量级
只看某个国家/语言
排除已收藏
排除已建联
```

### 6.3 共用卡片字段

所有结果卡至少需要：

```text
creator_id
handle
platform
avatar
followers
median_views
engagement_rate
estimated_price
email_status
recommendation_score
recommendation_reasons
risk_or_tradeoffs
primary_evidence
actions
```

---

## 7. 三个入口的接口建议

### 7.1 找同行投过的

```http
POST /api/discovery/competitor-creators
```

请求：

```json
{
  "project_id": "project_123",
  "platform": "tiktok",
  "brand_query": "CeraVe",
  "category": "skincare",
  "time_range_days": 90,
  "filters": {
    "has_email": false,
    "exclude_no": true,
    "active_recently": true
  }
}
```

返回：

```json
{
  "search_id": "search_001",
  "basis": {
    "platform": "TikTok",
    "category": "skincare",
    "time_range_days": 90,
    "posts_analyzed": 12430,
    "candidates_found": 286
  },
  "results": [
    {
      "creator_id": "creator_123",
      "handle": "@skincare_sam",
      "evidence_strength": "high",
      "score": 89,
      "reasons": [
        "近 60 天发布过 CeraVe 相关合作内容",
        "帖子含 #ad 和品牌 @cerave",
        "合作帖播放高于本人中位播放 1.8x"
      ],
      "evidence_post": {
        "url": "https://...",
        "brand": "CeraVe",
        "published_at": "2026-04-12",
        "views": 86000
      }
    }
  ]
}
```

### 7.2 按营销场景找

```http
POST /api/discovery/scenario-creators
```

请求第一步：生成场景

```json
{
  "project_id": "project_123",
  "product_url": "https://brand.com/product",
  "product_description": "敏感肌修复面霜",
  "platform": "tiktok"
}
```

返回第一步：

```json
{
  "product_summary": {
    "category": "skincare",
    "selling_points": ["修复", "舒缓", "敏感肌", "夜间使用"]
  },
  "recommended_scenes": [
    {
      "scene_id": "night-routine",
      "scene_name": "晚间护肤 routine",
      "reason": "产品卖点是修复和舒缓，适合展示连续使用和肤感变化",
      "creator_count": 342,
      "avg_engagement_rate": "6.8%",
      "recommended_format": "真人出镜 + 步骤教程"
    }
  ]
}
```

请求第二步：按场景找达人

```json
{
  "project_id": "project_123",
  "scene_ids": ["night-routine"],
  "platform": "tiktok",
  "filters": {
    "has_email": false,
    "exclude_no": true
  }
}
```

### 7.3 找爆款达人

```http
POST /api/discovery/trending-creators
```

请求：

```json
{
  "project_id": "project_123",
  "platform": "tiktok",
  "category": "skincare",
  "time_range_days": 14,
  "filters": {
    "has_email": false,
    "exclude_no": true,
    "active_recently": true
  }
}
```

返回：

```json
{
  "search_id": "search_003",
  "basis": {
    "platform": "TikTok",
    "category": "skincare",
    "time_range_days": 14,
    "posts_analyzed": 8230,
    "candidates_found": 194
  },
  "results": [
    {
      "creator_id": "creator_789",
      "handle": "@beauty_sora_lab",
      "trend_type": "持续增长",
      "score": 91,
      "reasons": [
        "近 14 天有 2 条内容超过本人中位播放 3x",
        "最新一条护肤测评播放 180K",
        "当前播放仍在增长：日均 +8K"
      ],
      "hero_post": {
        "url": "https://...",
        "views": 180000,
        "vs_creator_baseline": "3.4x",
        "vs_category_baseline": "2.1x"
      }
    }
  ]
}
```

---

## 8. 实现路径建议

### Phase 1：MVP

优先做：

1. 按营销场景找
   - 产品链接/描述输入
   - 固定场景库
   - AI 提取产品卖点
   - 达人场景标签匹配
   - 显示场景理由和达人理由

2. 轻量版找同行投过的
   - 支持品牌名输入
   - caption / hashtag / mention / link 识别
   - 证据帖展示
   - 证据强度高/中/低

3. 轻量版找爆款达人
   - 近 7/14/30 天内容
   - 相对本人中位播放倍数
   - 代表爆款内容展示

### Phase 2：增强可信度

加入：

- 品牌别名库
- 折扣码识别
- 封面 OCR
- 同品类基线
- 播放增长速度
- 达人场景表现统计
- 邮箱验证

### Phase 3：数据飞轮

加入：

- 实际合作报价
- 实际 CPM / CPE
- 历史 ROI
- 品类场景转化表现
- 团队级去重
- 自动 brief 生成
- 趋势预测

---

## 9. MVP 优先级建议

客观建议：

```text
第一优先级：按营销场景找
第二优先级：找同行投过的
第三优先级：找爆款达人
```

原因：

### 按营销场景找

最符合用户真实需求：

> 我知道我要卖什么，但不知道应该找什么达人、怎么拍。

它也最能体现 AI 价值。

### 找同行投过的

很有说服力，但依赖证据链。

如果证据链不扎实，容易误判，所以必须展示证据帖。

### 找爆款达人

价值高，但对实时数据和时间序列要求最高。

没有稳定数据前，可以先叫「近期高表现达人」，减少过度承诺。

---

## 10. 最终产品口径

对用户解释「找同行投过的」：

> Linkr 会分析同品类品牌在社媒内容中的提及、合作声明、品牌 @、折扣码和产品链接，找到可能合作过这些品牌的达人，并展示对应证据帖。

对用户解释「按营销场景找」：

> Linkr 会先理解你的产品卖点，推荐适合表达这个产品的内容场景，再找到擅长这些场景、数据表现稳定的达人。

对用户解释「找爆款达人」：

> Linkr 会分析你所在品类近期内容表现，找到播放和互动明显高于本人平时水平或同类账号水平的达人。

---

## 11. 一句话总结

```text
同行验证：别人投过，说明可能有效。
场景适配：这个产品适合这样拍，所以找擅长这样拍的人。
趋势捕捉：最近这个品类里谁正在起量。
```

后台要做的是拿数据证明这三件事。  
前端要做的是把证明过程讲给用户看。
