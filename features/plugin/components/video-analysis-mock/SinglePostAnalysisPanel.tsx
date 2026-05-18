"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FEATURE_COST,
  FEATURE_LABEL,
  INITIAL_HISTORY,
  INITIAL_TOKENS_USED,
  MOCK_POSTS,
  TOTAL_TOKENS_PER_MONTH,
  type MockFeatureId,
  type UnlockHistoryEntry,
} from "./mock-posts";
import { SinglePostAnalysisView, type AnalysisSubTab } from "./SinglePostAnalysisView";
import { UnlockConfirmModal } from "./UnlockConfirmModal";

/**
 * SinglePostAnalysisPanel —— 把「单帖 AI 分析」接进真实插件 sidebar 的容器。
 *
 * SidebarShell 在 activeSidebarTab === "single-post" 时直接渲染本组件，
 * 占满 sidebar 内容列。组件自持全部 mock 状态（token / 解锁 / 历史 / modal /
 * toast），不依赖 SidebarShell 透传任何 prop。
 *
 * 与已废弃的 MockVideoExperience 的差别：那个根组件还要画左侧视频 + 评论区 +
 * PostSwitcher，因为它是独立 /mock-video 预览页；接进真实 sidebar 后视频在
 * 浏览器页面本身，sidebar 只负责分析面板，所以这里只保留状态编排。
 *
 * 切帖：生产化时浏览器扩展用 DOM detection 识别当前 TikTok 帖子（handoff §13）。
 * mock 阶段默认分析 MOCK_POSTS[0]，另一条帖子可通过「历史记录」子 tab 的条目
 * 点进去（handoff Q6：点历史条目会切到对应帖子）。
 */
export function SinglePostAnalysisPanel() {
  const [currentPostId, setCurrentPostId] = useState<string>(MOCK_POSTS[0].id);
  const [subTab, setSubTab] = useState<AnalysisSubTab>("current");
  const [tokensUsed, setTokensUsed] = useState<number>(INITIAL_TOKENS_USED);
  const [unlockedExtra, setUnlockedExtra] = useState<Record<string, MockFeatureId[]>>({});
  const [pendingUnlock, setPendingUnlock] = useState<MockFeatureId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<UnlockHistoryEntry[]>(INITIAL_HISTORY);
  const [forceExpandFeatureId, setForceExpandFeatureId] = useState<MockFeatureId | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  // 合并 fixture + session 解锁项 —— 传给 SinglePostAnalysisView 的 post.unlocked。
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
    // 压一条新历史 —— 跨帖也走它，用户能在「历史记录」tab 看到这次解锁。
    const post = MOCK_POSTS.find((p) => p.id === currentPostId);
    if (post) {
      setHistory((prev) => [
        {
          id: `hist-${Date.now()}`,
          postId: post.id,
          postHandle: post.handle,
          postCaption: post.caption,
          featureId: pendingUnlock,
          cost,
          unlockedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setToast(`已解锁「${FEATURE_LABEL[pendingUnlock]}」`);
    setPendingUnlock(null);
  }, [pendingUnlock, currentPostId]);

  // 用户在「历史记录」tab 点条目 —— 切到那条帖 + 回到「当前帖」子 tab + 自动展开 accordion。
  const handleHistoryItemClick = useCallback((entry: UnlockHistoryEntry) => {
    setCurrentPostId(entry.postId);
    setSubTab("current");
    setForceExpandFeatureId(entry.featureId);
    setToast(`已切换到 ${entry.postHandle} · ${FEATURE_LABEL[entry.featureId]}`);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SinglePostAnalysisView
        post={currentPost}
        tokensUsed={tokensUsed}
        onRequestUnlock={handleRequestUnlock}
        subTab={subTab}
        onSubTabChange={setSubTab}
        history={history}
        onHistoryItemClick={handleHistoryItemClick}
        forceExpandFeatureId={forceExpandFeatureId}
        onForceExpandConsumed={() => setForceExpandFeatureId(null)}
      />

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
