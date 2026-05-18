// 前后端共享的"数据合同"
// 任何 API 的请求 / 返回结构都写在这里。前端按这个写 UI，后端按这个返回数据。

// ===== 通用 =====
export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export type Platform = "tiktok" | "instagram" | "youtube";

// ===== 达人 — 评级 / 来源 / 协作 =====
//
// `Rating` 是用户给博主的"主观偏好"评级，3 档：1=普通 / 2=良好 / 3=优秀。
// 用户在博主库中通过 3 颗星手动设置，跨项目共享。
export type Rating = 1 | 2 | 3;

// `CollaborationStatus` 是博主在"某个项目"下的状态，存在于 collaborations[] 中。
//
// 7 个核心状态贯穿博主库 / 建联看板 / 项目抽屉等所有出现"博主状态"的界面，
// label 由 lib/creator.ts 集中定义；不要在子组件里再起别名（"已建联""建联成功"
// "已暂停"都是已废弃的旧叫法）。
//
// 'paused'（暂停中）替代了早期的 'excluded'：直接排除的博主可以删除，没有
// 持久化在库里的价值；只有"暂时不推进、之后可能恢复"的状态才需要单独标记。
export type CollaborationStatus =
  | "pending"
  | "queued"
  | "sent"
  | "collaborating"
  | "completed"
  | "paused"
  | "rejected";

export type CreatorSource = "plugin" | "search" | "manual" | "referral";

// 受控的博主类型分类。`category` 是结构化的"主类"，一个博主只属于一个；
// 同时博主有 `topics[]`（系统对内容的话题分析）和 `userTags[]`（用户自由打标），
// 这两组是不同概念，不要混用。
export type CreatorCategory =
  | "beauty"
  | "skincare"
  | "fashion"
  | "food"
  | "travel"
  | "vlog"
  | "fitness"
  | "parenting"
  | "tech"
  | "home"
  | "review"
  | "education"
  | "comedy"
  | "other";

// 合作方式：博主抽屉「项目合作」tab 的合作卡片字段。三档常见取值，
// 自由文本兜底为空字符串。
export type CollaborationMethod = "paid" | "gifted" | "commission" | "barter" | "other";

export type Collaboration = {
  id: string;
  projectId: string;
  status: CollaborationStatus;
  joinedAt: string;
  lastContactAt: string | null;
  trackedContentIds: string[];
  // 合作方式（付费 / 寄样 / 分佣 / 互换 / 其他）。null = 尚未确定。
  method: CollaborationMethod | null;
  // 项目侧准备的预算（USD），与 finalPrice 区分：预算是"打算花多少"。
  budget: number | null;
  // 谈判后实际敲定的价格（USD）。null = 尚未敲定。原 `cost` 字段于 2026-05-07 重命名。
  finalPrice: number | null;
  notes: string;
};

// 博主联系方式与社交链接（结构化，便于详情页渲染）
export type CreatorEmail = {
  address: string;
  verified: boolean;
  primary: boolean;
};

export type CreatorDM = {
  platform: Platform;
  handle: string;
};

export type CreatorSocialLink = {
  platform: Platform | "twitter" | "website";
  url: string;
};

export type CreatorRateCard = {
  postPrice: number | null;
  videoPrice: number | null;
  storyPrice: number | null;
  currency: "USD" | "EUR" | "CNY" | "GBP";
};

export type CreatorManager = {
  name: string;
  email: string | null;
  agency: string | null;
};

// 博主近期发布的内容快照。抽屉「内容数据」tab 渲染用，
// 同时提供"中位数 / 平均"两种聚合方式（在 UI 端计算，
// 这里只持有原始观测）。
export type CreatorRecentPost = {
  id: string;
  postedAt: string; // ISO date
  url: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  // 该条内容里出现的话题标签（小写，含 #）。例：["#entertainment", "#lifestyle"]
  hashtags: string[];
  // 该条内容里出现的品牌提及。例：["BOSS", "UNICEF"]
  brandMentions: string[];
};

