// §3.3 Mock data for the "投放表现" board view.
// One record = one piece of placed content (a TikTok video) produced by a
// creator for the project. CPE / CPM are derived in the component from
// spendUsd ÷ engagement / spendUsd ÷ views * 1000 so the source of truth
// stays the raw measurement.
//
// 2026-05 update: 当前产品仅支持 TikTok 平台，所有 mock 投放统一为 TikTok。
// 平台字段保留是为后续扩展（IG / RED）留位，但当前 UI 不再做平台对比。
// 新增字段：creatorCategory（投放达人的类别）/ creatorFollowers（达人粉丝量），
// 用于"类别分布 + 量级统计"两个新卡片。
//
// 2026-05-07 update: 投放卡片改版 —— Placement 现在持有展示卡片与博主抽屉
// "投放数据" 段落所需的全部字段，逻辑上：抽屉里没有的数据，前端卡片也无法
// 渲染。卡片渲染顺序（avatar → handle → 平台 → 状态 → 趋势图 → 互动 / 费用
// 效率 → 原帖跳转）逐一映射到本文件的字段。
//
// 状态枚举与原"投放中 / 已完成 / 异常"已不同：现以 7 / 30 天播放量趋势作为
// 状态信号，状态可由用户直接在卡片上下拉调整（OutreachStateContext 维护
// override）。

import type { CreatorCategory } from "@/types/api";

export type PlacementPlatform = "TikTok" | "Instagram" | "Xiaohongshu";

// 状态语义按"播放量趋势"自动识别，**不可由用户手动修改**：
//   增长中：近 7 天播放量呈正向曲线
//   稳定中：曲线趋平
//   下降中：曲线进入下行
// "已暂停"曾在该枚举里，2026-05-07 移出 —— 暂停是用户主动行为而非自动识别，
// 现以 OutreachStateContext.isPlacementPaused 单独追踪，并在卡片头部以"已暂停"
// 徽章覆盖显示。删除同理：通过 setPlacementDeleted 软删除，不会改 mock 源。
export type PlacementStatus = "增长中" | "稳定中" | "下降中";

// §3.3 投放卡片的「合作生命周期」—— 与上面的自动识别 status（趋势）正交：
//   candidate     候选：从社媒提取链接、仅观察、尚未决定合作
//   collaborating 合作中：已确认与达人合作并录入合作信息
//   completed     已完成：合作结束（用户在卡片 ⋯ 菜单手动标记）
// 投放卡片不再局限于「合作中」——候选卡片同样进网格，只是徽章不同。
export type PlacementCollabPhase = "candidate" | "collaborating" | "completed";

export interface Placement {
  id: string;
  projectId: string;
  // 博主基本信息（与博主抽屉同源）
  creatorHandle: string;
  creatorName: string;
  creatorAvatarUrl: string;
  // 当前 mock 全部为 TikTok。字段保留以便未来扩展，但 UI 不再做对比。
  platform: PlacementPlatform;
  // 达人主类（与 types/api.ts 中的 CreatorCategory 对齐）。
  creatorCategory: CreatorCategory;
  // 达人粉丝量，用于"量级统计"分桶（仍在统计区使用）。
  creatorFollowers: number;
  // 博主主页链接（卡片头像 / handle 的"原帖"按钮可指回博主主页）。
  creatorProfileUrl: string;

  // 投放本身
  postedAt: string;
  status: PlacementStatus;
  // 合作生命周期阶段（候选 / 合作中 / 已完成）。
  collabPhase: PlacementCollabPhase;
  spendUsd: number;
  // 原帖（投放视频）链接，"原帖" 按钮跳转用。
  postUrl: string;

  // 追踪 / 合作信息（「投放追踪」弹窗录入）：
  //   trackingPeriodDays 追踪周期（天），候选 / 合作均可设。
  //   publishAt          约定发布时间（仅合作时有意义）。
  //   trackingEndsAt     追踪截止日期（候选 = 周期推算；合作 = 用户填）。
  trackingPeriodDays?: number;
  publishAt?: string;
  trackingEndsAt?: string;

  // 实测数据
  views: number;
  // 互动率 (%)，预先计算以避免 UI 端做除法。
  er: number;
  likes: number;
  comments: number;
  shares: number;
  favorites: number;

  // 播放量趋势：7 天 = 7 个采样点，30 天 = 30 个采样点。
  // 卡片头部以 7 / 30 天切换显示。
  viewsTrend7d: number[];
  viewsTrend30d: number[];
}

// 工厂：把 7 天采样向 30 天扩展，避免重复填写大段数字。
function expand30(seed: number[], targetEnd: number): number[] {
  const start = seed[0];
  const out: number[] = [];
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    out.push(Math.round(start + (targetEnd - start) * t + Math.sin(i * 0.7) * targetEnd * 0.01));
  }
  return out;
}

