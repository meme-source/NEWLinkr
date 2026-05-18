"use client";

// v3 §4.7 卡片首屏。和 v2 的 CompositeCreatorCard 是并存关系（v2 卡片仍在
// 旧入口下使用），等数据源全切到 FeatureGroupView 后再删 CompositeCreatorCard。
//
// 这张卡跟 v2 的核心差异：
//   - 顶右角的 ER 角标改成「特征匹配度 NN」
//   - 中段不再展示 3 张视频砖 + 单条 reason，而是 4 个 matched-feature 徽章
//   - 多一行 ContactabilityBar（粉丝 / 中位播放 / ER / 邮箱状态 / 可建联）
//   - 风险行保留，但取自 OutputCreatorView.risks[0]
//   - 底部 NO / 收藏 按钮形态完全沿用 v2，避免引入第二套交互习惯

import { motion } from "framer-motion";
import { ChevronDown, Check, Heart, MailCheck, MailWarning, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MATCHED_FEATURE_LABELS, listHitFeatures, type OutputCreatorView } from "../v3-view-models";

const BRAND = "#ff4f00";

// v3 §4.8：详情页"匹配组合分析 + 参考依据"在 mock 阶段下沉为卡片内嵌
// 折叠区。groupContext 由所属 FeatureGroup 注入，包含组名与脱敏的 rationale。
// 完整版（独立抽屉 + 历史样本 + 基线对照）等真后端 API 接通后再做。
export interface OutputCreatorCardGroupContext {
  groupName: string;
  rationale: string;
}

interface Props {
  creator: OutputCreatorView;
  status: "pending" | "saved" | "skipped";
  onSave: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenProfile: (creator: OutputCreatorView) => void;
  groupContext?: OutputCreatorCardGroupContext;
  /** "根据此博主找相似"：把这位 creator 追加到 session 的种子池。空表示不支持
   * 找相似入口（例如纯 intake 流程下不出找相似）。 */
  onFindSimilar?: (creator: OutputCreatorView) => void;
  /** 这位 creator 自己已经在种子池里时为 true —— 找相似按钮变成禁用状态，
   * 视觉上提示用户"你已经在 seed 这一位了"。 */
  isSeed?: boolean;
}

// 给 ContactabilityBar 用的数字格式化 —— 把 89000 渲染成 "89K"。
function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function MatchedFeatureRow({ creator }: { creator: OutputCreatorView }) {
  const axes = Object.keys(MATCHED_FEATURE_LABELS) as Array<keyof typeof MATCHED_FEATURE_LABELS>;
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
      {axes.map((axis) => {
        const hit = creator.matchedFeatures[axis];
        return (
          <li
            key={axis}
            className="flex items-center gap-1.5 text-[12.5px] leading-tight"
            style={{ color: hit ? "#201515" : "#b8b4a8" }}
          >
            <span
              aria-hidden
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: hit ? BRAND : "#f1efe9",
                color: hit ? "white" : "#b8b4a8",
              }}
            >
              {hit ? <Check size={10} strokeWidth={3} /> : <X size={9} strokeWidth={2.4} />}
            </span>
            {MATCHED_FEATURE_LABELS[axis]}
          </li>
        );
      })}
    </ul>
  );
}

function ContactabilityBar({ creator }: { creator: OutputCreatorView }) {
  const emailNode =
    creator.emailStatus === "verified" ? (
      <span className="inline-flex items-center gap-0.5" title="邮箱已验证">
        <MailCheck size={11} strokeWidth={2.2} style={{ color: "#3d8a5a" }} />
        邮箱 ✓
      </span>
    ) : creator.emailStatus === "found" ? (
      <span className="inline-flex items-center gap-0.5" title="找到邮箱但尚未验证">
        <MailWarning size={11} strokeWidth={2.2} style={{ color: "#c98a45" }} />
        邮箱待验
      </span>
    ) : (
      <span className="inline-flex items-center gap-0.5" title="未找到联系方式">
        <MailWarning size={11} strokeWidth={2.2} style={{ color: "#b8b4a8" }} />
        无邮箱
      </span>
    );

  const erText = creator.engagementRate > 0 ? `ER ${creator.engagementRate.toFixed(1)}%` : "ER —";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#5d5a52]">
      <span className="tabular-nums">粉丝 {compactNum(creator.followers)}</span>
      <span className="tabular-nums">中播 {compactNum(creator.medianViews)}</span>
      <span className="tabular-nums" style={{ color: BRAND, fontWeight: 600 }}>
        {erText}
      </span>
      {emailNode}
    </div>
  );
}

