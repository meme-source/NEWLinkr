// 仅开发/演示阶段使用。生产通过 NEXT_PUBLIC_USE_MOCK=false 关闭，可整文件删除。
// 所有 import 必须经过 features/creator/data/index.ts。
import { pickCredibilitySummaries } from "@/features/creator/components/drawer/audience/credibility-summary";
import { deriveFavorited } from "@/lib/creator";
import type {
  AudienceProfile,
  Collaboration,
  CollaborationMethod,
  CollaborationStatus,
  Creator,
  CreatorCategory,
  CreatorRecentPost,
  CreatorSource,
  Rating,
} from "@/types/api";

// mock 阶段用的"建联事件"表，仅本文件内部消费（生成 lastContactAt /
// lastResponseAt / lastEmailOpenedAt）。真实后端接通后整个文件可删除。
type MockEvent =
  | { kind: "sent"; at: string }
  | { kind: "opened"; at: string }
  | { kind: "replied"; at: string };

type Participation = {
  projectId: string;
  status: CollaborationStatus;
  joinedAt: string;
  lastContactAt?: string;
  method?: CollaborationMethod;
  budget?: number;
  finalPrice?: number;
  notes?: string;
};

type MockCreatorSeed = {
  id: string;
  handle: string;
  name: string;
  region: string;
  followers: number;
  medianViews: number;
  engagementRate: number;
  estimatedPrice?: string;
  emailStatus: Creator["emailStatus"];
  recentActiveAt?: string;
  source: CreatorSource;
  category: CreatorCategory;
  // 系统话题词（系统对博主内容的话题分析）
  topics: string[];
  // 用户自定义标签（mock 阶段可选；空数组用于演示空态）
  userTags?: string[];
  addedAt: string;
  emails?: { address: string; verified?: boolean; primary?: boolean }[];
  ratePost?: number;
  rateVideo?: number;
  manager?: { name: string; email: string | null; agency: string | null };
  rating: Rating;
  events: MockEvent[];
  participations: Participation[];
};

