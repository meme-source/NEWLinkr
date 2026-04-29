import { FLAG_TO_DISCOVERY_COUNTRY } from "@/features/plugin/data/countries";
import type { CreatorProfile, ProjectSummary } from "@/features/plugin/types";
import {
  getAudienceSummary,
} from "@/features/plugin/lib/creator-helpers";
import { mapFollowersLabelToDiscoveryPreset } from "@/features/plugin/lib/format";

export function buildDiscoveryResultsUrl({
  creatorId,
  creator,
  project,
  entry,
  mode,
}: {
  creatorId: string;
  creator: CreatorProfile;
  project?: ProjectSummary;
  entry: "seed-finder" | "quick-screen";
  mode?: "viral";
}) {
  const params = new URLSearchParams();
  params.set("entry", entry);
  params.set("results", "1");
  params.set("creator", creatorId);
  params.set("seedId", creatorId);
  params.set("seedHandle", creator.handle);
  params.set("seedName", creator.name);
  params.set("seedAvatarSeed", creatorId);
  params.set("platform", "tiktok");
  if (project) {
    params.set("projectId", project.id);
    params.set("projectName", project.name);
  }
  if (mode) params.set("mode", mode);

  const summary = getAudienceSummary(creator);
  const countries = new Set<string>();
  for (const flag of [
    ...(summary.regionT1?.flags ?? []),
    ...(summary.regionT2?.flags ?? []),
  ]) {
    const name = FLAG_TO_DISCOVERY_COUNTRY[flag];
    if (name) countries.add(name);
  }
  if (countries.size > 0) {
    params.set("countries", Array.from(countries).join("|"));
  }

  const fp = mapFollowersLabelToDiscoveryPreset(creator.followers);
  if (fp) params.set("fp", fp);

  return `/workspace/discovery?${params.toString()}`;
}

/** 插件「找种子达人」→ 后台博主发现结果页深链（含筛选与直接进入结果） */
export function buildSeedFinderDiscoveryUrl(
  creatorId: string,
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  return buildDiscoveryResultsUrl({
    creatorId,
    creator,
    project,
    entry: "seed-finder",
    mode: "viral",
  });
}

export function buildQuickScreenDiscoveryUrl(
  creatorId: string,
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  return buildDiscoveryResultsUrl({
    creatorId,
    creator,
    project,
    entry: "quick-screen",
  });
}

export function getCreatorOutreachPreview(creator: CreatorProfile) {
  return (
    creator.outreachPreview ??
    `Hi ${creator.name}, 我们正在做一轮露营类内容合作，觉得你的内容调性和受众非常契合，想和你确认一下近期合作档期与报价。`
  );
}
