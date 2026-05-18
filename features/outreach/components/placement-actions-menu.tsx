"use client";

import { ExternalLink, MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// §3.3 投放卡片右下角的"更多操作"按钮 —— 三个用户主动行为：
//   暂停 / 恢复（用户主动暂停或恢复，独立于自动识别状态）
//   原帖（跳转到博主对应平台的视频页）
//   删除（软删，软删后卡片在网格与抽屉中都不再显示）
// 之所以收进 menu 而不是平铺，是为了给"自动识别状态"留出主导地位 ——
// 状态徽章只读，不让用户混淆"我能改的"和"系统检测到的"。
interface Props {
  paused: boolean;
  onTogglePaused: () => void;
  postUrl: string;
  onDelete: () => void;
}

export function PlacementActionsMenu({ paused, onTogglePaused, postUrl, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="relative">
      <Button
        unstyled
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="更多操作"
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#36342e]",
          open && "bg-[#eceae3] text-[#36342e]",
        )}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </Button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={close} aria-hidden />
          <div
            role="menu"
            className="absolute right-0 bottom-full z-20 mb-1 min-w-[140px] overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb] py-1 shadow-md"
          >
            <MenuButton
              onClick={() => {
                close();
                onTogglePaused();
              }}
              icon={paused ? Play : Pause}
              label={paused ? "恢复" : "暂停"}
            />
            <a
              href={postUrl}
              target="_blank"
              rel="noreferrer noopener"
              role="menuitem"
              onClick={close}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] text-[#36342e] hover:bg-[#fffdf9]"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#939084]" aria-hidden />
              <span className="flex-1">原帖</span>
            </a>
            <MenuButton
              onClick={() => {
                close();
                onDelete();
              }}
              icon={Trash2}
              label="删除"
              tone="danger"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

interface MenuButtonProps {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "default" | "danger";
}

function MenuButton({ onClick, icon: Icon, label, tone = "default" }: MenuButtonProps) {
  return (
    <Button
      unstyled
      type="button"
      role="menuitem"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] hover:bg-[#fffdf9]",
        tone === "danger" ? "text-[#ff4f00]" : "text-[#36342e]",
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", tone === "danger" ? "text-[#ff4f00]" : "text-[#939084]")}
        aria-hidden
      />
      <span className="flex-1">{label}</span>
    </Button>
  );
}
