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
  // 投放维度的 tag（"重点投放" / "测试中" 等）— 给「单帖追踪」tab 顶部用
  placementTags: string[];
  // 近 7 天播放量采样点 —— 「单帖追踪」tab 的趋势小图用（借鉴 Web 投放监控）。
  viewsTrend7d: number[];
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
    viewsTrend7d: [21_400, 25_800, 29_100, 32_600, 34_900, 36_700, 38_200],
    overlay: "157cm / 5'2\" · 52kg / 115lbs · Korean",
    // 受众画像 / 粉丝真伪 一开始都锁住 —— 与「字幕」一样，要花积分才解锁。
    unlocked: ["track", "extract-video", "extract-audio"],
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
    viewsTrend7d: [980_000, 1_120_000, 1_240_000, 1_310_000, 1_360_000, 1_385_000, 1_400_000],
    overlay: "Halloween 2025 · Silent Hill Nurse",
    // 受众画像 / 粉丝真伪 锁住；字幕此前已解锁，留作「已解锁」对照。
    unlocked: ["track", "extract-video", "extract-audio", "subtitle"],
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

// 每个功能消耗多少积分 —— UI 标签 + 解锁 modal 都从这里读。
// "placement"（投放效果监控）需先填「投放追踪」卡片并扣费才解锁监控数据。
export const FEATURE_COST: Record<MockFeatureId, number> = {
  placement: 0.5,
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
// 演示 fixture：本月已用积分（让 banner 一进来就有数据感）。
export const INITIAL_TOKENS_USED = 0.3;
