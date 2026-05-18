"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SidebarEmailCopy({ email, hasEmail }: { email: string; hasEmail: boolean }) {
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
        className="h-7 min-w-0 flex-1 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2 text-[11px] font-medium text-[#201515] transition-colors outline-none focus:border-[#ff4f00]/35"
      />
    );
  }

  return (
    <Button
      unstyled
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
      aria-label={effectiveHasEmail ? "复制邮箱" : "暂无邮箱，双击添加邮箱"}
      title={effectiveHasEmail ? effectiveEmail : "双击添加邮箱"}
      className={cn(
        "flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-[8px] border border-[#c5c0b1] px-2 text-[11px] transition-all select-none",
        copied
          ? "border-emerald-200 bg-emerald-50"
          : effectiveHasEmail
            ? "bg-[#fffefb] hover:bg-[#eceae3]"
            : "bg-[#fffefb]",
        effectiveHasEmail ? "cursor-pointer" : "cursor-text",
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
      ) : (
        <Copy
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            effectiveHasEmail ? "text-[#939084]" : "text-[#b5b2aa]",
          )}
        />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-left font-medium",
          copied ? "text-emerald-700" : effectiveHasEmail ? "text-[#36342e]" : "text-[#939084]",
        )}
      >
        {copied ? "已复制" : effectiveHasEmail ? effectiveEmail : "双击添加邮箱"}
      </span>
    </Button>
  );
}