export function OutputCreatorCard({
  creator,
  status,
  onSave,
  onSkip,
  onOpenProfile,
  groupContext,
  onFindSimilar,
  isSeed = false,
}: Props) {
  const isSaved = status === "saved";
  const isSkipped = status === "skipped";
  const topRisk = creator.risks[0];
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hitFeatures = listHitFeatures(creator.matchedFeatures);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isSkipped ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
      className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_36px_-12px_rgba(0,0,0,0.12)]"
    >
      <div className="flex flex-1 flex-col px-5 pt-5 pb-4">
        {/* Header — avatar + handle + feature_match_score 角标 */}
        <header className="flex items-start gap-3">
          <Button
            unstyled
            type="button"
            onClick={() => onOpenProfile(creator)}
            className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]"
            style={{ ["--brand" as string]: BRAND }}
            aria-label={`查看 ${creator.handle} 资料`}
          >
            {creator.avatarUrl ? (
              <Image
                src={creator.avatarUrl}
                alt={creator.handle}
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#f1efe9] text-[14px] font-semibold text-[#5d5a52]">
                {creator.handle.slice(1, 3).toUpperCase()}
              </div>
            )}
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <Button
                unstyled
                type="button"
                onClick={() => onOpenProfile(creator)}
                className="-m-1 min-w-0 flex-1 rounded-md p-1 text-left transition-colors hover:bg-zinc-50 focus:outline-none"
              >
                <h3 className="truncate text-[16px] leading-tight font-bold tracking-tight text-zinc-900">
                  {creator.handle}
                </h3>
                <div className="mt-0.5 truncate text-[11.5px] font-normal text-zinc-400">
                  {creator.reasons[0] ?? "AI 推荐"}
                </div>
              </Button>
              <div
                className="rounded-md px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap tabular-nums"
                style={{ backgroundColor: "rgba(255,79,0,0.1)", color: BRAND }}
                title="特征匹配度（0-100）"
              >
                匹配度 {creator.featureMatchScore}
              </div>
            </div>
          </div>
        </header>

        {/* Matched features — 4 个轴是否命中 */}
        <div className="mt-4 rounded-lg bg-[#fafaf6] p-3">
          <div className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-[#939084] uppercase">
            匹配到的特征
          </div>
          <MatchedFeatureRow creator={creator} />
        </div>

        {/* Risks / brief 引导 —— mt-auto 把这一行钉到底部，保证多卡片对齐 */}
        <p
          className="mt-auto flex items-start gap-1.5 pt-4 text-[12px] leading-relaxed text-zinc-500"
          style={{ minHeight: "calc(2 * 1.55em + 1rem)" }}
        >
          <span aria-hidden>💡</span>
          <span className="line-clamp-2">{topRisk ?? "无明显风险，可按标准 brief 推进"}</span>
        </p>

        {/* Contactability bar —— 粉丝 / 中播 / ER / 邮箱状态 */}
        <div className="mt-3 border-t border-zinc-100 pt-3">
          <ContactabilityBar creator={creator} />
        </div>

        {/* v3 §4.8 详情下沉版 —— 卡片内嵌折叠的匹配依据。groupContext 缺失
            时按钮不出，避免空内容。 */}
        {groupContext ? (
          <div className="mt-3 border-t border-zinc-100 pt-2">
            <Button
              unstyled
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              aria-expanded={detailsOpen}
              className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-[11.5px] font-medium text-[#5d5a52] transition-colors hover:text-[color:var(--brand)]"
              style={{ ["--brand" as string]: BRAND }}
            >
              <span>查看匹配依据</span>
              <ChevronDown
                size={12}
                strokeWidth={2.4}
                className="transition-transform"
                style={{ transform: detailsOpen ? "rotate(180deg)" : undefined }}
              />
            </Button>
            {detailsOpen ? (
              <div className="mt-2 space-y-2 rounded-md bg-[#fafaf6] p-3 text-[11.5px] leading-relaxed text-[#36342e]">
                <div>
                  <span className="text-[#939084]">所属组合 </span>
                  <span className="font-medium">{groupContext.groupName}</span>
                </div>
                <div className="text-[#5d5a52]">{groupContext.rationale}</div>
                <div>
                  <span className="text-[#939084]">命中特征轴 </span>
                  {hitFeatures.length === 0 ? (
                    <span className="text-[#b8b4a8]">无 — 按通用规则候选</span>
                  ) : (
                    <span className="font-medium">{hitFeatures.join(" / ")}</span>
                  )}
                </div>
                <Button
                  unstyled
                  type="button"
                  onClick={() => onOpenProfile(creator)}
                  className="mt-1 text-[11.5px] font-medium underline-offset-2 hover:underline"
                  style={{ color: BRAND }}
                >
                  打开完整资料 →
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Action bar —— NO / 找相似 / 收藏 三键形态。
          找相似在中间 —— 与 NO（左）+ 收藏（右）形成"否决 / 探索 / 接受"的三态语义。
          缺省 onFindSimilar 时退化为原来的 NO / 收藏 双键，保持向后兼容。 */}
      {onFindSimilar ? (
        <div className="grid grid-cols-3 border-t border-zinc-100">
          <Button
            unstyled
            type="button"
            onClick={() => onSkip(creator.creatorId)}
            className="group flex h-12 items-center justify-center gap-1 border-r border-zinc-100 text-[12.5px] font-semibold tracking-wide text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Skip"
          >
            <X size={13} strokeWidth={2.5} className="transition-transform group-hover:rotate-90" />
            {isSkipped ? "已跳过" : "NO"}
          </Button>
          <Button
            unstyled
            type="button"
            disabled={isSeed}
            onClick={() => onFindSimilar(creator)}
            className={
              isSeed
                ? "flex h-12 items-center justify-center gap-1 border-r border-zinc-100 text-[12.5px] font-semibold tracking-wide text-zinc-300"
                : "group flex h-12 items-center justify-center gap-1 border-r border-zinc-100 text-[12.5px] font-semibold tracking-wide text-zinc-500 transition-colors hover:bg-[rgba(255,79,0,0.06)] hover:text-[color:var(--brand)]"
            }
            style={{ ["--brand" as string]: BRAND }}
            aria-label={isSeed ? "已是相似来源" : "根据此博主找相似"}
            title={
              isSeed ? "这位博主已经在相似来源里" : "根据此博主找相似 —— 加入相似来源后会叠加推荐"
            }
          >
            <Sparkles
              size={13}
              strokeWidth={2.2}
              className="transition-transform group-hover:scale-110"
            />
            {isSeed ? "已加入" : "找相似"}
          </Button>
          <Button
            unstyled
            type="button"
            onClick={() => onSave(creator.creatorId)}
            className={
              isSaved
                ? "flex h-12 items-center justify-center gap-1 text-[12.5px] font-semibold tracking-wide text-white transition-colors"
                : "group flex h-12 items-center justify-center gap-1 text-[12.5px] font-semibold tracking-wide text-zinc-500 transition-colors hover:bg-[rgba(255,79,0,0.06)] hover:text-[color:var(--brand)]"
            }
            style={isSaved ? { backgroundColor: BRAND } : { ["--brand" as string]: BRAND }}
            aria-label={isSaved ? "已收藏" : "收藏"}
            aria-pressed={isSaved}
          >
            <Heart size={13} strokeWidth={2.2} fill={isSaved ? "white" : "none"} />
            {isSaved ? "已收藏" : "收藏"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 border-t border-zinc-100">
          <Button
            unstyled
            type="button"
            onClick={() => onSkip(creator.creatorId)}
            className="group flex h-12 items-center justify-center gap-1.5 border-r border-zinc-100 text-[13px] font-semibold tracking-wide text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Skip"
          >
            <X size={14} strokeWidth={2.5} className="transition-transform group-hover:rotate-90" />
            {isSkipped ? "已跳过" : "NO"}
          </Button>
          <Button
            unstyled
            type="button"
            onClick={() => onSave(creator.creatorId)}
            className={
              isSaved
                ? "flex h-12 items-center justify-center gap-1.5 text-[13px] font-semibold tracking-wide text-white transition-colors"
                : "group flex h-12 items-center justify-center gap-1.5 text-[13px] font-semibold tracking-wide text-zinc-500 transition-colors hover:bg-[rgba(255,79,0,0.06)] hover:text-[color:var(--brand)]"
            }
            style={isSaved ? { backgroundColor: BRAND } : { ["--brand" as string]: BRAND }}
            aria-label={isSaved ? "已收藏" : "收藏"}
            aria-pressed={isSaved}
          >
            <Heart size={14} strokeWidth={2.2} fill={isSaved ? "white" : "none"} />
            {isSaved ? "已收藏" : "收藏"}
          </Button>
        </div>
      )}
    </motion.article>
  );
}
