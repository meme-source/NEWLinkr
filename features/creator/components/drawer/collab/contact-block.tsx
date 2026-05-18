"use client";

import { Mail, MessageSquare, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Creator } from "@/types/api";

interface Props {
  creator: Creator;
  onChangeManualContactName?: (creatorId: string, name: string | null) => void;
}

// 顶部联系方式：邮箱 / TikTok handle / 用户手填的对接姓名。
// 全局唯一（不区分项目），与 Creator 根字段对齐。
export function ContactBlock({ creator, onChangeManualContactName }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEditing = () => {
    setDraft(creator.manualContactName ?? "");
    setEditing(true);
  };

  const commit = () => {
    const next = draft.trim() || null;
    onChangeManualContactName?.(creator.id, next);
    setEditing(false);
  };

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#ff4f00]" />
        <h3 className="text-[14px] font-semibold text-[#201515]">联系方式</h3>
      </div>
      <div className="space-y-2 rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
        {creator.emails.length === 0 ? (
          <Row icon={<Mail className="h-3.5 w-3.5" />} label="尚未找到邮箱" tone="muted" />
        ) : (
          creator.emails.map((email) => (
            <Row
              key={email.address}
              icon={<Mail className="h-3.5 w-3.5" />}
              label={email.address}
              badge={email.verified ? "已验证" : email.primary ? "主邮箱" : undefined}
            />
          ))
        )}
        {creator.dms.map((dm) => (
          <Row
            key={`${dm.platform}-${dm.handle}`}
            icon={<MessageSquare className="h-3.5 w-3.5" />}
            label={`${dm.platform} · ${dm.handle}`}
          />
        ))}

        <div className="flex items-center gap-2 border-t border-[#eceae3] pt-2 text-[13px] text-[#36342e]">
          <User className="h-3.5 w-3.5 shrink-0 text-[#939084]" />
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commit();
                } else if (event.key === "Escape") {
                  setDraft(creator.manualContactName ?? "");
                  setEditing(false);
                }
              }}
              placeholder="对接姓名 / 备用联系"
              className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#b5b2aa]"
            />
          ) : (
            <Button
              unstyled
              type="button"
              onClick={startEditing}
              className="min-w-0 flex-1 text-left text-[12px] text-[#36342e] hover:text-[#ff4f00]"
            >
              {creator.manualContactName ?? "点击填写对接姓名 / 备用联系"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({
  icon,
  label,
  badge,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  tone?: "default" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="inline-flex items-center gap-2">
        <span className="text-[#939084]">{icon}</span>
        <span className={tone === "muted" ? "text-[#939084]" : "break-all text-[#36342e]"}>
          {label}
        </span>
      </span>
      {badge && (
        <span className="rounded-full bg-[#eceae3] px-2 py-0.5 text-[10px] text-[#939084]">
          {badge}
        </span>
      )}
    </div>
  );
}
