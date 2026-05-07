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
  templateKey?: "intro" | "followup" | "gifted" | "custom";
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
