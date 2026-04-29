import {
  COUNTRY_CPM_OVERRIDE_USD,
  REGION_TIER_BASE_CPM_USD,
} from "@/features/plugin/data/countries";
import type {
  ProjectScopedState,
  ProjectSummary,
  RegionTierKey,
} from "@/features/plugin/types";

export const SIDEBAR_COLLAPSED_WIDTH = 44;
export const SIDEBAR_MIN_WIDTH = 396;
export const SIDEBAR_MAX_WIDTH = 640;

export function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getSuggestedCpmUsd(country: string, tier: RegionTierKey): string {
  const cpm = COUNTRY_CPM_OVERRIDE_USD[country] ?? REGION_TIER_BASE_CPM_USD[tier];
  return cpm.toFixed(2);
}

export function focusWithoutScroll(element: { focus: (options?: FocusOptions) => void } | null) {
  if (!element) return;
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}

export function getSidebarWidthBounds(viewportWidth: number, compactViewport: boolean) {
  const maxWidth = Math.max(
    280,
    Math.min(SIDEBAR_MAX_WIDTH, viewportWidth - (compactViewport ? 24 : 180))
  );
  const minWidth = Math.min(SIDEBAR_MIN_WIDTH, maxWidth);
  return { min: minWidth, max: maxWidth };
}

export function sortProjectsNewestFirst(projects: ProjectSummary[]) {
  return [...projects].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function buildQuickProjectName(projects: ProjectSummary[]) {
  const existingNames = new Set(projects.map((project) => project.name));
  let index = projects.length + 1;
  let name = `新项目 ${index}`;

  while (existingNames.has(name)) {
    index += 1;
    name = `新项目 ${index}`;
  }

  return name;
}

export function createEmptyProjectScopedState(): ProjectScopedState {
  return {
    savedCreatorIds: [],
    dismissedCreatorIds: [],
    creatorTags: {},
  };
}

export function parseCpmAmount(cpm: string) {
  const amount = Number.parseFloat(cpm.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : "10.00";
}

export function getMedianNumber(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function mapFollowersLabelToDiscoveryPreset(followersLabel: string): string | null {
  const m = followersLabel.match(/([\d.]+)\s*K/i);
  if (!m) return null;
  const k = parseFloat(m[1]);
  if (k < 50) return "10K-50K";
  if (k < 100) return "50K-100K";
  if (k < 200) return "100K-200K";
  if (k < 500) return "200K-500K";
  if (k < 1000) return "500K-1M";
  return "1M+";
}

export function getDefaultScheduleAt() {
  const date = new Date();
  date.setHours(date.getHours() + 2);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);

  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

export function formatScheduleLabel(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
