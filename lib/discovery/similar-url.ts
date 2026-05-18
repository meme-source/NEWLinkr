// Shared deep-link builder for the「找相似」flow.
//
// 单一来源：插件端（plugin-path-demo.tsx 的 buildDiscoveryResultsUrl /
// buildQuickScreenDiscoveryUrl / buildSeedFinderDiscoveryUrl）和网页端
// 抽屉里的 FindSimilarPickerDialog 都通过本文件生成跳转 URL，
// 保证两端 schema 完全一致；discovery 页一旦实现 URL 解析，两边都能直接命中。
//
// entry 取值：
//   - quick-screen     —— 快速筛选：直接跳到 discovery 列表
//   - sequential-screen —— 逐个筛选：跳到 discovery 并按种子顺序逐位查看
//   - seed-finder      —— 找种子达人（保留给插件端）
export type SimilarEntry = "quick-screen" | "sequential-screen" | "seed-finder";

export interface SimilarDiscoveryUrlInput {
  // 种子博主的稳定 id（也会作为 ?creator= 与 ?seedAvatarSeed= 的值）。
  creatorId: string;
  // @handle，原样写回 URL，由 discovery 用于种子展示。
  seedHandle: string;
  // 显示名（去掉 @）。
  seedName: string;
  // 平台默认 tiktok，可在调用方覆盖。
  platform?: string;

  entry: SimilarEntry;
  mode?: "viral";

  // 可选：所属项目（用于 discovery 页带入项目上下文）。
  projectId?: string;
  projectName?: string;

  // 可选：受众国家名（discovery 的筛选词），多值用 "|" 拼接前直接传数组。
  countries?: string[];
  // 可选：粉丝量预设（"10K-50K" / "50K-100K" / ... / "1M+"）。
  followersPreset?: string | null;
}

export function buildSimilarDiscoveryUrl(input: SimilarDiscoveryUrlInput): string {
  const params = new URLSearchParams();
  params.set("entry", input.entry);
  params.set("results", "1");
  params.set("creator", input.creatorId);
  params.set("seedId", input.creatorId);
  params.set("seedHandle", input.seedHandle);
  params.set("seedName", input.seedName);
  params.set("seedAvatarSeed", input.creatorId);
  params.set("platform", input.platform ?? "tiktok");

  if (input.projectId) params.set("projectId", input.projectId);
  if (input.projectName) params.set("projectName", input.projectName);
  if (input.mode) params.set("mode", input.mode);

  if (input.countries && input.countries.length > 0) {
    params.set("countries", input.countries.join("|"));
  }
  if (input.followersPreset) {
    params.set("fp", input.followersPreset);
  }

  return `/workspace/discovery?${params.toString()}`;
}

// 数字粉丝量 → discovery 的预设 bucket。与插件 mapFollowersLabelToDiscoveryPreset
// 同一档位定义，只是入参从 "100K" 字符串换成数字。
export function followersToDiscoveryPreset(followers: number): string | null {
  if (!Number.isFinite(followers) || followers <= 0) return null;
  const k = followers / 1000;
  if (k < 50) return "10K-50K";
  if (k < 100) return "50K-100K";
  if (k < 200) return "100K-200K";
  if (k < 500) return "200K-500K";
  if (k < 1000) return "500K-1M";
  return "1M+";
}