// 受众层级（参考 EasyKOL 的 T1/T2/T3 分布）：发达 / 发展中 / 欠发达。
export type RegionTier = "T1" | "T2" | "T3";

export type AudienceRegion = {
  // ISO 3166-1 alpha-2，渲染时由 UI 拼国旗。
  code: string;
  name: string;
  tier: RegionTier;
  // 占比 0-1。
  share: number;
};

export type AudienceAgeBucket = {
  range: "13-17" | "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+";
  female: number; // 0-1
  male: number; // 0-1
};

export type AudienceInterest = {
  name: string;
  description: string;
  share: number; // 0-1
};

// 5 星制 + "优秀 / 良好 / 一般" 文字标签。
export type AudienceCredibility = {
  // 真实粉丝率 / 产品兴趣率 / 正向评价率，0-1。
  authenticFans: number;
  productInterest: number;
  positiveSentiment: number;
  // 购买影响力子项，0-5（支持 4.5 等半星，因此用 number 而非整数）。
  trustScore: number;
  professionalismScore: number;
  affinityScore: number;
  // 每个维度针对该博主的 1 句话总结（可选；后端可下发，mock 端按博主 id 选词）。
  summaries?: {
    authenticFans?: string;
    productInterest?: string;
    positiveSentiment?: string;
    trustScore?: string;
    professionalismScore?: string;
    affinityScore?: string;
  };
};

export type AudienceProfile = {
  // 数据采样范围（用于卡片左上"本次分析数据范围"区块）。
  sample: {
    videosAnalyzed: number;
    commentersCollected: number;
    followersCollected: number;
    totalUsers: number;
  };
  // 性别分布（0-1）。
  gender: { female: number; male: number };
  // 7 个年龄段（13-17 ... 65+），各档下分性别。
  ageBuckets: AudienceAgeBucket[];
  // 17+ 占比汇总（截图右上角的"大于 17 年龄"）。
  age17PlusShare: number;
  // 受众地区分布。
  regions: AudienceRegion[];
  // 受众兴趣（截图最后一张："喜剧 / 游戏 / 体育 ..."）。
  interests: AudienceInterest[];
  // 影响力（左侧三条进度条 + 右侧三档星级）。
  credibility: AudienceCredibility;
};

// ===== 达人 =====
//
// Creator 是博主在系统中的"长期实体"。`projectId` / `status` 不再属于 Creator，
// 它们属于具体项目下的合作（见 collaborations[]）。同一个博主可以同时存在于
// 多个项目中。
export type Creator = {
  id: string;
  handle: string;
  name: string;
  platform: Platform;
  avatar: string | null;
  region: string;

  // 平台数据
  followers: number;
  medianViews: number;
  engagementRate: number;
  estimatedPrice: string | null;
  emailStatus: "found" | "verified" | "missing";
  recentActiveAt: string | null;

  // 评级 / 来源 / 分类 / 标签
  rating: Rating;
  source: CreatorSource;
  // 受控博主类型，用于卡片首屏显示与筛选
  category: CreatorCategory;
  // 系统对博主内容的话题词分析（只读）。例：["护肤教程", "夏日防晒"]
  topics: string[];
  // 用户自定义标签（可编辑）。例：["重点跟进", "S 级"]
  userTags: string[];

  // 时间线（最近一次关键事件，方便列表排序与"建议下一步"）
  lastContactAt: string | null;
  lastResponseAt: string | null;
  lastEmailOpenedAt: string | null;
  nextFollowUp: string | null;
  addedAt: string;

  // 联系方式
  emails: CreatorEmail[];
  dms: CreatorDM[];
  socialLinks: CreatorSocialLink[];
  // 用户在抽屉里手动填写的对接姓名 / 备用联系。全局唯一，不按项目分。
  manualContactName: string | null;

  // 商务（详情页"资料" tab）
  rateCard: CreatorRateCard | null;
  paymentTerms: string | null;
  usageRights: string | null;
  manager: CreatorManager | null;

  // 多项目合作
  collaborations: Collaboration[];

  // 抽屉 → 内容数据 tab。最近 N 条发布快照（mock 阶段固定 10 条）。
  recentPosts: CreatorRecentPost[];

  // 抽屉 → 受众数据 tab。null 表示尚未做"深度受众分析"——UI 锁定显示遮罩。
  // 解锁后展示完整 AudienceProfile。
  audienceAnalysis: AudienceProfile | null;

  // 收藏标记。来自抽屉 header 的星标按钮。
  favorited: boolean;

  // 整张博主信息卡的"最后同步时间"。null = 尚未抓取。Stage 1+ 后台
  // 同步成功后回填。
  lastRefreshedAt: string | null;
};

