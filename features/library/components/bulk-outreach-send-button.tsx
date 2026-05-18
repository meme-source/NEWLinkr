"use client";

import { CalendarClock, Check, ChevronDown, Clock3, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BulkOutreachSendMode = "now" | "scheduled";

interface Props {
  ready: boolean;
  sendMode: BulkOutreachSendMode;
  menuOpen: boolean;
  recipientCount: number;
  onToggleMenu: () => void;
  onSelectMode: (mode: BulkOutreachSendMode) => void;
  onSend: () => void;
}

export function BulkOutreachSendButton({
  ready,
  sendMode,
  menuOpen,
  recipientCount,
  onToggleMenu,
  onSelectMode,
  onSend,
}: Props) {
  const label =
    sendMode === "scheduled"
      ? recipientCount > 1
        ? `定时发送 ${recipientCount} 人`
        : "定时发送"
      : recipientCount > 1
        ? `一键建联 ${recipientCount} 人`
        : "发送";

  return (
    <div className="relative">
      <div className="flex overflow-hidden rounded-full bg-[#ff4f00] text-[#fffefb]">
        <Button
          unstyled
          type="button"
          disabled={!ready}
          onClick={onSend}
          className="inline-flex h-9 items-center gap-1.5 px-4 text-[12px] font-medium transition-colors hover:bg-[#ff4f00] disabled:cursor-not-allowed disabled:bg-[#c5c0b1]"
        >
          {sendMode === "scheduled" ? (
            <CalendarClock className="h-3.5 w-3.5" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {label}
        </Button>
        <Button
          unstyled
          type="button"
          aria-label="选择发送方式"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={onToggleMenu}
          className="inline-flex h-9 w-9 items-center justify-center border-l border-[#fffefb]/20 transition-colors hover:bg-[#ff4f00]"
        >
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", menuOpen && "rotate-180")}
          />
        </Button>
      </div>
      {menuOpen && (
        <div className="absolute right-0 bottom-full z-30 mb-2 w-44 overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb]">
          <SendModeItem
            icon={<Send className="h-3.5 w-3.5" />}
            label="立即发送"
            active={sendMode === "now"}
            onClick={() => onSelectMode("now")}
          />
          <SendModeItem
            icon={<Clock3 className="h-3.5 w-3.5" />}
            label="定时发送"
            active={sendMode === "scheduled"}
            onClick={() => onSelectMode("scheduled")}
          />
        </div>
      )}
    </div>
  );
}

function SendModeItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      unstyled
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] transition-colors hover:bg-[#fffdf9]",
        active ? "font-semibold text-[#ff4f00]" : "text-[#36342e]",
      )}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      {active && <Check className="h-3.5 w-3.5" />}
    </Button>
  );
}
