"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { FolderOpen, Info, Moon, Sun, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { FloatingCard } from "@/features/plugin/components/floating-card";
import type { CreatorProfile, DemoStage, HoverMetricKey, MetricAggregation, ReviewFlow } from "@/features/plugin/types";

type FloatingMenuAction = {
  id: "info" | "similar" | "tasks" | "mode";
  label: string;
  hint: string;
  icon: typeof Info;
  iconClass?: string;
  disabled?: boolean;
  onClick: () => void;
};

type FloatingMenuItem = FloatingMenuAction | { kind: "divider"; id: string };

export function FloatingPluginGroup({
  demoStage,
  cardCloseRef,
  onOpenCard,
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
  onToggleWorkMode,
  onSetWorkMode,
  onOpenTaskList,
  floatingTop,
  dataCheckOn,
  onToggleDataCheck,
  scrapeCount,
  onChangeScrapeCount,
  selectedHoverMetricKeys,
  hoverMetricModes,
}: {
  demoStage: DemoStage;
  cardCloseRef: RefObject<HTMLButtonElement | null>;
  onOpenCard: () => void;
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
  onToggleWorkMode: () => void;
  onSetWorkMode: (mode: "on" | "off") => void;
  onOpenTaskList: () => void;
  floatingTop: number;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  selectedHoverMetricKeys: HoverMetricKey[];
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuDirection, setMenuDirection] = useState<"down" | "up">("down");
  const [hoveredId, setHoveredId] = useState<FloatingMenuAction["id"] | null>(null);
  const [hoverCardOpen, setHoverCardOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragIntentRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  // Estimated menu footprint (4 icons stacked + gap + padding + safety).
  const MENU_ESTIMATED_HEIGHT = 220;
  const EDGE_BUFFER = 12;
  const isOff = workMode === "off";

  const closeFloatingUi = () => {
    setMenuOpen(false);
    setHoveredId(null);
    setHoverCardOpen(false);
  };

  const computeDirection = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom - EDGE_BUFFER;
    const spaceAbove = rect.top - EDGE_BUFFER;
    const fitsDown = spaceBelow >= MENU_ESTIMATED_HEIGHT;
    const fitsUp = spaceAbove >= MENU_ESTIMATED_HEIGHT;
    if (fitsDown) {
      setMenuDirection("down");
    } else if (fitsUp) {
      setMenuDirection("up");
    } else {
      // Neither side has full room — pick the larger one.
      setMenuDirection(spaceAbove > spaceBelow ? "up" : "down");
    }
  };

  const openMenu = () => {
    computeDirection();
    setMenuOpen(true);
  };

  const openHoverCard = () => {
    if (isOff || demoStage === "card") {
      return;
    }
    setHoveredId(null);
    setMenuOpen(false);
    setHoverCardOpen(true);
  };

  useEffect(() => {
    if (isOff || demoStage === "card") {
      setHoverCardOpen(false);
    }
  }, [demoStage, isOff]);

  // Recompute when floating ball moves vertically.
  useEffect(() => {
    if (menuOpen) computeDirection();

  }, [floatingTop, menuOpen]);

  const items: FloatingMenuItem[] = [
    {
      id: "info",
      label: "信息卡片",
      hint: "展开博主的报价、播放、点赞等关键数据速览。",
      icon: Info,
      iconClass: "text-emerald-600",
      disabled: isOff,
      onClick: () => {
        if (isOff) return;
        setMenuOpen(false);
        if (demoStage === "card") {
          onClose();
        } else {
          onOpenCard();
        }
      },
    },
    {
      id: "similar",
      label: "找相似",
      hint: "以当前博主为种子，在侧边栏拉出同类型达人名单。",
      icon: Users,
      iconClass: "text-[#3b82f6]",
      disabled: isOff,
      onClick: () => {
        if (isOff) return;
        setMenuOpen(false);
        onOpenSimilarSidebar();
      },
    },
    { kind: "divider", id: "divider-1" },
    {
      id: "tasks",
      label: "任务列表",
      hint: "打开网页端任务列表，继续查看当前项目的发送与跟进任务。",
      icon: FolderOpen,
      iconClass: "text-[#6b7280]",
      disabled: isOff,
      onClick: () => {
        if (isOff) return;
        setMenuOpen(false);
        onOpenTaskList();
      },
    },
    {
      id: "mode",
      label: isOff ? "切到上班模式" : "切到下班模式",
      hint: isOff
        ? "恢复常亮状态，Linkr 会继续在页面上陪你干活。"
        : "让 Linkr 安静下班，浏览社交媒体时不再弹出干扰。",
      icon: isOff ? Sun : Moon,
      iconClass: isOff ? "text-amber-500" : "text-slate-500",
      onClick: () => {
        setMenuOpen(false);
        onToggleWorkMode();
      },
    },
  ];

  const actions = items.filter(
    (item): item is FloatingMenuAction => !("kind" in item)
  );
  const hovered = actions.find((a) => a.id === hoveredId) ?? null;

  return (
    <div
      className="relative"
      onMouseEnter={openHoverCard}
    >
      {((demoStage === "card") || hoverCardOpen) && !isOff ? (
        <FloatingCard
          closeButtonRef={cardCloseRef}
          onOpenCurrentSidebar={() => {
            setHoverCardOpen(false);
            onOpenCurrentSidebar();
          }}
          onOpenEmailSidebar={() => {
            setHoverCardOpen(false);
            onOpenEmailSidebar();
          }}
          onOpenSimilarSidebar={() => {
            setHoverCardOpen(false);
            onOpenSimilarSidebar();
          }}
          onClose={() => {
            setHoverCardOpen(false);
            onClose();
          }}
          onDragStart={onDragStart}
          compactViewport={compactViewport}
          creator={creator}
          reviewFlow={reviewFlow}
          sequentialIndex={sequentialIndex}
          sequentialTotal={sequentialTotal}
          onSeedCreator={onSeedCreator}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          workMode={workMode}
          onSetWorkMode={onSetWorkMode}
          onOpenTaskList={onOpenTaskList}
          dataCheckOn={dataCheckOn}
          onToggleDataCheck={onToggleDataCheck}
          scrapeCount={scrapeCount}
          onChangeScrapeCount={onChangeScrapeCount}
          selectedHoverMetricKeys={selectedHoverMetricKeys}
          hoverMetricModes={hoverMetricModes}
        />
      ) : null}

      <div className="absolute right-0 top-1/2 z-30 flex -translate-y-1/2 items-center">
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            aria-label={isOff ? "Linkr 下班模式，点击恢复上班模式" : "打开信息卡片"}
            onFocus={() => {
              if (isOff || demoStage === "card") return;
              setHoverCardOpen(true);
            }}
            onClick={() => {
              if (isOff) {
                onToggleWorkMode();
                return;
              }
              if (demoStage === "card") return;
              onOpenCard();
            }}
            onPointerDown={(event) => {
              // Release implicit pointer capture so window-level pointermove fires during drag.
              if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              suppressClickRef.current = false;
              dragIntentRef.current = {
                startX: event.clientX,
                startY: event.clientY,
                moved: false,
              };
              onDragStart(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              const intent = dragIntentRef.current;
              if (
                intent &&
                !intent.moved &&
                Math.hypot(event.clientX - intent.startX, event.clientY - intent.startY) > 4
              ) {
                intent.moved = true;
                suppressClickRef.current = true;
                closeFloatingUi();
              }
            }}
            onPointerUp={() => {
              dragIntentRef.current = null;
            }}
            onPointerCancel={() => {
              dragIntentRef.current = null;
            }}
            onClickCapture={(event) => {
              // Suppress click that immediately follows a drag.
              if (suppressClickRef.current) {
                event.preventDefault();
                event.stopPropagation();
              }
              suppressClickRef.current = false;
            }}
            className={cn(
              "relative flex h-10 w-10 cursor-grab touch-none items-center justify-center transition-all duration-150 hover:scale-[1.04] active:cursor-grabbing",
              isOff && "opacity-55 grayscale"
            )}
          >
            <Image
              src="/2linkr-logo.png"
              alt="2Linkr 插件入口"
              fill
              sizes="40px"
              className="object-contain"
            />
            {isOff ? (
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-slate-700 text-white"
              >
                <Moon className="h-2.5 w-2.5" />
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
}