// ===== 项目 =====
// API-layer Project (thin, what /api/projects will eventually return).
//
// NOTE: The UI currently uses `WorkspaceProject` from
// `features/project/components/project-context.tsx`, which is a richer
// shape (budget, brand, dates, currency) persisted in localStorage.
// When the real API ships in Phase 1, reconcile these two — likely by
// expanding `Project` to match `WorkspaceProject` and importing it here.
// Do not silently rename `WorkspaceProject` to `Project` until both
// match field-for-field.
export type Project = {
  id: string;
  name: string;
  productUrl: string | null;
  category: string;
  platform: Platform;
  createdAt: string;
};

// ===== 博主发现 v3 — 类型契约 =====
//
// 文档：博主发现页实现逻辑.md §B.2（v3 核心类型）。字段名沿用文档定义
// 的 snake_case，以保持与 SSE 事件、内部 service 契约一致；下游 React
// 组件再按需映射成自己内部的 camelCase 视图模型（features/discovery/types.ts）。
//
// 三个维度共享同一份"特征聚合 + 特征匹配"骨架：
//   1. 三维 service（competitor/scenario/trending）各自先筛 seed_creators
//   2. 调 aggregateFeatures(seeds) → FeatureGroup[]（系统内部表示，不外露种子 ID）
//   3. 对每个 FeatureGroup 调 matchByFeatureGroup() → OutputCreator[]
//   4. 拼装 DiscoveryServiceResult；route 层在序列化时剥掉 seeds.creator_ids
//
// 约束（§B.3）：
//   - 种子 ID 不进 API 响应；只在 service 之间传
//   - 特征匹配必须基于 aggregateFeatures() 的输出，不在 SQL 里 ad-hoc 拼条件
//   - 可建联性硬过滤在 SQL WHERE 子句里做，不能放进应用层后再过滤
//   - 推荐理由生成不提及具体种子 handle

export type DiscoveryIntent = "competitor_creators" | "scenario_creators" | "trending_creators";

export type FeatureAxis = "content_themes" | "audience" | "metrics_band" | "content_format";

export type AudienceAgeSkew = "15-24" | "25-34" | "35+";
export type AudienceGenderSkew = "female_dominant" | "male_dominant" | "balanced";
export type DurationBand = "short" | "mid" | "long";

// 一组"特征组"的画像。group_name 是给用户看的标题，例如"夜间敏感肌教程组合"；
// 其余字段是系统聚合出来的特征值，前端用来生成组内特征清单与匹配徽章。
export type FeatureGroup = {
  group_id: string;
  group_name: string;
  content_features?: {
    themes: string[];
    keywords: string[];
  };
  audience_features?: {
    age_skew: AudienceAgeSkew;
    gender_skew: AudienceGenderSkew;
    country_top: string[];
  };
  metrics_features?: {
    views_band: [number, number];
    er_band: [number, number];
  };
  format_features?: {
    duration_band: DurationBand;
    style_tags: string[];
  };
  // 该组覆盖了多少种子。维度二（场景）没有种子，用历史样本数填。
  seed_coverage: number;
  // 详情页"参考依据"用的脱敏摘要，绝不含具体 handle。
  rationale: string;
};

// 卡片首屏的四个特征轴是否命中。Service 层产生；前端按 ✓/× 渲染。
export type MatchedFeatures = {
  theme: boolean;
  audience: boolean;
  metrics: boolean;
  format: boolean;
};

