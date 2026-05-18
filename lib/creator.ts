// 博主领域纯函数
//
// 这里只放无副作用、不依赖 React / DOM / fetch 的纯逻辑。所有写入操作都在
// service 层做（lib/services/library.ts）。
//
// 设计原则：
//   - 输入输出都用 types/api.ts 中的类型，不再发明新结构
//   - 所有"项目维度"的查询都需要传入 projectId，避免暗中跨项目读

import type {
  Collaboration,
  CollaborationStatus,
  Creator,
  CreatorCategory,
  CreatorSource,
} from "@/types/api";

// ── 项目维度查询 ──────────────────────────────────────────────────────────────

export function getActiveCollaboration(creator: Creator, projectId: string): Collaboration | null {
  return creator.collaborations.find((c) => c.projectId === projectId) ?? null;
}

export function getCreatorStatusInProject(
  creator: Creator,
  projectId: string,
): CollaborationStatus | null {
  return getActiveCollaboration(creator, projectId)?.status ?? null;
}

export function getProjectIdsForCreator(creator: Creator): string[] {
  // 去重保持插入顺序
  const seen = new Set<string>();
  const result: string[] = [];
  for (const collab of creator.collaborations) {
    if (!seen.has(collab.projectId)) {
      seen.add(collab.projectId);
      result.push(collab.projectId);
    }
  }
  return result;
}

// ── 列表显示辅助 ─────────────────────────────────────────────────────────────

// "全部博主"视角下，决定该博主的"主导状态"——选当前最活跃的合作。
// 优先级：collaborating > sent > queued > pending > completed > paused > rejected
const STATUS_PRIORITY: Record<CollaborationStatus, number> = {
  collaborating: 7,
  sent: 6,
  queued: 5,
  pending: 4,
  completed: 3,
  paused: 2,
  rejected: 1,
};

// 7 个核心状态的展示顺序 —— 博主库 tab、批量改状态弹层、状态下拉菜单都按这个顺序。
export const COLLABORATION_STATUS_ORDER: CollaborationStatus[] = [
  "pending",
  "queued",
  "sent",
  "collaborating",
  "completed",
  "paused",
  "rejected",
];

// 7 个核心状态的中文 label —— 全站唯一来源。
// 不要在组件里再写 "已建联" / "建联成功" / "已暂停" 等旧叫法，导入这里的 label。
//
// 注意：内部 enum 仍是 "pending"，UI 文案是 "候选"。语义上指"刚加入博主库、
// 尚未决定是否建联的候选博主"。"评级"是合作完成后的复盘评分，不要混淆这两件事。
export const COLLABORATION_STATUS_LABEL: Record<CollaborationStatus, string> = {
  pending: "候选",
  queued: "待建联",
  sent: "已发送",
  collaborating: "合作中",
  completed: "已完成",
  paused: "暂停中",
  rejected: "已拒绝",
};

// 7 个核心状态的徽章配色 —— 全站唯一来源。
// 设计意图：每个状态有自己的主色相，避免全部灰带来的视觉混淆。
//   候选   → 暖灰（中性占位）
//   待建联 → 琥珀（待行动）
//   已发送 → 蓝（在途）
//   合作中 → 玫红（高亮活跃）
//   已完成 → 紫（归档）
//   暂停中 → 浅米（弱化中性）
//   已拒绝 → Linkr Orange（警示）
// `dot` 用于状态点的纯背景色（柱状图、列表项前点）；`badge` 是徽章用的
// bg+text+border 三件套。两者颜色配对刻意做的稍重一点的 dot，让小色点
// 在浅色背景上仍能识别。
export interface CollaborationStatusStyle {
  badge: string;
  dot: string;
}

export const COLLABORATION_STATUS_STYLE: Record<CollaborationStatus, CollaborationStatusStyle> = {
  pending: {
    badge: "bg-[#eceae3] text-[#939084] border-[#c5c0b1]",
    dot: "bg-[#c5c0b1]",
  },
  queued: {
    badge: "bg-[#fef3c7] text-[#a16207] border-[#fde68a]",
    dot: "bg-[#ca8a04]",
  },
  sent: {
    badge: "bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe]",
    dot: "bg-[#3b82f6]",
  },
  collaborating: {
    badge: "bg-[#fee2e2] text-[#dc2626] border-[#fecaca]",
    dot: "bg-[#ef4444]",
  },
  completed: {
    badge: "bg-[#ede9fe] text-[#7c3aed] border-[#ddd6fe]",
    dot: "bg-[#8b5cf6]",
  },
  paused: {
    badge: "bg-[#f5f4ee] text-[#8a8678] border-[#dcd7c8]",
    dot: "bg-[#a8a394]",
  },
  rejected: {
    badge: "bg-[#fff0e8] text-[#ff4f00] border-[#fdd9c5]",
    dot: "bg-[#ff4f00]",
  },
};

export function dominantStatus(creator: Creator): CollaborationStatus | null {
  if (creator.collaborations.length === 0) return null;
  return creator.collaborations.reduce<CollaborationStatus>(
    (acc, collab) => (STATUS_PRIORITY[collab.status] > STATUS_PRIORITY[acc] ? collab.status : acc),
    creator.collaborations[0].status,
  );
}

// 收藏判定 —— 全局唯一规则，博主库 / 抽屉 / 项目卡片「达人投放」都从这里取。
// 凡是被「筛选过」的博主即视为已收藏（红心点亮）：合作状态只要不是「候选 pending」
// （刚进库、尚未决定是否建联）就算筛选过。没有任何合作 = 纯候选 = 未收藏。
export function deriveFavorited(collaborations: Collaboration[]): boolean {
  return collaborations.some((collab) => collab.status !== "pending");
}

