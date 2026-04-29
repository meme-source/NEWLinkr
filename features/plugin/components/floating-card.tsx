"use client";

import { useEffect, useState, type RefObject } from "react";
import { Activity, Check, ChevronDown, CircleHelp, Copy, DollarSign, ExternalLink, FileText, Heart, Mail, MessageCircle, Moon, Play, Search, ThumbsUp, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { FloatingStatCell } from "@/features/plugin/components/floating-stat-cell";
import { SidebarCreatorTypeTag } from "@/features/plugin/components/sidebar-creator-type-tag";
import { SidebarLocationInline } from "@/features/plugin/components/sidebar-location-inline";
import { formatComments, formatLikes, parseMetricToNumber } from "@/features/plugin/lib/synthetic";
import {
  getCreatorContactEmail,
  getCreatorLocation,
  getCreatorMetricSnapshot,
  getCreatorType,
} from "@/features/plugin/lib/creator-helpers";
import { DEFAULT_HOVER_METRICS, SCRAPE_COUNT_OPTIONS } from "@/features/plugin/data/sidebar-config";
import type { CreatorProfile, HoverMetricKey, MetricAggregation, ReviewFlow } from "@/features/plugin/types";

export function FloatingCard({
  closeButtonRef,
  onOpenCurrentSidebar,
  onOpenEmailSidebar,
  onOpenSimilarSidebar,
  onClose,
  onDragStart,
  compactViewport,
  creator,
  reviewFlow,
  sequentialIndex,
  sequentialTotal,
  onSeedCreator,
  isSaved,
  onToggleSave,
  workMode,
  onSetWorkMode,
  onOpenTaskList,
  dataCheckOn,
  onToggleDataCheck,
  scrapeCount,
  onChangeScrapeCount,
  selectedHoverMetricKeys,
  hoverMetricModes,
}: {
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onOpenCurrentSidebar: () => void;
  onOpenEmailSidebar: () => void;
  onOpenSimilarSidebar: () => void;
  onClose: () => void;
  onDragStart: (clientX: number, clientY: number) => void;
  compactViewport: boolean;
  creator: CreatorProfile;
  reviewFlow: ReviewFlow;
  sequentialIndex: number;
  sequentialTotal: number;
  onSeedCreator: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  workMode: "on" | "off";
  onSetWorkMode: (mode: "on" | "off") => void;
  onOpenTaskList: () => void;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  selectedHoverMetricKeys: HoverMetricKey[];
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
}) {
  const [copied, setCopied] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editableEmail, setEditableEmail] = useState("");
  const [scrapeMenuOpen, setScrapeMenuOpen] = useState(false);
  const contactEmail = getCreatorContactEmail(creator);
  const creatorLocation = getCreatorLocation(creator);
  const creatorMetrics = getCreatorMetricSnapshot(creator, scrapeCount);
  const creatorCpm = creatorMetrics.cpm;
  const displayEmail = editableEmail.trim();
  const hasEmail = Boolean(displayEmail);

  useEffect(() => {
    setEditableEmail(contactEmail ?? "");
    setIsEditingEmail(false);
    setCopied(false);
  }, [contactEmail, creator.id]);

  const copyEmail = () => {
    if (!displayEmail || isEditingEmail) return;
    navigator.clipboard.writeText(displayEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleFinishEmailEdit = () => {
    setEditableEmail((current) => current.trim());
    setIsEditingEmail(false);
    setCopied(false);
  };

  const handleCancelEmailEdit = () => {
    setEditableEmail(contactEmail ?? "");
    setIsEditingEmail(false);
  };

  const handleStartEmailEdit = () => {
    setEditableEmail(displayEmail);
    setIsEditingEmail(true);
    setCopied(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="当前博主速览小窗"
      className={cn(
        "absolute top-1/2 z-20 -translate-y-1/2 rounded-[28px] border border-[#e8e6dc] bg-[#faf9f5]/98 text-[#141413] shadow-[0_28px_80px_-34px_rgba(77,76,72,0.22)] backdrop-blur",
        compactViewport
          ? "right-[42px] w-[min(286px,calc(100vw-164px))] max-w-[286px]"
          : "right-[52px] w-[min(352px,calc(100vw-120px))] max-w-[352px]"
      )}
    >
      <div
        className="flex cursor-grab touch-none justify-center pb-1 pt-1.5 active:cursor-grabbing select-none"
        onPointerDown={(event) => {
          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          onDragStart(event.clientX, event.clientY);
        }}
      >
        <span
          aria-hidden="true"
          className="block h-1.5 w-11 rounded-full bg-[#ddd8ce]"
        />
      </div>

      <div className="px-3 pb-3 pt-1">
        {reviewFlow === "sequential" && sequentialTotal > 0 ? (
          <div className="mb-2 rounded-full bg-[#f5f4ed] px-3 py-1.5 text-center text-[11px] text-[#87867f]">
            逐个筛选中：第 {Math.max(sequentialIndex + 1, 1)} / {sequentialTotal} 位
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="group relative">
              <button
                type="button"
                aria-label="跳转到 web 页面"
                onClick={onOpenTaskList}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e6dc] bg-white text-[#87867f] transition-all hover:border-[#d1cfc5] hover:bg-[#f5f4ed] hover:text-[#4d4c48]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <span className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[10px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                跳转到 web 端任务页
              </span>
            </div>

            <div className="flex items-center gap-1">
              <div className="group relative">
                <button
                  type="button"
                  aria-label="打开下班模式"
                  onClick={() => onSetWorkMode("off")}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#87867f] transition-all hover:bg-white hover:text-[#4d4c48]"
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
                <span className="pointer-events-none absolute right-0 top-full z-30 mt-1.5 w-44 rounded-[10px] bg-[#141413] px-2.5 py-2 text-[10px] leading-4 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  打开下班模式后，插件将关闭。点击悬浮球可恢复上班模式。
                </span>
              </div>

              <button
                type="button"
                ref={closeButtonRef}
                aria-label="关闭小窗"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#9ca3af] transition-colors hover:bg-white hover:text-[#141413]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className={cn("flex items-center", compactViewport ? "gap-2" : "gap-3")}>
            <div className="shrink-0">
              <CreatorAvatar creator={creator} className="h-12 w-12" labelClassName="text-base" />
            </div>
            <div className="min-w-0 flex min-h-[48px] flex-1 flex-col justify-center gap-0.5">
              <div className={cn("flex min-w-0 items-center", compactViewport ? "gap-1" : "gap-1.5")}>
                <SidebarLocationInline
                  flag={creatorLocation.flag}
                  country={creatorLocation.country}
                  compact={compactViewport}
                />

                <SidebarCreatorTypeTag type={getCreatorType(creator)} compact={compactViewport} />

                <button
                  type="button"
                  aria-label={isSaved ? `取消收藏 ${creator.name}` : `收藏 ${creator.name}`}
                  aria-pressed={isSaved}
                  onClick={onToggleSave}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent transition-all duration-150 active:scale-[0.88]",
                    compactViewport ? "h-[22px] w-[22px]" : "h-6 w-6",
                    isSaved
                      ? "border-[#f0d7cd] bg-[#fff7f4] text-[#c96442] shadow-[0_4px_10px_rgba(201,100,66,0.16)]"
                      : "text-[#b0aea6] hover:border-[#ece7dc] hover:bg-white hover:text-[#c96442]"
                  )}
                >
                  <Heart className={cn(compactViewport ? "h-3.5 w-3.5" : "h-4 w-4", isSaved && "fill-current")} />
                </button>
              </div>

              <div className={cn("flex min-w-0 items-center", compactViewport ? "gap-1" : "gap-1.5")}>
                <div className="min-w-0 flex flex-1 items-center">
                  {isEditingEmail ? (
                    <input
                      autoFocus
                      value={editableEmail}
                      onChange={(event) => setEditableEmail(event.target.value)}
                      onBlur={handleFinishEmailEdit}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleFinishEmailEdit();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          handleCancelEmailEdit();
                        }
                      }}
                      placeholder="输入邮箱地址"
                      className="h-[26px] min-w-0 flex-1 rounded-[13px] border border-[#e8e6dc] bg-white px-[9px] text-[11px] font-medium text-[#141413] outline-none transition-colors focus:border-[#c96442]/35"
                    />
                  ) : (
                    <button
                      type="button"
                      aria-label={hasEmail ? "复制邮箱" : "暂无邮箱，双击添加邮箱"}
                      title={hasEmail ? "点击复制邮箱" : "双击添加邮箱"}
                      onClick={() => {
                        if (hasEmail) {
                          copyEmail();
                        }
                      }}
                      onDoubleClick={() => {
                        if (!hasEmail) {
                          handleStartEmailEdit();
                        }
                      }}
                      onKeyDown={(event) => {
                        if (!hasEmail && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          handleStartEmailEdit();
                        }
                      }}
                      className={cn(
                        "flex h-[26px] min-w-0 flex-1 items-center gap-1.5 rounded-[13px] px-[9px] text-[11px] transition-all select-none",
                        copied
                          ? "bg-emerald-50"
                          : hasEmail
                            ? "bg-[#f0ece4]"
                            : "bg-[#f5f4ed]",
                        hasEmail ? "cursor-pointer hover:bg-[#e8e3d8]" : "cursor-text"
                      )}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                      ) : (
                        <Copy className={cn("h-3.5 w-3.5 shrink-0", hasEmail ? "text-[#87867f]" : "text-[#bcb7ad]")} />
                      )}
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate font-medium",
                          copied
                            ? "text-emerald-700"
                            : hasEmail
                              ? "text-[#4d4c48]"
                              : "text-[#a39f95]"
                        )}
                      >
                        {copied ? "已复制" : hasEmail ? displayEmail : "双击添加邮箱"}
                      </span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  aria-label="建联"
                  onClick={onOpenEmailSidebar}
                  className="inline-flex h-[26px] shrink-0 items-center justify-center rounded-[13px] border border-[#e8e6dc] bg-white px-[9px] text-[11px] font-semibold text-[#4d4c48] transition-all hover:border-[#d1cfc5] hover:bg-[#f5f4ed] active:scale-[0.97] active:bg-[#ede9e0]"
                >
                  <Mail className="mr-1 h-4 w-4 text-[#87867f]" />
                  建联
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[#e8e6dc] bg-white">
            <div
              className={cn(
                "flex flex-wrap items-center justify-between",
                compactViewport ? "gap-2 px-2.5 py-2" : "gap-2.5 px-3 py-2.5"
              )}
            >
              <div className={cn("flex items-center", compactViewport ? "gap-1" : "gap-1.5")}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setScrapeMenuOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={scrapeMenuOpen}
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full border border-[#e8e6dc] bg-[#faf9f5] font-semibold text-[#4d4c48] transition-all hover:border-[#d1cfc5] hover:bg-[#f0ece4]",
                      compactViewport ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
                    )}
                  >
                    <span>最近 {scrapeCount} 条</span>
                    <ChevronDown className={cn("h-3 w-3 text-[#87867f] transition-transform", scrapeMenuOpen && "rotate-180")} />
                  </button>
                  {scrapeMenuOpen ? (
                    <div
                      role="listbox"
                      className="absolute left-0 top-full z-30 mt-1 w-[108px] overflow-hidden rounded-[14px] border border-[#e8e6dc] bg-white shadow-[0_16px_40px_-20px_rgba(77,76,72,0.25)]"
                    >
                      {SCRAPE_COUNT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          role="option"
                          aria-selected={opt === scrapeCount}
                          onClick={() => {
                            onChangeScrapeCount(opt);
                            setScrapeMenuOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] transition-colors hover:bg-[#f5f4ed]",
                            opt === scrapeCount ? "font-semibold text-[#c96442]" : "text-[#4d4c48]"
                          )}
                        >
                          <span>最近 {opt} 条</span>
                          {opt === scrapeCount ? <Check className="h-3 w-3" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <span className="group/cpm relative inline-flex shrink-0">
                  <span
                    aria-label={`CPM ${creatorCpm}，悬浮查看说明`}
                    className={cn(
                      "inline-flex items-center rounded-full border border-[#e8e6dc] bg-[#f5f4ed] font-semibold text-[#c96442]",
                      compactViewport ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
                    )}
                  >
                    CPM {creatorCpm}
                  </span>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-1/2 top-full z-40 mt-1.5 w-60 -translate-x-1/2 rounded-[10px] border border-[#e8e6dc] bg-white px-2.5 py-2 text-[11px] leading-[1.55] text-[#4d4c48] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover/cpm:opacity-100"
                  >
                    系统检测该博主位于{creatorLocation.country}，当前该地区默认 CPM 为 {creatorCpm}。如需修改，请前往设置页面自行调整。
                  </span>
                </span>
              </div>

              <div className={cn("flex shrink-0 items-center", compactViewport ? "gap-0.5" : "gap-1")}>
                <div
                  className={cn(
                    "flex items-center font-medium text-[#87867f]",
                    compactViewport ? "gap-0.5 text-[10px]" : "gap-1 text-[11px]"
                  )}
                >
                  <span>数据透视</span>
                  <span className="group/tip relative inline-flex">
                    <CircleHelp className="h-3.5 w-3.5 cursor-help text-[#b8b6ad] transition-colors hover:text-[#87867f]" />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute right-0 top-full z-40 mt-1.5 w-56 rounded-[10px] border border-[#e8e6dc] bg-white px-2.5 py-2 text-[11px] leading-[1.55] text-[#4d4c48] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover/tip:opacity-100"
                    >
                      在当前页面开启数据透视后，会叠加播放量、平均播放与互动率数据，并按平均播放量排序前 N 条视频。若取数异常，刷新网页即可。
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dataCheckOn}
                  aria-label="数据透视开关"
                  onClick={onToggleDataCheck}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    dataCheckOn ? "bg-[#c96442]" : "bg-[#d8d4c8]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      dataCheckOn && "translate-x-4"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="border-t border-[#e8e6dc]" />

            <div className="grid grid-cols-2">
              {(selectedHoverMetricKeys.length ? selectedHoverMetricKeys : DEFAULT_HOVER_METRICS).map((key, index) => {
                const showBorderRight = index % 2 === 0;
                const showBorderTop = index >= 2;
                if (key === "rate") {
                  return (
                    <FloatingStatCell
                      key={key}
                      icon={DollarSign}
                      iconClassName="text-emerald-500"
                      label="预估报价"
                      value={creatorMetrics.rate}
                      borderRight={showBorderRight}
                      borderTop={showBorderTop}
                    />
                  );
                }
                if (key === "likes") {
                  return (
                    <FloatingStatCell
                      key={key}
                      icon={ThumbsUp}
                      iconClassName="text-rose-500"
                      label={hoverMetricModes.likes === "median" ? "中位点赞" : "平均点赞"}
                      value={hoverMetricModes.likes === "median" ? creatorMetrics.medianLikes : formatLikes(parseMetricToNumber(creator.likes) * 1.08)}
                      borderRight={showBorderRight}
                      borderTop={showBorderTop}
                    />
                  );
                }
                if (key === "plays") {
                  return (
                    <FloatingStatCell
                      key={key}
                      icon={Play}
                      iconClassName="text-[#3b82f6]"
                      label={(hoverMetricModes.plays ?? "median") === "median" ? "中位观看量" : "平均观看量"}
                      value={(hoverMetricModes.plays ?? "median") === "median" ? creatorMetrics.medianPlays : creatorMetrics.averagePlays}
                      borderRight={showBorderRight}
                      borderTop={showBorderTop}
                    />
                  );
                }
                if (key === "comments") {
                  return (
                    <FloatingStatCell
                      key={key}
                      icon={MessageCircle}
                      iconClassName="text-[#f59e0b]"
                      label={hoverMetricModes.comments === "median" ? "中位评论" : "平均评论"}
                      value={hoverMetricModes.comments === "median" ? creatorMetrics.medianComments : formatComments(parseMetricToNumber(creatorMetrics.medianComments) * 1.16)}
                      borderRight={showBorderRight}
                      borderTop={showBorderTop}
                    />
                  );
                }
                return (
                  <FloatingStatCell
                    key={key}
                    icon={Activity}
                    iconClassName="text-violet-500"
                    label="互动率"
                    value={creatorMetrics.engagementRate}
                    borderRight={showBorderRight}
                    borderTop={showBorderTop}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCurrentSidebar}
              className="inline-flex flex-1 items-center justify-center rounded-[18px] border border-[#e8e6dc] bg-white px-2.5 py-2 text-[11px] font-semibold text-[#4d4c48] transition-all hover:border-[#d1cfc5] hover:bg-[#f5f4ed] active:scale-[0.97] active:bg-[#ede9e0]"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5 text-[#87867f]" />
              博主分析
            </button>
            <button
              type="button"
              aria-label="找相似"
              onClick={onOpenSimilarSidebar}
              className="inline-flex flex-1 items-center justify-center rounded-[18px] border border-[#c96442]/35 bg-[#c96442] px-2.5 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_-14px_rgba(201,100,66,0.55)] transition-all hover:bg-[#b8573a] active:scale-[0.97]"
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              找相似
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