// 输出层达人：v3 卡片渲染所需的最小字段集合（snake_case，与 SSE 事件对齐）。
// 详情页需要的更深字段（rate_card / audience profile）走单独接口拉取。
export type OutputCreator = {
  creator_id: string;
  handle: string;
  avatar_url: string | null;
  followers: number;
  median_views: number;
  engagement_rate: number;
  email_status: "found" | "verified" | "missing";
  feature_match_score: number;
  matched_features: MatchedFeatures;
  reasons: string[];
  risks: string[];
};

// 搜索基础摘要 —— /api/discovery/chat 的 `basis` SSE 事件 payload。
// `seed_creator_ids` 仅在内部 service 间传，序列化时由 route 剥掉。
export type DiscoveryBasis = {
  intent: DiscoveryIntent;
  platform: Platform;
  country: string;
  product_url: string | null;
  seed_count: number;
  // 给用户看的脱敏描述，例如"依据 12 位经过验证的达人画像"
  seed_basis_description: string;
  total_output: number;
};

// MVP 阶段未建好分类数据时，service 返回 status="building" 让前端给出友好提示，
// 而不是抛错。`dataset_status="ready"` 表示数据可信。
export type DiscoveryDatasetStatus = "ready" | "building";

// Service 之间的种子达人（内部表示）。**绝不**作为 API 响应字段输出。
export type SeedCreator = {
  creator_id: string;
  // 维度一专用：命中的品牌 ID 列表（来源 brand_mentions）
  evidence_brands?: string[];
  // 维度一专用：最强证据强度（high/medium/weak）
  strongest_evidence?: "high" | "medium" | "weak";
  // 维度一/三专用：合作或爆款贴 vs 本人中位数的倍数
  performance_ratio?: number;
  // 维度二专用：命中的场景 ID
  scene_id?: string;
  // 维度三专用：触发爆款判定的贴 ID
  viral_post_id?: string;
};

// 一次 service 调用的完整结果。route 层序列化时剥掉 seeds.creator_ids。
export type DiscoveryServiceResult = {
  search_id: string;
  dataset_status: DiscoveryDatasetStatus;
  basis: DiscoveryBasis;
  // 内部字段：种子 creator_id 不进 API 响应（§B.3 #1）
  seeds: {
    creator_ids: string[];
    selection_reason: string;
  };
  feature_groups: FeatureGroup[];
  // 每个 group 下的达人列表（按 feature_match_score 降序）
  creators_by_group: Record<string, OutputCreator[]>;
  output: { total: number };
  // 数据未建成时填给前端展示的话术（dataset_status="building" 时非空）
  message: string | null;
};

// ===== 博主发现 v3 — service 输入 =====

export type DiscoveryChips = {
  platform: Platform;
  country: string;
  follower_bucket: "nano" | "micro" | "mid" | "macro" | "mega" | "any";
  views_bucket: "lt_10k" | "10k_100k" | "100k_500k" | "gte_500k" | "any";
  // §4.4：默认 true（仅可建联）。false 才放出无邮箱/已被 No 的达人。
  contactable_only: boolean;
};

export type CompetitorSeedInput = {
  project_id: string;
  category: string;
  chips: DiscoveryChips;
};

export type ScenarioSeedInput = {
  project_id: string;
  category: string;
  product_summary: {
    category: string;
    selling_points: string[];
  } | null;
  chips: DiscoveryChips;
};

export type TrendingSeedInput = {
  project_id: string;
  category: string;
  // 默认 14；后续可扩展到 7/30
  time_range_days: 7 | 14 | 30;
  chips: DiscoveryChips;
};

// ===== 博主发现 v3 — /api/discovery/chat 请求 =====
// SSE 流式接口的输入。响应通过 SSE 事件返回（见 §8.2），不走 ApiResponse 信封。
export type DiscoveryChatRequest = {
  project_id: string;
  session_id: string;
  round: number;
  message: {
    intent_hint: DiscoveryIntent;
    text: string;
    chips: DiscoveryChips;
  };
  // Round ≥ 2 的追问要回填上一次的 result_id，service 据此复用上一轮结果集
  previous_result_id: string | null;
};