const SEEDS: MockCreatorSeed[] = [
  // ── 跨项目博主 #1：q2-summer + holiday-2026 ────────────────────────────────
  {
    id: "skincare_sam",
    handle: "@skincare_sam",
    name: "Skincare Sam",
    region: "🇺🇸",
    followers: 320000,
    medianViews: 45000,
    engagementRate: 7.1,
    estimatedPrice: "$1,200 - $1,800",
    emailStatus: "verified",
    recentActiveAt: "2026-04-30",
    source: "plugin",
    category: "skincare",
    topics: ["测评", "护肤教程", "夏日防晒"],
    userTags: ["重点跟进", "S 级"],
    addedAt: "2026-04-10",
    emails: [{ address: "sam@skincaresam.co", verified: true, primary: true }],
    ratePost: 1500,
    rateVideo: 2400,
    rating: 2,
    events: [
      { kind: "sent", at: "2026-04-22" },
      { kind: "opened", at: "2026-04-23" },
    ],
    participations: [
      {
        projectId: "q2-summer",
        status: "sent",
        joinedAt: "2026-04-10",
        lastContactAt: "2026-04-22",
        method: "paid",
        budget: 1800,
        finalPrice: 1500,
        notes: "对夏日防晒话题感兴趣",
      },
      {
        projectId: "holiday-2026",
        status: "queued",
        joinedAt: "2026-04-28",
      },
    ],
  },
  // ── 跨项目博主 #2：q2-summer + beauty-pool ─────────────────────────────────
  {
    id: "beauty_karen",
    handle: "@beautytipskaren",
    name: "Beauty Tips Karen",
    region: "🇺🇸",
    followers: 64000,
    medianViews: 18000,
    engagementRate: 4.5,
    estimatedPrice: "$400 - $700",
    emailStatus: "found",
    recentActiveAt: "2026-04-29",
    source: "manual",
    category: "beauty",
    topics: ["彩妆", "护肤", "评测"],
    userTags: ["待确认报价"],
    addedAt: "2026-04-15",
    emails: [{ address: "karen.b@example.com", primary: true }],
    rating: 3,
    events: [
      { kind: "sent", at: "2026-04-18" },
      { kind: "opened", at: "2026-04-19" },
      { kind: "replied", at: "2026-04-21" },
    ],
    participations: [
      {
        projectId: "q2-summer",
        status: "collaborating",
        joinedAt: "2026-04-15",
        lastContactAt: "2026-04-21",
        method: "paid",
        budget: 700,
        finalPrice: 600,
        notes: "正在拍第二条视频",
      },
      {
        projectId: "beauty-pool",
        status: "completed",
        joinedAt: "2026-02-01",
        lastContactAt: "2026-03-01",
        method: "paid",
        budget: 600,
        finalPrice: 550,
        notes: "档期偏紧但交付准时，配合度高。完成视频 ER 6.4%，比账号均值高 1.2pp。",
      },
    ],
  },
  // ── 单项目：q2-summer 待跟进 ───────────────────────────────────────────────
  {
    id: "fit_jenny",
    handle: "@fit_jenny",
    name: "Fit Jenny",
    region: "🇺🇸",
    followers: 89000,
    medianViews: 52000,
    engagementRate: 6.2,
    estimatedPrice: "$500 - $900",
    emailStatus: "missing",
    recentActiveAt: "2026-04-28",
    source: "search",
    category: "fitness",
    topics: ["健身", "恢复拉伸"],
    addedAt: "2026-04-12",
    rating: 1,
    events: [],
    participations: [
      {
        projectId: "q2-summer",
        status: "pending",
        joinedAt: "2026-04-12",
      },
    ],
  },
  {
    id: "summer_look",
    handle: "@summerlook_daily",
    name: "Summer Look Daily",
    region: "🇨🇦",
    followers: 47000,
    medianViews: 22000,
    engagementRate: 5.4,
    emailStatus: "found",
    recentActiveAt: "2026-04-26",
    source: "search",
    category: "fashion",
    topics: ["夏日穿搭", "OOTD"],
    userTags: ["重点跟进"],
    addedAt: "2026-04-14",
    rating: 2,
    events: [
      { kind: "sent", at: "2026-04-20" },
      { kind: "opened", at: "2026-04-21" },
    ],
    participations: [
      {
        projectId: "q2-summer",
        status: "queued",
        joinedAt: "2026-04-14",
        lastContactAt: "2026-04-20",
      },
    ],
  },
  {
    id: "coastline_clara",
    handle: "@coastline_clara",
    name: "Coastline Clara",
    region: "🇦🇺",
    followers: 132000,
    medianViews: 36000,
    engagementRate: 5.8,
    estimatedPrice: "$800 - $1,200",
    emailStatus: "verified",
    recentActiveAt: "2026-04-25",
    source: "plugin",
    category: "travel",
    topics: ["旅行", "海岸线"],
    addedAt: "2026-04-13",
    rating: 3,
    events: [
      { kind: "sent", at: "2026-04-18" },
      { kind: "opened", at: "2026-04-19" },
      { kind: "replied", at: "2026-04-23" },
    ],
    ratePost: 1000,
    rateVideo: 1700,
    participations: [
      {
        projectId: "q2-summer",
        status: "collaborating",
        joinedAt: "2026-04-13",
        lastContactAt: "2026-04-26",
        method: "paid",
        budget: 2000,
        finalPrice: 1700,
        notes: "已签约一条 30 秒视频",
      },
    ],
  },
  // ── 单项目：beauty-pool 历史完成 ───────────────────────────────────────────
  {
    id: "glow_amelia",
    handle: "@glow.amelia",
    name: "Glow Amelia",
    region: "🇬🇧",
    followers: 215000,
    medianViews: 41000,
    engagementRate: 4.1,
    estimatedPrice: "$1,000 - $1,500",
    emailStatus: "verified",
    recentActiveAt: "2026-03-30",
    source: "manual",
    category: "beauty",
    topics: ["底妆", "教程"],
    addedAt: "2026-01-10",
    emails: [{ address: "amelia@glowinc.uk", verified: true, primary: true }],
    manager: { name: "Hannah Lee", email: "hannah@glow-mgmt.uk", agency: "Glow Management" },
    rating: 3,
    events: [
      { kind: "sent", at: "2026-01-12" },
      { kind: "opened", at: "2026-01-13" },
      { kind: "replied", at: "2026-01-15" },
    ],
    participations: [
      {
        projectId: "beauty-pool",
        status: "completed",
        joinedAt: "2026-01-10",
        lastContactAt: "2026-03-01",
        method: "paid",
        budget: 1500,
        finalPrice: 1300,
        notes:
          "出品质量很高，2 月内容上线后 ER 8.2%，上线 24h 内自然分享带来 +3.4k 二次曝光。已申请合作 Q3 续作。",
      },
    ],
  },
  // ── 单项目：beauty-pool 暂停中（互动率不达标，先挂起） ────────────────────
  {
    id: "lifestyle_max",
    handle: "@lifestyle_max",
    name: "Lifestyle Max",
    region: "🇺🇸",
    followers: 51000,
    medianViews: 8500,
    engagementRate: 1.4,
    emailStatus: "missing",
    source: "plugin",
    category: "vlog",
    topics: ["生活"],
    addedAt: "2026-04-02",
    rating: 1,
    events: [],
    participations: [
      {
        projectId: "beauty-pool",
        status: "paused",
        joinedAt: "2026-04-02",
        notes: "互动率太低，暂时挂起观察",
      },
    ],
  },
  // ── 跨项目博主 #3（独立项目 holiday-2026 + unassigned 出现） ─────────────
  {
    id: "holiday_helena",
    handle: "@holiday.helena",
    name: "Holiday Helena",
    region: "🇪🇸",
    followers: 178000,
    medianViews: 26000,
    engagementRate: 3.9,
    estimatedPrice: "$700 - $1,100",
    emailStatus: "found",
    recentActiveAt: "2026-04-28",
    source: "referral",
    category: "travel",
    topics: ["旅行", "节日"],
    addedAt: "2026-04-20",
    emails: [{ address: "hi@helenavoyage.es", primary: true }],
    rating: 2,
    events: [{ kind: "sent", at: "2026-04-25" }],
    participations: [
      {
        projectId: "holiday-2026",
        status: "sent",
        joinedAt: "2026-04-20",
        lastContactAt: "2026-04-25",
      },
      {
        projectId: "unassigned",
        status: "pending",
        joinedAt: "2026-04-22",
      },
    ],
  },
  // ── 单项目：holiday-2026 候选 ─────────────────────────────────────────────
  {
    id: "winter_will",
    handle: "@winter.will",
    name: "Winter Will",
    region: "🇨🇦",
    followers: 38000,
    medianViews: 12000,
    engagementRate: 5.2,
    emailStatus: "found",
    recentActiveAt: "2026-04-22",
    source: "search",
    category: "travel",
    topics: ["户外", "节日"],
    addedAt: "2026-04-21",
    rating: 1,
    events: [],
    participations: [{ projectId: "holiday-2026", status: "pending", joinedAt: "2026-04-21" }],
  },
  // ── 单项目：unassigned（未分配） ───────────────────────────────────────────
  {
    id: "raw_riley",
    handle: "@raw_riley",
    name: "Raw Riley",
    region: "🇺🇸",
    followers: 24000,
    medianViews: 7000,
    engagementRate: 6.7,
    emailStatus: "missing",
    source: "plugin",
    category: "vlog",
    topics: ["生活方式"],
    addedAt: "2026-04-25",
    rating: 1,
    events: [],
    participations: [{ projectId: "unassigned", status: "pending", joinedAt: "2026-04-25" }],
  },
  // ── 已完成 #1：高评级（优秀） + 完整复盘备注 ──────────────────────────────
  {
    id: "luxe_lena",
    handle: "@luxe.lena",
    name: "Luxe Lena",
    region: "🇫🇷",
    followers: 142000,
    medianViews: 68000,
    engagementRate: 7.1,
    estimatedPrice: "$1,500 - $2,200",
    emailStatus: "verified",
    recentActiveAt: "2026-04-30",
    source: "referral",
    category: "fashion",
    topics: ["高端穿搭", "巴黎时装周", "古着"],
    userTags: ["S 级", "Q3 续约"],
    addedAt: "2026-01-05",
    emails: [{ address: "lena@luxepartner.fr", verified: true, primary: true }],
    manager: { name: "Camille Roux", email: "camille@luxepartner.fr", agency: "Luxe Partner" },
    rating: 3,
    events: [
      { kind: "sent", at: "2026-04-08" },
      { kind: "opened", at: "2026-04-08" },
      { kind: "replied", at: "2026-04-09" },
    ],
    participations: [
      {
        projectId: "q2-summer",
        status: "completed",
        joinedAt: "2026-04-05",
        lastContactAt: "2026-05-08",
        method: "paid",
        budget: 2000,
        finalPrice: 1850,
        notes:
          "完成 1 条主视频 + 2 条 Story。主视频 4 周累计播放 132k，ER 8.4%。沟通顺畅、交付提前 2 天。强烈建议 Q3 续约并提价至 $2,300。",
      },
    ],
  },
  // ── 已完成 #2：中评级（良好） + 跨项目（一个完成 + 一个候选） ────────────
  {
    id: "kitchen_kai",
    handle: "@kitchen.kai",
    name: "Kitchen Kai",
    region: "🇸🇬",
    followers: 56000,
    medianViews: 18000,
    engagementRate: 4.8,
    estimatedPrice: "$400 - $700",
    emailStatus: "verified",
    recentActiveAt: "2026-04-27",
    source: "search",
    category: "food",
    topics: ["东南亚菜", "家庭料理", "厨房好物"],
    userTags: ["性价比"],
    addedAt: "2026-02-12",
    emails: [{ address: "kai@kitchenkai.sg", verified: true, primary: true }],
    rating: 2,
    events: [
      { kind: "sent", at: "2026-02-14" },
      { kind: "opened", at: "2026-02-14" },
      { kind: "replied", at: "2026-02-15" },
    ],
    participations: [
      {
        projectId: "q2-summer",
        status: "completed",
        joinedAt: "2026-04-12",
        lastContactAt: "2026-05-05",
        method: "gifted",
        budget: 0,
        finalPrice: 0,
        notes: "寄样合作，按时出片但脚本与 brief 偏离。后续合作建议加付费 + 更紧的脚本对齐。",
      },
      {
        projectId: "beauty-pool",
        status: "pending",
        joinedAt: "2026-04-20",
      },
    ],
  },
  // ── 已完成 #3：低评级（普通） + 失败案例 ──────────────────────────────────
  {
    id: "tech_theo",
    handle: "@techtheo",
    name: "Tech Theo",
    region: "🇩🇪",
    followers: 88000,
    medianViews: 24000,
    engagementRate: 3.1,
    estimatedPrice: "$700 - $1,100",
    emailStatus: "found",
    recentActiveAt: "2026-04-19",
    source: "manual",
    category: "tech",
    topics: ["数码评测", "智能家居"],
    userTags: ["谨慎合作"],
    addedAt: "2026-01-22",
    emails: [{ address: "theo@techtheo.de" }],
    rating: 1,
    events: [
      { kind: "sent", at: "2026-01-25" },
      { kind: "replied", at: "2026-01-29" },
    ],
    participations: [
      {
        projectId: "holiday-2026",
        status: "completed",
        joinedAt: "2026-01-22",
        lastContactAt: "2026-03-04",
        method: "paid",
        budget: 1000,
        finalPrice: 950,
        notes: "出片质量一般，互动率 2.1% 低于账号均值。回复慢、二修不接。建议短期内不再续约。",
      },
    ],
  },
  // ── 已完成 #4：高评级 + 单完成（最直观的演示用） ──────────────────────────
  {
    id: "sunset_sasha",
    handle: "@sunset.sasha",
    name: "Sunset Sasha",
    region: "🇦🇺",
    followers: 73000,
    medianViews: 32000,
    engagementRate: 6.4,
    estimatedPrice: "$800 - $1,200",
    emailStatus: "verified",
    recentActiveAt: "2026-04-29",
    source: "plugin",
    category: "travel",
    topics: ["海岛", "度假穿搭"],
    userTags: ["可续约"],
    addedAt: "2026-02-25",
    emails: [{ address: "sasha@sunset.travel", verified: true, primary: true }],
    rating: 3,
    events: [
      { kind: "sent", at: "2026-02-26" },
      { kind: "opened", at: "2026-02-27" },
      { kind: "replied", at: "2026-02-27" },
    ],
    participations: [
      {
        projectId: "holiday-2026",
        status: "completed",
        joinedAt: "2026-02-25",
        lastContactAt: "2026-04-08",
        method: "paid",
        budget: 1100,
        finalPrice: 1000,
        notes:
          "海岛实景拍摄完成度极高，brief 还原度 95%+。视频上线 2 周累计 41k 播放，CPM 优于历史均值。Q3 holiday-2026 续作首选。",
      },
    ],
  },
];

