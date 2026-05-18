"use client";

// 博主发现卡片 —— 6 信息区结构(2026-05 发现页重构讨论):
//   A 身份   → 头像 / handle / 达人类型
//   B 量级   → 粉丝 / 均播 / ER          —— ContactabilityBar
//   C 维度关系→ 维度专属主指标 + 推荐理由 —— CardDimensionMetric(随维度变)
//   D 内容证据→ 近期作品样本             —— ContentSampleStrip
//   E 建联   → 邮箱状态分档             —— ContactabilityBar
//   F 风险   → risks[0]
// 卡片是「决策卡」不是「档案页」—— 首屏只放决定收藏/跳过所需的最小集合,
// 完整受众画像 / 历史样本 / 报价进点开后的详情。

import { motion } from "framer-motion";
import { ChevronDown, Heart, MailCheck, MailWarning, X } from "lucide-react";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { OutputCreatorView } from "../v3-view-models";
import { CardDimensionMetric, ContentSampleStrip, dimensionBadge } from "./card-dimension-metric";

const BRAND = "#ff4f00";

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
  /** "根据此博主找相似"：把这位 creator 追加到 session 的种子池。 */
  onFindSimilar?: (creator: OutputCreatorView) => void;
  /** 这位 creator 自己已经在种子池里时为 true。 */
  isSeed?: boolean;
}

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

// 右上角主指标徽章 —— 维度专属数字(复刻置信度 / 场景适配度 / 最高播放 / 爆发倍数)。
function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="shrink-0 rounded-md px-2 py-1 text-right"
      style={{ backgroundColor: "rgba(255,79,0,0.1)" }}
      title={label}
    >
      <div
        className="text-[15px] leading-none font-extrabold tabular-nums"
        style={{ color: BRAND }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[9px] leading-none font-medium text-[#939084]">{label}</div>
    </div>
  );
}

// Zone B + E —— 量级(粉丝/均播/ER)+ 建联(邮箱分档)。
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
      <span className="tabular-nums">均播 {compactNum(creator.medianViews)}</span>
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
  const badge = dimensionBadge(creator.dimensionData);
  const extraReasons = creator.reasons.slice(1);

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
        {/* Zone A —— 身份 + 主指标徽章 */}
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
                {creator.creatorType ? (
                  <span className="mt-1 inline-flex items-center rounded-full bg-[#f1efe9] px-2 py-0.5 text-[11px] font-medium text-[#5d5a52]">
                    {creator.creatorType}
                  </span>
                ) : null}
              </Button>
              <MetricBadge label={badge.label} value={badge.value} />
            </div>
          </div>
        </header>

        {/* 具体推荐理由 —— 人话,不是抽象打勾 */}
        {creator.reasons[0] ? (
          <p className="mt-2.5 text-[12px] leading-relaxed text-[#5d5a52]">{creator.reasons[0]}</p>
        ) : null}

        {/* Zone C —— 维度关系(随维度变) */}
        <CardDimensionMetric creator={creator} />

        {/* Zone D —— 内容证据 */}
        <ContentSampleStrip samples={creator.contentSamples} />

        {/* Zone F —— 风险。mt-auto 把这一行钉到底部,保证多卡片对齐 */}
        <p
          className="mt-auto flex items-start gap-1.5 pt-4 text-[12px] leading-relaxed text-zinc-500"
          style={{ minHeight: "calc(2 * 1.55em + 1rem)" }}
        >
          <span aria-hidden>💡</span>
          <span className="line-clamp-2">{topRisk ?? "无明显风险，可按标准 brief 推进"}</span>
        </p>

        {/* Zone B + E —— 量级 + 建联 */}
        <div className="mt-3 border-t border-zinc-100 pt-3">
          <ContactabilityBar creator={creator} />
        </div>

        {/* 匹配依据折叠区 —— 组上下文 + 其余推荐理由 */}
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
                {extraReasons.length > 0 ? (
                  <ul className="space-y-1">
                    {extraReasons.map((r) => (
                      <li key={r} className="text-[#5d5a52]">
                        · {r}
                      </li>
                    ))}
                  </ul>
                ) : null}
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

      {/* Action bar —— NO / 找相似 / 收藏 三键(缺省 onFindSimilar 退化为双键)。 */}
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