// ===== 博主发现 - 找同行投过的 =====
export type CompetitorDiscoveryRequest = {
  projectId: string;
  platform: Platform;
  brandQuery: string;
  category: string;
  timeRangeDays: number;
};

export type CompetitorCreatorResult = {
  creator: Creator;
  evidenceStrength: "high" | "medium" | "low";
  score: number;
  reasons: string[];
  evidencePost: {
    url: string;
    brand: string;
    publishedAt: string;
    views: number;
  };
};

// ===== 博主发现 - 按营销场景找 =====
// /api/discovery/scenario uses an `action` discriminator to multiplex two flows.
export type ScenarioParseRequest = {
  action: "parse";
  projectId: string;
  productUrl?: string;
  productDescription?: string;
  platform: Platform;
};

export type ScenarioMatchRequest = {
  action: "match";
  projectId: string;
  platform: Platform;
  sceneIds: string[];
};

export type ScenarioRequest = ScenarioParseRequest | ScenarioMatchRequest;

export type Scene = {
  id: string;
  name: string;
  reason: string;
  creatorCount: number;
  avgEngagementRate: string;
  recommendedFormat: string;
};

export type ScenarioParseResponse = {
  productSummary: {
    category: string;
    sellingPoints: string[];
  };
  recommendedScenes: Scene[];
};

export type ScenarioCreatorResult = {
  creator: Creator;
  matchScore: number;
  reasons: string[];
  recommendedShootingStyle: string;
};

// ===== 博主发现 - 找爆款达人 =====
export type TrendingDiscoveryRequest = {
  projectId: string;
  platform: Platform;
  category: string;
  timeRangeDays: 7 | 14 | 30;
};

export type TrendingCreatorResult = {
  creator: Creator;
  trendType: "持续增长" | "单条爆款" | "高互动小号" | "新晋潜力" | "稳定高表现";
  score: number;
  reasons: string[];
  heroPost: {
    url: string;
    views: number;
    vsCreatorBaseline: string;
    vsCategoryBaseline: string;
  };
};

// ===== 项目管理 =====
export type CreateProjectInput = {
  name: string;
  productUrl?: string;
  category: string;
  platform: Platform;
};

// ===== 建联 (outreach) =====
export type OutreachPersonalizedSegment = {
  text: string;
  personalized?: boolean;
};

export type OutreachSendMessage = {
  creatorId: string;
  subject: string;
  content: string;
  subjectSegments?: OutreachPersonalizedSegment[];
  contentSegments?: OutreachPersonalizedSegment[];
  personalizedSegmentCount?: number;
};

export type OutreachSendRequest = {
  projectId?: string;
  templateKey?: string;
  senderAddress?: string;
  mode?: "now" | "scheduled";
  scheduledAt?: string;
  attachmentCount?: number;
  creatorId?: string;
  subject?: string;
  content?: string;
  messages?: OutreachSendMessage[];
};

// ===== 博主库 (library) =====
//
// 这两条 service 输入未必直接对应 HTTP route（短期内是 client→service 调用）；
// 但保留 zod schema 入口，未来上线 /api/library 时不需要改 UI。
export type LibraryListRequest = {
  scope: "project" | "all";
  projectId?: string;
};

export type UpdateCollaborationStatusRequest = {
  creatorId: string;
  projectId: string;
  status: CollaborationStatus;
};

// ===== 搜索依据（结果页顶部展示） =====
export type SearchBasis = {
  platform: string;
  category: string;
  timeRangeDays: number;
  postsAnalyzed: number;
  candidatesFound: number;
};