function buildAvatar(id: string): string {
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(id)}&backgroundColor=fdf0e8`;
}

function deriveLastEventAt(events: MockEvent[], kind: MockEvent["kind"]): string | null {
  const last = [...events].reverse().find((e) => e.kind === kind);
  return last?.at ?? null;
}

function buildCollaborations(seed: MockCreatorSeed): Collaboration[] {
  return seed.participations.map((part, idx) => ({
    id: `${seed.id}::${part.projectId}::${idx}`,
    projectId: part.projectId,
    status: part.status,
    joinedAt: part.joinedAt,
    lastContactAt: part.lastContactAt ?? null,
    trackedContentIds: [],
    method: part.method ?? null,
    budget: part.budget ?? null,
    finalPrice: part.finalPrice ?? null,
    notes: part.notes ?? "",
  }));
}

// ── Recent posts 生成器 ──────────────────────────────────────────────────────
//
// 真实数据来自后端后会替换。mock 阶段按 (followers, engagementRate) 生成
// 一组带轻微抖动的近 10 条快照，使中位数 / 平均的差异看起来真实。
const HASHTAG_BANK_BY_CATEGORY: Partial<Record<CreatorCategory, string[]>> = {
  beauty: [
    "#beauty",
    "#makeup",
    "#skincare",
    "#tutorial",
    "#grwm",
    "#mua",
    "#fall",
    "#routine",
    "#tips",
    "#bridal",
  ],
  skincare: [
    "#skincare",
    "#glowup",
    "#dermtok",
    "#sunscreen",
    "#routine",
    "#serum",
    "#acneprone",
    "#hydration",
    "#review",
    "#cleanbeauty",
  ],
  fashion: [
    "#fashion",
    "#ootd",
    "#styletok",
    "#summer",
    "#thrift",
    "#streetstyle",
    "#capsule",
    "#styling",
    "#trend",
    "#fit",
  ],
  travel: [
    "#travel",
    "#wanderlust",
    "#hiddengems",
    "#destination",
    "#vlog",
    "#roadtrip",
    "#cityguide",
    "#solotravel",
    "#asia",
    "#europe",
  ],
  food: [
    "#food",
    "#recipe",
    "#easyrecipe",
    "#foodie",
    "#mealprep",
    "#dinner",
    "#baking",
    "#viralfood",
    "#snack",
    "#brunch",
  ],
  vlog: [
    "#vlog",
    "#dayinmylife",
    "#routine",
    "#aesthetic",
    "#cozy",
    "#study",
    "#morning",
    "#weekend",
    "#nyc",
    "#lifestyle",
  ],
  fitness: [
    "#fitness",
    "#workout",
    "#gymtok",
    "#stretch",
    "#mobility",
    "#running",
    "#hiit",
    "#yoga",
    "#strength",
    "#pilates",
  ],
  parenting: [
    "#parenting",
    "#momlife",
    "#toddler",
    "#momhack",
    "#dadlife",
    "#newborn",
    "#schoolrun",
    "#tantrum",
    "#bedtime",
    "#mealideas",
  ],
  tech: [
    "#tech",
    "#gadgets",
    "#review",
    "#unboxing",
    "#productivity",
    "#ai",
    "#iphone",
    "#android",
    "#wfh",
    "#desktour",
  ],
  home: [
    "#home",
    "#interior",
    "#cleantok",
    "#organize",
    "#diy",
    "#smallspace",
    "#renovation",
    "#hometour",
    "#minimal",
    "#decor",
  ],
  review: [
    "#review",
    "#testing",
    "#honestreview",
    "#tryout",
    "#sponsored",
    "#vsbattle",
    "#worthit",
    "#wasteofmoney",
    "#firstimpression",
    "#deepdive",
  ],
  education: [
    "#learn",
    "#study",
    "#productivity",
    "#tips",
    "#hack",
    "#career",
    "#interview",
    "#notion",
    "#booktok",
    "#languagelearning",
  ],
  comedy: [
    "#comedy",
    "#funny",
    "#fyp",
    "#viral",
    "#meme",
    "#prank",
    "#skit",
    "#satire",
    "#improv",
    "#sketch",
  ],
  other: [
    "#fyp",
    "#tiktok",
    "#trending",
    "#viral",
    "#daily",
    "#fyp追梦",
    "#lifestyle",
    "#community",
    "#explore",
    "#story",
  ],
};

const BRAND_BANK_BY_CATEGORY: Partial<Record<CreatorCategory, string[]>> = {
  beauty: ["Sephora", "Charlotte Tilbury", "Rare Beauty"],
  skincare: ["CeraVe", "La Roche-Posay", "Drunk Elephant"],
  fashion: ["Zara", "Aritzia", "Madewell"],
  travel: ["Airbnb", "Booking", "Marriott"],
  food: ["HelloFresh", "Trader Joe's", "Whole Foods"],
  vlog: ["Glossier", "Notion", "Spotify"],
  fitness: ["Lululemon", "Gymshark", "Alo"],
  parenting: ["Pampers", "Munchkin", "Stokke"],
  tech: ["Apple", "Sony", "Anker"],
  home: ["IKEA", "West Elm", "Dyson"],
  review: ["Amazon", "Costco", "Target"],
  education: ["Notion", "Coursera", "Skillshare"],
  comedy: [],
  other: ["TikTok"],
};

function pseudoRandom(seedString: string, salt: number): number {
  let h = 2166136261;
  for (let i = 0; i < seedString.length; i++) {
    h ^= seedString.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= salt;
  return Math.abs((h >>> 0) % 1_000_000) / 1_000_000;
}

// Deterministic random subset：用 pseudoRandom 在 (seedId, idx) 命名空间下做不重复采样。
function pickDeterministicSubset<T>(items: T[], count: number, seedId: string, idx: number): T[] {
  const n = Math.min(count, items.length);
  if (n <= 0) return [];
  const taken = new Set<number>();
  const result: T[] = [];
  let attempt = 0;
  while (result.length < n && attempt < items.length * 4) {
    const pick = Math.floor(pseudoRandom(seedId, idx * 1000 + attempt) * items.length);
    if (!taken.has(pick)) {
      taken.add(pick);
      result.push(items[pick]);
    }
    attempt++;
  }
  return result;
}

function buildRecentPosts(seed: MockCreatorSeed): CreatorRecentPost[] {
  const tags = HASHTAG_BANK_BY_CATEGORY[seed.category] ?? HASHTAG_BANK_BY_CATEGORY.other!;
  const brands = BRAND_BANK_BY_CATEGORY[seed.category] ?? [];
  const baseViews = seed.medianViews;
  return Array.from({ length: 10 }, (_, idx) => {
    const jitter = (pseudoRandom(seed.id, idx) - 0.5) * 0.9; // -0.45..+0.45
    const views = Math.max(500, Math.round(baseViews * (1 + jitter)));
    const er = seed.engagementRate / 100;
    const likes = Math.round(views * er * (0.7 + pseudoRandom(seed.id, idx + 100) * 0.5));
    const comments = Math.round(likes * (0.04 + pseudoRandom(seed.id, idx + 200) * 0.05));
    const shares = Math.round(likes * (0.02 + pseudoRandom(seed.id, idx + 300) * 0.03));
    const dayOffset = idx * 2 + Math.floor(pseudoRandom(seed.id, idx + 400) * 3);
    const postedDate = new Date(2026, 3, 30 - dayOffset);
    const tagCount = 2 + Math.floor(pseudoRandom(seed.id, idx + 500) * 3);
    // 每条帖子随机选不重复的 tag 子集（确定性），让 10 条内容里出现多种 hashtag。
    const hashtags = pickDeterministicSubset(tags, Math.min(tagCount, tags.length), seed.id, idx);
    const mentionBrand =
      brands.length > 0 && pseudoRandom(seed.id, idx + 600) > 0.65
        ? [brands[Math.floor(pseudoRandom(seed.id, idx + 700) * brands.length)]]
        : [];
    return {
      id: `${seed.id}-post-${idx + 1}`,
      postedAt: postedDate.toISOString().slice(0, 10),
      url: `https://www.tiktok.com/${seed.handle}/video/${idx + 1}`,
      caption: `${seed.name} · post ${idx + 1}`,
      views,
      likes,
      comments,
      shares,
      hashtags,
      brandMentions: mentionBrand,
    };
  });
}

