"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

export function SidebarEmailCopy({
  email,
  hasEmail,
}: {
  email: string;
  hasEmail: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(email);
  const [localEmail, setLocalEmail] = useState(email);

  useEffect(() => {
    setLocalEmail(email);
    setEditValue(email);
    setIsEditing(false);
    setCopied(false);
  }, [email]);

  const effectiveEmail = localEmail.trim();
  const effectiveHasEmail = hasEmail || effectiveEmail.length > 0;

  const copy = () => {
    if (!effectiveHasEmail || !effectiveEmail) return;
    navigator.clipboard.writeText(effectiveEmail).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const finishEdit = () => {
    setLocalEmail(editValue.trim());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={editValue}
        onChange={(event) => setEditValue(event.target.value)}
        onBlur={finishEdit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            finishEdit();
          }
          if (event.key === "Escape") {
            setEditValue(localEmail);
            setIsEditing(false);
          }
        }}
        placeholder="输入邮箱地址"
        className="h-[26px] min-w-0 flex-1 rounded-[13px] border border-[#e8e6dc] bg-white px-[9px] text-[11px] font-medium text-[#141413] outline-none transition-colors focus:border-[#c96442]/35"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (effectiveHasEmail) {
          copy();
        }
      }}
      onDoubleClick={() => {
        if (!effectiveHasEmail) {
          setEditValue(localEmail);
          setIsEditing(true);
        }
      }}
      aria-label={
        effectiveHasEmail ? "复制邮箱" : "暂无邮箱，双击添加邮箱"
      }
      title={effectiveHasEmail ? effectiveEmail : "双击添加邮箱"}
      className={cn(
        "flex h-[26px] min-w-0 flex-1 items-center gap-1.5 rounded-[13px] px-[9px] text-[11px] transition-all select-none",
        copied
          ? "bg-emerald-50"
          : effectiveHasEmail
            ? "bg-[#f0ece4]"
            : "bg-[#f5f4ed]",
        effectiveHasEmail
          ? "cursor-pointer hover:bg-[#e8e3d8]"
          : "cursor-text",
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
      ) : (
        <Copy
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            effectiveHasEmail ? "text-[#87867f]" : "text-[#bcb7ad]",
          )}
        />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-left font-medium",
          copied
            ? "text-emerald-700"
            : effectiveHasEmail
              ? "text-[#4d4c48]"
              : "text-[#a39f95]",
        )}
      >
        {copied ? "已复制" : effectiveHasEmail ? effectiveEmail : "双击添加邮箱"}
      </span>
    </button>
  );
}