// ===== 找相似 / 找平替（CreatorSearch.find） =====
//
// 设计来源：docs/找相似与找平替实现逻辑.md（v7）。Phase 0 的实现走启发式 +
// mock 候选池（features/creator/data），AI / Apify / 视觉 ML 留为 interface
// 由后续阶段注入。
//
// `mode` 决定服务侧用哪套打分公式与 chip 派生策略：
//   - "comprehensive" 走 §4.2 的 5 维公式
//   - "budget"        在 comprehensive 之上叠加 §5 的成本维度（Phase 1 之后实现）
//   - "seed"          找种子达人（独立 spec，预留入口）
export type SimilarSearchMode = "comprehensive" | "budget" | "seed";

// 4 套权重模板由种子达人的主分类自动选定（§4.2.1）。
export type WeightTemplateId = "A" | "B" | "C" | "D";

// 5 维：与 docs §4.2 一一对应。
export type SimilarAxisKey = "topic" | "format" | "visual" | "data" | "activity";

export type SimilarFilters = {
  hasEmail?: boolean;
  excludeRejected?: boolean;
  excludeSaved?: boolean;
  activeRecently?: boolean;
  language?: string | null;
  country?: string | null;
  minFollowers?: number;
  minMedianViews?: number;
};

export type FindSimilarRequest = {
  projectId?: string | null;
  platform: Platform;
  seedHandle?: string;
  seedCreatorId?: string;
  mode: SimilarSearchMode;
  postSampleSize: 5 | 10 | 15;
  coverSampleSize: 3 | 5;
  minSimilarityForAlt?: number;
  limit?: number;
  filters?: SimilarFilters;
};

export type SimilarRadarAxis = {
  key: SimilarAxisKey;
  label: string;
  internal: number;
  display: number;
};

export type SimilarRadar = {
  axes: SimilarRadarAxis[];
  baseline: number;
};

export type SimilarSubscoreDetail = {
  score: number;
  components: Record<string, number>;
  evidence: string[];
};

export type SimilarKeyMetrics = {
  estimatedPrice: string | null;
  engagementRatePct: number | null;
  medianLikes: number | null;
  medianComments: number | null;
};

export type SimilarChipCategory = "alt" | "topic" | "format" | "visual";

export type SimilarCoreChip = {
  label: string;
  category: SimilarChipCategory;
};

export type SimilarContactBadge = {
  status: "verified" | "found" | "missing";
  label: string;
  email: string | null;
  externalLinks: string[];
};

// 找平替专属字段（mode = "budget" 时填充，否则 null）。
export type SimilarAlternativeExtras = {
  similarityScoreInternal: number;
  similarityScoreDisplay: number;
  estimatedSavingPct: number | null;
  estimatedCpm: string | null;
  estimatedCpe: string | null;
  keyMetricsOverride: {
    estimatedPrice: string | null;
    savingPctLabel: string | null;
    estimatedCpm: string | null;
    estimatedCpe: string | null;
  };
};

export type SimilarCreatorResult = {
  creatorId: string;
  handle: string;
  platform: Platform;
  avatarUrl: string | null;
  country: string;
  countryEmoji: string;
  language: string | null;
  projectTags: string[];

  internalScore: number;
  displayScore: number;

  radar: SimilarRadar;

  keyMetrics: SimilarKeyMetrics;
  coreChips: SimilarCoreChip[];

  contactBadge: SimilarContactBadge;
  alternativeExtras: SimilarAlternativeExtras | null;

  subscoresDetail: Record<SimilarAxisKey, SimilarSubscoreDetail>;

  narrative: string;
  tradeoffs: string[];
};

export type FindSimilarSeedSnapshot = {
  creatorId: string;
  handle: string;
  country: string;
  primaryCategory: string;
  weightTemplate: WeightTemplateId;
  estimatedPrice: string | null;
  medianViews: number;
  engagementRate: number;
  estimatedCpm: string | null;
};

export type FindSimilarResponse = {
  searchId: string;
  mode: SimilarSearchMode;
  seed: FindSimilarSeedSnapshot;
  sampleUsed: {
    posts: number;
    covers: number;
  };
  visualStatus: "ready" | "pending" | "skipped";
  displayScale: {
    internalMax: number;
    displayMax: number;
    decimals: number;
  };
  results: SimilarCreatorResult[];
  filteredOutCount: number;
};