// ── Audience analysis 生成器 ─────────────────────────────────────────────────
//
// 仅给一部分博主预置完整受众数据，用于演示"已解锁"状态。其余博主返回 null，
// 抽屉里显示锁定遮罩 + 解锁 CTA。
const AUDIENCE_PRESET_IDS = new Set([
  "skincare_sam",
  "beauty_karen",
  "coastline_clara",
  "glow_amelia",
  "holiday_helena",
]);

function buildAudienceAnalysis(seed: MockCreatorSeed): AudienceProfile | null {
  if (!AUDIENCE_PRESET_IDS.has(seed.id)) return null;
  const femaleSkew = seed.category === "beauty" || seed.category === "skincare" ? 0.78 : 0.55;
  return {
    sample: {
      videosAnalyzed: 10,
      commentersCollected: 1327 + Math.round(pseudoRandom(seed.id, 1) * 500),
      followersCollected: 5000,
      totalUsers: 6326 + Math.round(pseudoRandom(seed.id, 2) * 800),
    },
    gender: { female: femaleSkew, male: 1 - femaleSkew },
    ageBuckets: [
      { range: "13-17", female: 0.067, male: 0.088 },
      { range: "18-24", female: 0.251, male: 0.195 },
      { range: "25-34", female: 0.166, male: 0.044 },
      { range: "35-44", female: 0.086, male: 0.017 },
      { range: "45-54", female: 0.051, male: 0.006 },
      { range: "55-64", female: 0.024, male: 0.002 },
      { range: "65+", female: 0.003, male: 0 },
    ],
    age17PlusShare: 0.646,
    regions: [
      { code: "US", name: "美国", tier: "T1", share: 0.3421 },
      { code: "PH", name: "菲律宾", tier: "T2", share: 0.2083 },
      { code: "GB", name: "英国", tier: "T1", share: 0.0381 },
      { code: "BR", name: "巴西", tier: "T2", share: 0.0346 },
      { code: "CA", name: "加拿大", tier: "T1", share: 0.0337 },
      { code: "AU", name: "澳大利亚", tier: "T1", share: 0.0283 },
      { code: "MX", name: "墨西哥", tier: "T2", share: 0.0221 },
    ],
    interests: [
      { name: "喜剧", description: "观众喜欢幽默内容", share: 0.35 },
      { name: "时尚", description: "穿搭、品牌合作", share: 0.2 },
      { name: "体育", description: "球类运动、健身", share: 0.2 },
      { name: "游戏", description: "热门游戏内容", share: 0.15 },
      { name: "社会问题", description: "公益、时事", share: 0.1 },
    ],
    credibility: {
      authenticFans: 0.8537,
      productInterest: 0.3215,
      positiveSentiment: 0.7892,
      trustScore: 4.5,
      professionalismScore: 4,
      affinityScore: 5,
      summaries: pickCredibilitySummaries(seed.id),
    },
  };
}

