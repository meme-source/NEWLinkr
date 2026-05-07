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
export const COLLABORATION_STATUS_LABEL: Record<CollaborationStatus, string> = {
  pending: "待评估",
  queued: "待建联",
  sent: "已发送",
  collaborating: "合作中",
  completed: "已完成",
  paused: "暂停中",
  rejected: "已拒绝",
};

// 7 个核心状态的徽章配色 —— 全站唯一来源。
// 设计意图：每个状态有自己的主色相，避免全部灰带来的视觉混淆。
//   待评估 → 暖灰（中性占位）
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