// 真实存在投放卡片就意味着合作已经在执行：把前置阶段（候选 / 待建联 / 已发送）
// 的状态在 UI 层归一化为「合作中」。
//
// 终态（已完成 / 暂停中 / 已拒绝）属于"用户主动决定"，不在这里被改写 ——
// 否则会把"暂停后又给挂了一条投放占位"或"完成复盘后归档"的语义吃掉。
//
// 这是 UI 层归一化：底层 collab.status 不动，便于 Phase 1+ 后端落 service 时
// 直接镜像同一规则。
const STATUS_STAGES_BEFORE_COLLAB: ReadonlySet<CollaborationStatus> = new Set([
  "pending",
  "queued",
  "sent",
]);

export function deriveEffectiveCollabStatus(
  rawStatus: CollaborationStatus,
  hasActivePlacements: boolean,
): CollaborationStatus {
  if (!hasActivePlacements) return rawStatus;
  if (STATUS_STAGES_BEFORE_COLLAB.has(rawStatus)) return "collaborating";
  return rawStatus;
}

// ── 文案 ─────────────────────────────────────────────────────────────────────

export const CREATOR_CATEGORY_LABEL: Record<CreatorCategory, string> = {
  beauty: "美妆",
  skincare: "护肤",
  fashion: "时尚穿搭",
  food: "美食",
  travel: "旅行",
  vlog: "Vlog",
  fitness: "健身运动",
  parenting: "母婴",
  tech: "数码科技",
  home: "家居",
  review: "测评开箱",
  education: "知识科普",
  comedy: "搞笑娱乐",
  other: "其他",
};

export const CREATOR_SOURCE_LABEL: Record<CreatorSource, string> = {
  plugin: "插件收藏",
  search: "搜索收藏",
  manual: "手动导入",
  referral: "推荐",
};

// 博主类型胶囊配色。每个类目固定一种低饱和度的背景 + 同色系深色文字，
// 14 个类目的色相分布在暖色调与冷色调之间，整体仍服从 cream/sand 的画布。
// 引用方式：className={CREATOR_CATEGORY_CHIP_CLASS[creator.category]}
export const CREATOR_CATEGORY_CHIP_CLASS: Record<CreatorCategory, string> = {
  beauty: "bg-[#fdecef] text-[#a02b4a]",
  skincare: "bg-[#fce8df] text-[#a44a26]",
  fashion: "bg-[#efe6f4] text-[#6e3b8a]",
  food: "bg-[#fbf0d4] text-[#8a6112]",
  travel: "bg-[#ddefee] text-[#1c6663]",
  vlog: "bg-[#e3ecf6] text-[#27548a]",
  fitness: "bg-[#e8edda] text-[#4f5e1f]",
  parenting: "bg-[#fde7ec] text-[#a83a5a]",
  tech: "bg-[#e2e5f0] text-[#3a3f7a]",
  home: "bg-[#efe6d8] text-[#6f5224]",
  review: "bg-[#e6e7ea] text-[#3f4654]",
  education: "bg-[#e0eedb] text-[#2d6a32]",
  comedy: "bg-[#ffe7d6] text-[#a04a16]",
  other: "bg-[#eceae3] text-[#5b574a]",
};

// 话题词是自由文本，无法穷举。用一个低饱和度的 8 色调色板，按文本哈希分配，
// 保证同一个词在任何位置每次都拿到同一种颜色（视觉记忆稳定）。
const TOPIC_CHIP_PALETTE = [
  "bg-[#fff1ec] text-[#a8421b]",
  "bg-[#eef3e3] text-[#516a2c]",
  "bg-[#e8edf6] text-[#34528e]",
  "bg-[#f5e9ef] text-[#8d3461]",
  "bg-[#fbf1d9] text-[#7b5a16]",
  "bg-[#e3eeeb] text-[#235a55]",
  "bg-[#ece7f4] text-[#4d3a85]",
  "bg-[#f2ebde] text-[#6b5530]",
] as const;

export function topicChipClass(topic: string): string {
  // djb2 简易哈希足够稳定 & 跨平台一致，无需密码学强度。
  let hash = 5381;
  for (let i = 0; i < topic.length; i += 1) {
    hash = ((hash << 5) + hash + topic.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % TOPIC_CHIP_PALETTE.length;
  return TOPIC_CHIP_PALETTE[idx];
}

// Creator.region 当前存的是国旗 emoji（mock 数据沿用此约定），UI 想同时展示
// 国家名时通过这张表反查。后续切到真实数据后建议拆成独立字段。
const FLAG_TO_REGION_NAME: Record<string, string> = {
  "🇺🇸": "美国",
  "🇨🇦": "加拿大",
  "🇬🇧": "英国",
  "🇦🇺": "澳大利亚",
  "🇰🇷": "韩国",
  "🇯🇵": "日本",
  "🇨🇳": "中国",
  "🇸🇬": "新加坡",
  "🇮🇩": "印度尼西亚",
  "🇲🇾": "马来西亚",
  "🇹🇭": "泰国",
  "🇻🇳": "越南",
  "🇵🇭": "菲律宾",
  "🇮🇳": "印度",
  "🇪🇸": "西班牙",
  "🇫🇷": "法国",
  "🇩🇪": "德国",
  "🇮🇹": "意大利",
  "🇧🇷": "巴西",
  "🇲🇽": "墨西哥",
  "🇦🇪": "阿联酋",
  "🇸🇦": "沙特阿拉伯",
};

export function regionDisplay(region: string): { flag: string; name: string } {
  const flag = region.trim();
  const name = FLAG_TO_REGION_NAME[flag] ?? "";
  return { flag, name };
}
