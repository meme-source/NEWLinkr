// 假帖子数据 — 用来演示 PostSwitcher 切换帖子时 sidebar 联动刷新。
// 真产品里这些数据由浏览器扩展从当前打开的 TikTok 页面 DOM 抓取。

export type MockFeatureId =
  | "placement"
  | "track"
  | "audience"
  | "fake-fans"
  | "extract-video"
  | "extract-audio"
  | "subtitle"
  | "ai-breakdown";

export interface MockPost {
  id: string;
  handle: string;
  displayName: string;
  publishedAt: string; // YYYY-MM-DD
  caption: string;
  hashtags: string[];
  music: string;
  metrics: {
    plays: string;
    er: string;
    saves: string;
    comments: string;
    shares: string;
  };
  interactionCounts: {
    like: string;
    comment: string;
    bookmark: string;
    share: string;
  };
  // 投放维度的 tag（"重点投放" / "测试中" 等）— 给「投放效果监控」accordion 顶部用
  placementTags: string[];
  // 视频画面占位文字（叠在 VideoStage 中央偏下）
  overlay: string;
  // 哪些功能本帖已解锁 —— 切换帖子时 sidebar 重新读取
  unlocked: MockFeatureId[];
  // 受众分布（解锁后才显示真数据；未解锁前 paywall）
  audience: {
    gender: { male: number; female: number };
    age: { range: string; pct: number }[];
    regions: { flag: string; label: string; pct: number }[];
  };
  // 假粉检测
  fakeFans: { real: number; fake: number; influencer: number };
}

export const MOCK_POSTS: MockPost[] = [
  {
    id: "career_noloss",
    handle: "@career_noloss",
    displayName: "career_noloss",
    publishedAt: "2025-09-17",
    caption: "📍 5 个 AI 投资技巧，让你不靠运气也能稳定收益",
    hashtags: ["#AI投资", "#理财入门"],
    music: "原声 · career_noloss",
    metrics: {
      plays: "38.2K",
      er: "6.4%",
      saves: "6,891",
      comments: "412",
      shares: "1,204",
    },
    interactionCounts: {
      like: "38.2K",
      comment: "412",
      bookmark: "6,891",
      share: "1,204",
    },
    placementTags: ["重点投放", "Q2 测试"],
    overlay: "157cm / 5'2\" · 52kg / 115lbs · Korean",
    unlocked: ["track", "audience", "fake-fans", "extract-video", "extract-audio"],
    audience: {
      gender: { male: 52, female: 48 },
      age: [
        { range: "18-24", pct: 39 },
        { range: "25-34", pct: 34 },
        { range: "35-44", pct: 22 },
        { range: "45+", pct: 5 },
      ],
      regions: [
        { flag: "🇺🇸", label: "美国", pct: 32 },
        { flag: "🇬🇧", label: "英国", pct: 18 },
        { flag: "🇨🇦", label: "加拿大", pct: 12 },
      ],
    },
    fakeFans: { real: 35, fake: 61, influencer: 4 },
  },
  {
    id: "nataliireynoldss",
    handle: "@nataliireynoldss",
    displayName: "Natalie Reynolds",
    publishedAt: "2025-10-30",
    caption: "IG: NatalieReynolds silent hill nurse pyramid head costume",
    hashtags: ["#nataliereynolds", "#halloween", "#silenthill"],
    music: "Ramalama (Bang Bang) · Róisín Murphy",
    metrics: {
      plays: "1.4M",
      er: "4.2%",
      saves: "1.2M",
      comments: "101K",
      shares: "84K",
    },
    interactionCounts: {
      like: "26.5M",
      comment: "101K",
      bookmark: "1.2M",
      share: "84K",
    },
    placementTags: ["万圣节合作", "已结案"],
    overlay: "Halloween 2025 · Silent Hill Nurse",
    unlocked: ["track", "audience", "extract-video", "extract-audio", "subtitle"],
    audience: {
      gender: { male: 28, female: 72 },
      age: [
        { range: "18-24", pct: 48 },
        { range: "25-34", pct: 36 },
        { range: "35-44", pct: 12 },
        { range: "45+", pct: 4 },
      ],
      regions: [
        { flag: "🇺🇸", label: "美国", pct: 41 },
        { flag: "🇬🇧", label: "英国", pct: 14 },
        { flag: "🇦🇺", label: "澳大利亚", pct: 9 },
      ],
    },
    fakeFans: { real: 78, fake: 19, influencer: 3 },
  },
];

