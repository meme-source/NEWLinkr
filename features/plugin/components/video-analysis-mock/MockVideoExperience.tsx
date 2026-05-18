"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CommentsPanel } from "./CommentsPanel";
import { MockOtherTabPlaceholder, MockSidebarShell, type SidebarTabId } from "./MockSidebarShell";
import {
  FEATURE_COST,
  FEATURE_LABEL,
  INITIAL_TOKENS_USED,
  MOCK_POSTS,
  TOTAL_TOKENS_PER_MONTH,
  type MockFeatureId,
} from "./mock-posts";
import { PostSwitcher } from "./PostSwitcher";
import { SinglePostAnalysisView, type AnalysisSubTab } from "./SinglePostAnalysisView";
import { UnlockConfirmModal } from "./UnlockConfirmModal";
import { VideoStage } from "./VideoStage";

/**
 * MockVideoExperience — 视频分析 sidebar 的独立预览页（/mock-video）。
 *
 * 已被插件 demo 内嵌的 SinglePostAnalysisPanel 取代，保留作为纯视觉预览。
 * 3 列布局：黑色页面背景 / VideoStage + CommentsPanel / MockSidebarShell。
 */
export function MockVideoExperience() {
  const [currentPostId, setCurrentPostId] = useState<string>(MOCK_POSTS[0].id);
  const [sidebarTab, setSidebarTab] = useState<SidebarTabId>("single-post");
  const [subTab, setSubTab] = useState<AnalysisSubTab>("analysis");
  const [tokensUsed, setTokensUsed] = useState<number>(INITIAL_TOKENS_USED);
  const [unlockedExtra, setUnlockedExtra] = useState<Record<string, MockFeatureId[]>>({});
  const [pendingUnlock, setPendingUnlock] = useState<MockFeatureId | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const currentPost = useMemo(() => {
    const base = MOCK_POSTS.find((p) => p.id === currentPostId) ?? MOCK_POSTS[0];
    const extra = unlockedExtra[base.id] ?? [];
    if (extra.length === 0) return base;
    const merged = Array.from(new Set([...base.unlocked, ...extra]));
    return { ...base, unlocked: merged };
  }, [currentPostId, unlockedExtra]);

  const remaining = Math.max(0, TOTAL_TOKENS_PER_MONTH - tokensUsed);

  const handleRequestUnlock = useCallback((featureId: MockFeatureId) => {
    setPendingUnlock(featureId);
  }, []);

  const handleConfirmUnlock = useCallback(() => {
    if (!pendingUnlock) return;
    const cost = FEATURE_COST[pendingUnlock];
    setTokensUsed((t) => Math.min(TOTAL_TOKENS_PER_MONTH, t + cost));
    setUnlockedExtra((prev) => {
      const cur = prev[currentPostId] ?? [];
      if (cur.includes(pendingUnlock)) return prev;
      return { ...prev, [currentPostId]: [...cur, pendingUnlock] };
    });
    setToast(`已解锁「${FEATURE_LABEL[pendingUnlock]}」`);
    setPendingUnlock(null);
  }, [pendingUnlock, currentPostId]);

  const handleSwitchPost = useCallback(
    (postId: string) => {
      if (postId === currentPostId) return;
      setCurrentPostId(postId);
      setToast(`已切换到 ${MOCK_POSTS.find((p) => p.id === postId)?.handle ?? postId}`);
    },
    [currentPostId],
  );

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0a0a0a]">
      <div className="flex flex-1 items-center justify-center px-6 py-6">
        <div className="flex gap-0">
          <div className="relative">
            <div className="absolute top-3 left-1/2 z-20 -translate-x-1/2">
              <PostSwitcher
                posts={MOCK_POSTS}
                currentId={currentPostId}
                onSwitch={handleSwitchPost}
              />
            </div>
            <div
              className="relative w-[400px] overflow-hidden rounded-l-[8px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
              style={{ aspectRatio: "9 / 16" }}
            >
              <VideoStage />
              <div className="pointer-events-none absolute bottom-20 left-4 z-10 max-w-[70%] text-[11.5px] leading-[1.45] text-white/80">
                {currentPost.overlay}
              </div>
            </div>
          </div>
          <div className="h-[711px] overflow-hidden rounded-r-[8px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
            <CommentsPanel />
          </div>
        </div>
      </div>

      <div className="flex-shrink-0">
        <MockSidebarShell activeTab={sidebarTab} onSelectTab={setSidebarTab}>
          {sidebarTab === "single-post" ? (
            <SinglePostAnalysisView
              post={currentPost}
              tokensUsed={tokensUsed}
              onRequestUnlock={handleRequestUnlock}
              subTab={subTab}
              onSubTabChange={setSubTab}
              onOpenTracking={() => setToast("投放追踪：请在插件内打开使用")}
            />
          ) : (
            <MockOtherTabPlaceholder label={labelForTab(sidebarTab)} />
          )}
        </MockSidebarShell>
      </div>

      <UnlockConfirmModal
        open={pendingUnlock !== null}
        featureLabel={pendingUnlock ? FEATURE_LABEL[pendingUnlock] : null}
        cost={pendingUnlock ? FEATURE_COST[pendingUnlock] : 0}
        remaining={remaining}
        onCancel={() => setPendingUnlock(null)}
        onConfirm={handleConfirmUnlock}
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

function labelForTab(tab: SidebarTabId): string {
  if (tab === "similar") return "找相似";
  if (tab === "current") return "博主分析";
  if (tab === "email") return "邮件建联";
  if (tab === "quick") return "预览设置";
  return "单帖 AI 分析";
}