function deriveLastContactAt(seed: MockCreatorSeed): string | null {
  const candidates = seed.participations
    .map((p) => p.lastContactAt)
    .filter((value): value is string => Boolean(value));
  if (candidates.length === 0) return null;
  return candidates.sort().at(-1) ?? null;
}

function buildRateCard(seed: MockCreatorSeed): Creator["rateCard"] {
  if (!seed.ratePost && !seed.rateVideo) return null;
  return {
    postPrice: seed.ratePost ?? null,
    videoPrice: seed.rateVideo ?? null,
    storyPrice: null,
    currency: "USD",
  };
}

function buildCreatorFromSeed(seed: MockCreatorSeed): Creator {
  const collaborations = buildCollaborations(seed);
  return {
    id: seed.id,
    handle: seed.handle,
    name: seed.name,
    platform: "tiktok",
    avatar: buildAvatar(seed.id),
    region: seed.region,
    followers: seed.followers,
    medianViews: seed.medianViews,
    engagementRate: seed.engagementRate,
    estimatedPrice: seed.estimatedPrice ?? null,
    emailStatus: seed.emailStatus,
    recentActiveAt: seed.recentActiveAt ?? null,
    rating: seed.rating,
    source: seed.source,
    category: seed.category,
    topics: seed.topics,
    userTags: seed.userTags ?? [],
    lastContactAt: deriveLastContactAt(seed),
    lastResponseAt: deriveLastEventAt(seed.events, "replied"),
    lastEmailOpenedAt: deriveLastEventAt(seed.events, "opened"),
    nextFollowUp: null,
    addedAt: seed.addedAt,
    emails: (seed.emails ?? []).map((email, i) => ({
      address: email.address,
      verified: email.verified ?? false,
      primary: email.primary ?? i === 0,
    })),
    dms: [{ platform: "tiktok", handle: seed.handle }],
    socialLinks: [{ platform: "tiktok", url: `https://www.tiktok.com/${seed.handle}` }],
    manualContactName: null,
    rateCard: buildRateCard(seed),
    paymentTerms: null,
    usageRights: null,
    manager: seed.manager ?? null,
    collaborations,
    recentPosts: buildRecentPosts(seed),
    audienceAnalysis: buildAudienceAnalysis(seed),
    // 收藏 = 被「筛选过」：合作状态不是「候选」即点亮红心。规则见 lib/creator.ts。
    favorited: deriveFavorited(collaborations),
    lastRefreshedAt: seed.recentActiveAt ? `${seed.recentActiveAt}T08:30:00Z` : null,
  };
}

export function buildMockCreators(): Creator[] {
  return SEEDS.map(buildCreatorFromSeed);
}
