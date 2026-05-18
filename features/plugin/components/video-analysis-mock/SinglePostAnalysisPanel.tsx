"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  TrackingSetupDialog,
  type TrackingSetupPayload,
} from "@/features/outreach/components/tracking-setup-dialog";

import {
  FEATURE_COST,
  FEATURE_LABEL,
  INITIAL_TOKENS_USED,
  MOCK_POSTS,
  TOTAL_TOKENS_PER_MONTH,
  type MockFeatureId,
} from "./mock-posts";
import { SinglePostAnalysisView, type AnalysisSubTab } from "./SinglePostAnalysisView";
import { UnlockConfirmModal } from "./UnlockConfirmModal";

/**
 * SinglePostAnalysisPanel —— 把「单帖 AI 分析」接进真实插件 sidebar 的容器。
 *
 * SidebarShell 在 activeSidebarTab === "single-post" 时直接渲染本组件，占满
 * sidebar 内容列。组件自持全部 mock 状态（token / 解锁 / modal / toast /
 * 投放追踪弹窗），不依赖 SidebarShell 透传任何 prop。
 *
 * 两个子 tab：
 *   - 单帖分析：功能 accordion（帖子表现 / 受众画像 / 粉丝真伪 / …）
 *   - 单帖追踪：投放效果监控 + 「投放追踪」按钮（打开 TrackingSetupDialog）
 *
 * 生产化时浏览器扩展用 DOM detection 识别当前 TikTok 帖子；mock 阶段固定
 * 分析 MOCK_POSTS[0]。
 */
export function SinglePostAnalysisPanel() {
  const basePost = MOCK_POSTS[0];
  const [subTab, setSubTab] = useState<AnalysisSubTab>("analysis");
  const [tokensUsed, setTokensUsed] = useState<number>(INITIAL_TOKENS_USED);
  const [unlockedExtra, setUnlockedExtra] = useState<MockFeatureId[]>([]);
  const [pendingUnlock, setPendingUnlock] = useState<MockFeatureId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  // 合并 fixture + session 解锁项 —— 传给 SinglePostAnalysisView 的 post.unlocked。
  const currentPost = useMemo(() => {
    if (unlockedExtra.length === 0) return basePost;
    return { ...basePost, unlocked: Array.from(new Set([...basePost.unlocked, ...unlockedExtra])) };
  }, [basePost, unlockedExtra]);

  const remaining = Math.max(0, TOTAL_TOKENS_PER_MONTH - tokensUsed);

  const handleRequestUnlock = useCallback((featureId: MockFeatureId) => {
    setPendingUnlock(featureId);
  }, []);

  const handleConfirmUnlock = useCallback(() => {
    if (!pendingUnlock) return;
    const cost = FEATURE_COST[pendingUnlock];
    setTokensUsed((t) => Math.min(TOTAL_TOKENS_PER_MONTH, t + cost));
    setUnlockedExtra((prev) => (prev.includes(pendingUnlock) ? prev : [...prev, pendingUnlock]));
    setToast(`已解锁「${FEATURE_LABEL[pendingUnlock]}」`);
    setPendingUnlock(null);
  }, [pendingUnlock]);

  // 插件端「投放追踪」—— 自动识别当前帖子链接（mock 阶段由 handle 合成）。
  const currentPostUrl = `https://www.tiktok.com/${basePost.handle}/video/7400000000000000123`;
  // 填完「投放追踪」卡片并提交 = 扣费解锁 placement（投放监控数据）。
  // 已解锁后再次提交只更新设置，不重复扣费。
  const handleTrackingSubmit = useCallback(
    (payload: TrackingSetupPayload) => {
      const alreadyUnlocked =
        basePost.unlocked.includes("placement") || unlockedExtra.includes("placement");
      if (!alreadyUnlocked) {
        setTokensUsed((t) => Math.min(TOTAL_TOKENS_PER_MONTH, t + FEATURE_COST.placement));
        setUnlockedExtra((prev) => (prev.includes("placement") ? prev : [...prev, "placement"]));
      }
      setToast(
        alreadyUnlocked
          ? "已更新本帖投放追踪设置"
          : payload.collaborating
            ? `已建立合作追踪并解锁投放监控 · 周期 ${payload.trackingPeriodDays} 天`
            : `已加入候选追踪并解锁投放监控 · 周期 ${payload.trackingPeriodDays} 天`,
      );
    },
    [basePost, unlockedExtra],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SinglePostAnalysisView
        post={currentPost}
        tokensUsed={tokensUsed}
        onRequestUnlock={handleRequestUnlock}
        subTab={subTab}
        onSubTabChange={setSubTab}
        onOpenTracking={() => setTrackingOpen(true)}
      />

      <UnlockConfirmModal
        open={pendingUnlock !== null}
        featureLabel={pendingUnlock ? FEATURE_LABEL[pendingUnlock] : null}
        cost={pendingUnlock ? FEATURE_COST[pendingUnlock] : 0}
        remaining={remaining}
        onCancel={() => setPendingUnlock(null)}
        onConfirm={handleConfirmUnlock}
      />

      <TrackingSetupDialog
        open={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        onSubmit={handleTrackingSubmit}
        prefillPostUrl={currentPostUrl}
        lockPostUrl
      />

      {toast ? (
        <div
          className="fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-[12.5px] font-medium text-[#fffefb] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.4)]"
          style={{ backgroundColor: "#201515" }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