// 每个功能消耗多少次 token —— UI 标签 + 解锁 modal 都从这里读。
// "placement" 是免费的 — 是已有投放数据的汇总展示 + 后台跳转，没新增 AI 调用。
export const FEATURE_COST: Record<MockFeatureId, number> = {
  placement: 0,
  track: 0,
  "extract-video": 0,
  "extract-audio": 0,
  audience: 0.5,
  "fake-fans": 0.5,
  subtitle: 0.3,
  "ai-breakdown": 0.5,
};

export const FEATURE_LABEL: Record<MockFeatureId, string> = {
  placement: "投放效果监控",
  track: "帖子表现",
  audience: "受众画像",
  "fake-fans": "粉丝真伪",
  "extract-video": "存视频",
  "extract-audio": "存原声",
  subtitle: "字幕",
  "ai-breakdown": "AI 拆解",
};

export const TOTAL_TOKENS_PER_MONTH = 10;
// 跟 INITIAL_HISTORY 的 cost 总和保持一致（0.5+0.5+0.5+0.3=1.8），让 banner
// 上显示的"已用 1.8"和「历史记录」tab 的条目能互相印证。
export const INITIAL_TOKENS_USED = 1.8;

// ─── 解锁历史 ─────────────────────────────────────────────────────────
//
// 用户在本月每次点确认解锁就 push 一条。跨帖切走不丢，让用户能从「历史记录」
// tab 看到自己的钱花在哪里 + 一键回到那帖看数据。

export interface UnlockHistoryEntry {
  id: string;
  postId: string;
  postHandle: string;
  postCaption: string;
  featureId: MockFeatureId;
  cost: number;
  /** ISO timestamp — 用来分组（今天 / 昨天 / N 天前）。 */
  unlockedAt: string;
}

// 演示 fixture：今天 + 昨天各 2 条，让用户进 mock 就能看到"已经有历史"。
// 注意：postId × featureId 必须跟 MOCK_POSTS.unlocked 字段对齐（否则视觉
// 矛盾 — 历史里说"解锁过 X"但 X 在 post.unlocked 里又不在）。
export const INITIAL_HISTORY: UnlockHistoryEntry[] = [
  {
    id: "hist-4",
    postId: "career_noloss",
    postHandle: "@career_noloss",
    postCaption: "📍 5 个 AI 投资技巧，让你不靠运气也能稳定收益",
    featureId: "audience",
    cost: 0.5,
    unlockedAt: "2026-05-15T14:00:00",
  },
  {
    id: "hist-3",
    postId: "career_noloss",
    postHandle: "@career_noloss",
    postCaption: "📍 5 个 AI 投资技巧，让你不靠运气也能稳定收益",
    featureId: "fake-fans",
    cost: 0.5,
    unlockedAt: "2026-05-15T14:05:00",
  },
  {
    id: "hist-2",
    postId: "nataliireynoldss",
    postHandle: "@nataliireynoldss",
    postCaption: "IG: NatalieReynolds silent hill nurse pyramid head costume",
    featureId: "audience",
    cost: 0.5,
    unlockedAt: "2026-05-14T20:15:00",
  },
  {
    id: "hist-1",
    postId: "nataliireynoldss",
    postHandle: "@nataliireynoldss",
    postCaption: "IG: NatalieReynolds silent hill nurse pyramid head costume",
    featureId: "subtitle",
    cost: 0.3,
    unlockedAt: "2026-05-14T20:18:00",
  },
];