// 现存 mock 投放都是「已确认合作」的内容，统一种子里省略 collabPhase，
// 在导出时补成 "collaborating"，避免在 12 条字面量里逐条重复。
const PLACEMENT_SEED: Omit<Placement, "collabPhase">[] = [
  {
    id: "p-skincare-sam-01",
    projectId: "q2-summer",
    creatorHandle: "@skincare_sam",
    creatorName: "Skincare Sam",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=skincare_sam&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "skincare",
    creatorFollowers: 320_000,
    creatorProfileUrl: "https://www.tiktok.com/@skincare_sam",
    postedAt: "04-28",
    status: "增长中",
    spendUsd: 480,
    postUrl: "https://www.tiktok.com/@skincare_sam/video/1001",
    views: 612_000,
    er: 7.5,
    likes: 41_200,
    comments: 1_820,
    shares: 3_640,
    favorites: 5_400,
    viewsTrend7d: [420_000, 460_000, 495_000, 530_000, 560_000, 590_000, 612_000],
    viewsTrend30d: expand30([420_000], 612_000),
  },
  {
    id: "p-glow-girl-01",
    projectId: "q2-summer",
    creatorHandle: "@glow_girl",
    creatorName: "Glow Girl",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=glow_girl&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "skincare",
    creatorFollowers: 180_000,
    creatorProfileUrl: "https://www.tiktok.com/@glow_girl",
    postedAt: "05-01",
    status: "增长中",
    spendUsd: 320,
    postUrl: "https://www.tiktok.com/@glow_girl/video/1002",
    views: 188_000,
    er: 8.9,
    likes: 14_800,
    comments: 690,
    shares: 1_240,
    favorites: 2_100,
    viewsTrend7d: [110_000, 130_000, 150_000, 165_000, 175_000, 182_000, 188_000],
    viewsTrend30d: expand30([110_000], 188_000),
  },
  {
    id: "p-style-nina-01",
    projectId: "q2-summer",
    creatorHandle: "@style_nina_official",
    creatorName: "Style Nina",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=style_nina_official&backgroundColor=fdf0e8",
    platform: "Instagram",
    creatorCategory: "fashion",
    creatorFollowers: 230_000,
    creatorProfileUrl: "https://www.instagram.com/style_nina_official",
    postedAt: "04-22",
    status: "稳定中",
    spendUsd: 540,
    postUrl: "https://www.instagram.com/p/style-nina-1003",
    views: 246_000,
    er: 9.0,
    likes: 19_800,
    comments: 980,
    shares: 1_430,
    favorites: 1_980,
    viewsTrend7d: [232_000, 236_000, 239_000, 241_000, 243_000, 245_000, 246_000],
    viewsTrend30d: expand30([220_000], 246_000),
  },
  {
    id: "p-summer-look-01",
    projectId: "q2-summer",
    creatorHandle: "@summerlook_daily",
    creatorName: "Summer Look Daily",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=summerlook_daily&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "fashion",
    creatorFollowers: 47_000,
    creatorProfileUrl: "https://www.tiktok.com/@summerlook_daily",
    postedAt: "04-30",
    status: "稳定中",
    spendUsd: 220,
    postUrl: "https://www.tiktok.com/@summerlook_daily/video/1004",
    views: 142_000,
    er: 7.5,
    likes: 9_400,
    comments: 410,
    shares: 880,
    favorites: 1_120,
    viewsTrend7d: [128_000, 132_000, 135_000, 138_000, 140_000, 141_000, 142_000],
    viewsTrend30d: expand30([120_000], 142_000),
  },
  {
    id: "p-daily-delight-01",
    projectId: "q2-summer",
    creatorHandle: "@dailydelight_amy",
    creatorName: "Daily Delight Amy",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=dailydelight_amy&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "food",
    creatorFollowers: 115_000,
    creatorProfileUrl: "https://www.tiktok.com/@dailydelight_amy",
    postedAt: "05-02",
    status: "下降中",
    spendUsd: 380,
    postUrl: "https://www.tiktok.com/@dailydelight_amy/video/1005",
    views: 96_000,
    er: 0.4,
    likes: 320,
    comments: 28,
    shares: 41,
    favorites: 60,
    viewsTrend7d: [108_000, 104_000, 101_000, 99_000, 97_500, 96_500, 96_000],
    viewsTrend30d: expand30([110_000], 96_000),
  },
  {
    id: "p-glam-studio-01",
    projectId: "beauty-pool",
    creatorHandle: "@glamstudio_hk",
    creatorName: "Glam Studio HK",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=glamstudio_hk&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "beauty",
    creatorFollowers: 310_000,
    creatorProfileUrl: "https://www.tiktok.com/@glamstudio_hk",
    postedAt: "04-18",
    status: "稳定中",
    spendUsd: 620,
    postUrl: "https://www.tiktok.com/@glamstudio_hk/video/1006",
    views: 384_000,
    er: 6.6,
    likes: 22_400,
    comments: 1_180,
    shares: 1_980,
    favorites: 3_600,
    viewsTrend7d: [378_000, 380_000, 382_000, 383_000, 384_000, 384_000, 384_000],
    viewsTrend30d: expand30([260_000], 384_000),
  },
  {
    id: "p-velvet-look-01",
    projectId: "beauty-pool",
    creatorHandle: "@velvetlook_paris",
    creatorName: "Velvet Look Paris",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=velvetlook_paris&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "beauty",
    creatorFollowers: 71_000,
    creatorProfileUrl: "https://www.tiktok.com/@velvetlook_paris",
    postedAt: "04-25",
    status: "稳定中",
    spendUsd: 280,
    postUrl: "https://www.tiktok.com/@velvetlook_paris/video/1007",
    views: 176_000,
    er: 7.5,
    likes: 11_800,
    comments: 540,
    shares: 920,
    favorites: 1_400,
    viewsTrend7d: [168_000, 170_000, 172_000, 173_000, 174_000, 175_000, 176_000],
    viewsTrend30d: expand30([155_000], 176_000),
  },
  {
    id: "p-beauty-de-01",
    projectId: "beauty-pool",
    creatorHandle: "@beautylife_de",
    creatorName: "Beauty Life DE",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=beautylife_de&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "skincare",
    creatorFollowers: 87_000,
    creatorProfileUrl: "https://www.tiktok.com/@beautylife_de",
    postedAt: "04-20",
    status: "稳定中",
    spendUsd: 360,
    postUrl: "https://www.tiktok.com/@beautylife_de/video/1008",
    views: 132_000,
    er: 7.5,
    likes: 8_900,
    comments: 420,
    shares: 610,
    favorites: 980,
    viewsTrend7d: [126_000, 128_000, 129_000, 130_000, 131_000, 131_500, 132_000],
    viewsTrend30d: expand30([115_000], 132_000),
  },
  {
    id: "p-yoga-sara-01",
    projectId: "beauty-pool",
    creatorHandle: "@yogawithsara",
    creatorName: "Yoga With Sara",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=yogawithsara&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "fitness",
    creatorFollowers: 144_000,
    creatorProfileUrl: "https://www.tiktok.com/@yogawithsara",
    postedAt: "05-01",
    status: "增长中",
    spendUsd: 410,
    postUrl: "https://www.tiktok.com/@yogawithsara/video/1009",
    views: 88_000,
    er: 7.8,
    likes: 6_100,
    comments: 280,
    shares: 510,
    favorites: 720,
    viewsTrend7d: [62_000, 68_000, 74_000, 79_000, 83_000, 86_000, 88_000],
    viewsTrend30d: expand30([62_000], 88_000),
  },
  {
    id: "p-rose-note-01",
    projectId: "beauty-pool",
    creatorHandle: "@rosenote_red",
    creatorName: "Rose Note",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=rosenote_red&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "beauty",
    creatorFollowers: 58_000,
    creatorProfileUrl: "https://www.tiktok.com/@rosenote_red",
    postedAt: "04-26",
    status: "稳定中",
    spendUsd: 210,
    postUrl: "https://www.tiktok.com/@rosenote_red/video/1010",
    views: 64_000,
    er: 8.4,
    likes: 4_800,
    comments: 320,
    shares: 280,
    favorites: 510,
    viewsTrend7d: [60_000, 61_500, 62_500, 63_000, 63_500, 63_800, 64_000],
    viewsTrend30d: expand30([55_000], 64_000),
  },
  {
    id: "p-petit-jardin-01",
    projectId: "q2-summer",
    creatorHandle: "@petitjardin_xhs",
    creatorName: "Petit Jardin",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=petitjardin_xhs&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "beauty",
    creatorFollowers: 42_000,
    creatorProfileUrl: "https://www.tiktok.com/@petitjardin_xhs",
    postedAt: "04-29",
    status: "增长中",
    spendUsd: 180,
    postUrl: "https://www.tiktok.com/@petitjardin_xhs/video/1011",
    views: 58_000,
    er: 7.8,
    likes: 4_100,
    comments: 240,
    shares: 190,
    favorites: 380,
    viewsTrend7d: [40_000, 44_000, 48_000, 52_000, 55_000, 57_000, 58_000],
    viewsTrend30d: expand30([40_000], 58_000),
  },
  {
    id: "p-mira-walk-01",
    projectId: "beauty-pool",
    creatorHandle: "@mira_walks",
    creatorName: "Mira Walks",
    creatorAvatarUrl:
      "https://api.dicebear.com/7.x/lorelei/svg?seed=mira_walks&backgroundColor=fdf0e8",
    platform: "TikTok",
    creatorCategory: "fashion",
    creatorFollowers: 105_000,
    creatorProfileUrl: "https://www.tiktok.com/@mira_walks",
    postedAt: "04-23",
    status: "下降中",
    spendUsd: 290,
    postUrl: "https://www.tiktok.com/@mira_walks/video/1012",
    views: 12_400,
    er: 9.0,
    likes: 980,
    comments: 52,
    shares: 88,
    favorites: 110,
    viewsTrend7d: [22_000, 19_000, 17_000, 15_500, 14_200, 13_200, 12_400],
    viewsTrend30d: expand30([24_000], 12_400),
  },
];

export const PLACEMENTS: Placement[] = PLACEMENT_SEED.map((p) => ({
  ...p,
  collabPhase: "collaborating",
}));
