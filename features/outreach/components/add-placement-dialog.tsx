"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Link2, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useOutreachState,
  type AddPlacementInput,
} from "@/features/outreach/components/outreach-state-context";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// Form 状态保留在 DialogBody 这个子组件里。AddPlacementDialog 仅在 open=true 时
// 挂载 DialogBody —— 关闭即卸载，下次打开是全新实例，状态天然重置，
// 不再需要在 useEffect 里 setState() 触发级联渲染（react-hooks/set-state-in-effect）。

// §3.3 添加追踪 弹窗。
//
// 录入链路（Phase 0 mock）：
//   1. 用户从两个入口之一打开：
//      a) 投放表现 网格右上角 "+ 添加追踪" —— 博主未知
//      b) 博主抽屉头部 "添加追踪"           —— 博主已知，prefill 在 props 里
//   2. 用户粘贴 TikTok 视频链接（必填）+ 投放费用（选填）
//   3. 链接通过 TIKTOK_URL_RE 校验，从中提取 @handle —— 即"系统通过链接识别博主"
//   4. 提交 → addPlacement(input) 写入 OutreachStateContext，网格 / 抽屉立即看到新卡片
//
// Phase 1+：把 parseTiktokUrl 替换为 service.fetchPlacementByUrl(url)，由后端拉取
// 真实的 views / likes / 头像等字段；UI 不变。
const TIKTOK_URL_RE = /^https?:\/\/(?:www\.)?tiktok\.com\/@([\w.-]+)\/video\/(\d+)/i;

export interface AddPlacementCreatorPrefill {
  creatorHandle: string;
  creatorName: string;
  creatorAvatarUrl: string;
  creatorFollowers: number;
  creatorCategory: AddPlacementInput["creatorCategory"];
  creatorProfileUrl: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  // 当从博主抽屉调起时，博主信息已知，直接 prefill 跳过识别步。
  prefill?: AddPlacementCreatorPrefill;
}

interface ParsedLink {
  handle: string;
  videoId: string;
}

function parseTiktokUrl(value: string): ParsedLink | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = TIKTOK_URL_RE.exec(trimmed);
  if (!match) return null;
  return { handle: match[1]!, videoId: match[2]! };
}

export function AddPlacementDialog({ open, onClose, prefill }: Props) {
  if (!open || typeof document === "undefined") return null;
  return <DialogBody onClose={onClose} prefill={prefill} />;
}

function DialogBody({
  onClose,
  prefill,
}: {
  onClose: () => void;
  prefill?: AddPlacementCreatorPrefill;
}) {
  const { addPlacement } = useOutreachState();
  const { currentProject } = useWorkspaceProject();
  const [postUrl, setPostUrl] = useState("");
  const [spend, setSpend] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ESC 关闭 —— 仅在 mount 时绑定，effect 内不调用 setState。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const parsed = useMemo(() => parseTiktokUrl(postUrl), [postUrl]);
  const linkInvalid = postUrl.trim().length > 0 && !parsed;
  const spendNumber = Number(spend);
  const spendInvalid = spend.length > 0 && (Number.isNaN(spendNumber) || spendNumber < 0);
  const canSubmit = !!parsed && !spendInvalid && !submitting;

  const handleSubmit = () => {
    if (!parsed || !canSubmit) return;
    setSubmitting(true);
    // prefill 优先；没 prefill 时用链接里识别出的 handle 当显示名。
    // 没有 prefill 的字段（粉丝量 / 类别）暂用兜底值，等 service 接入后由抓取覆盖。
    const input: AddPlacementInput = {
      projectId: currentProject.id,
      postUrl: postUrl.trim(),
      spendUsd: spend.trim() === "" ? 0 : spendNumber,
      creatorHandle: prefill?.creatorHandle ?? `@${parsed.handle}`,
      creatorName: prefill?.creatorName ?? parsed.handle,
      creatorAvatarUrl:
        prefill?.creatorAvatarUrl ??
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(parsed.handle)}`,
      creatorFollowers: prefill?.creatorFollowers ?? 0,
      creatorCategory: prefill?.creatorCategory ?? "other",
      creatorProfileUrl: prefill?.creatorProfileUrl ?? `https://www.tiktok.com/@${parsed.handle}`,
    };
    addPlacement(input);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#201515]/26 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-placement-title"
    >
      <Button
        unstyled
        type="button"
        aria-label="关闭"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative flex max-h-[86vh] w-full max-w-[460px] flex-col overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffdf9]">
        <Header onClose={onClose} prefilledCreator={prefill?.creatorHandle ?? null} />
        <div className="flex flex-col gap-4 px-5 py-4">
          <UrlField
            value={postUrl}
            onChange={setPostUrl}
            invalid={linkInvalid}
            parsed={parsed}
            prefilledCreator={prefill?.creatorHandle ?? null}
          />
          <SpendField value={spend} onChange={setSpend} invalid={spendInvalid} />
          <ProjectHint projectName={currentProject.name} />
        </div>
        <Footer onClose={onClose} onSubmit={handleSubmit} canSubmit={canSubmit} />
      </div>
    </div>,
    document.body,
  );
}

function Header({
  onClose,
  prefilledCreator,
}: {
  onClose: () => void;
  prefilledCreator: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#eceae3] px-5 py-4">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd9c8] bg-[#fff7f4] px-2 py-0.5 text-[11px] font-medium text-[#ff4f00]">
          <Sparkles className="h-3 w-3" aria-hidden /> 链接识别
        </div>
        <h3 id="add-placement-title" className="mt-2 text-[16px] font-semibold text-[#201515]">
          添加追踪
        </h3>
        <p className="mt-1 text-[12px] leading-5 text-[#939084]">
          {prefilledCreator
            ? `粘贴 ${prefilledCreator} 的发帖链接，系统将关联到这条投放。`
            : "粘贴博主发帖链接，系统会自动识别博主并建立追踪。"}
        </p>
      </div>
      <Button
        unstyled
        type="button"
        onClick={onClose}
        aria-label="关闭"
        className="rounded-full border border-[#c5c0b1] p-1.5 text-[#939084] transition-colors hover:bg-[#fffefb]"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function UrlField({
  value,
  onChange,
  invalid,
  parsed,
  prefilledCreator,
}: {
  value: string;
  onChange: (next: string) => void;
  invalid: boolean;
  parsed: ParsedLink | null;
  prefilledCreator: string | null;
}) {
  const showHandleConflict =
    parsed &&
    prefilledCreator &&
    `@${parsed.handle}`.toLowerCase() !== prefilledCreator.toLowerCase();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[#36342e]">
        发帖链接 <span className="text-[#ff4f00]">*</span>
      </span>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-[#fffefb] px-3 py-2 transition-colors",
          invalid ? "border-[#ff4f00]" : "border-[#c5c0b1] focus-within:border-[#ff4f00]",
        )}
      >
        <Link2 className="h-3.5 w-3.5 shrink-0 text-[#939084]" aria-hidden />
        <input
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.tiktok.com/@handle/video/123…"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-[#201515] outline-none placeholder:text-[#bdb9ad]"
        />
      </div>
      {invalid ? (
        <span className="text-[11px] text-[#ff4f00]">仅支持 TikTok 视频链接，请检查格式。</span>
      ) : parsed ? (
        <span className="text-[11px] text-[#3a8c5b]">
          已识别博主 <span className="font-semibold">@{parsed.handle}</span>
          {showHandleConflict ? (
            <span className="ml-1 text-[#ff4f00]">
              · 与抽屉博主（{prefilledCreator}）不一致，将以链接为准
            </span>
          ) : null}
        </span>
      ) : (
        <span className="text-[11px] text-[#939084]">
          仅支持 TikTok。链接格式：tiktok.com/@博主/video/编号
        </span>
      )}
    </label>
  );
}

function SpendField({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  invalid: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[#36342e]">
        投放费用 <span className="text-[#939084]">（选填，USD）</span>
      </span>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-[#fffefb] px-3 py-2 transition-colors",
          invalid ? "border-[#ff4f00]" : "border-[#c5c0b1] focus-within:border-[#ff4f00]",
        )}
      >
        <span className="text-[12px] text-[#939084]">$</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-[#201515] tabular-nums outline-none placeholder:text-[#bdb9ad]"
        />
      </div>
      {invalid ? <span className="text-[11px] text-[#ff4f00]">请输入非负数字。</span> : null}
    </label>
  );
}

function ProjectHint({ projectName }: { projectName: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#eceae3] bg-[#fffefb] px-3 py-2 text-[11px]">
      <span className="text-[#939084]">归属项目</span>
      <span className="font-medium text-[#201515]">{projectName}</span>
    </div>
  );
}

function Footer({
  onClose,
  onSubmit,
  canSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#eceae3] bg-[#fffefb] px-5 py-3">
      <span className="inline-flex items-center gap-1 text-[10px] text-[#939084]">
        <ExternalLink className="h-3 w-3" aria-hidden /> 抓取后曝光 / 互动数据自动回填
      </span>
      <div className="flex items-center gap-2">
        <Button
          unstyled
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-[12px] font-medium text-[#36342e] transition-colors hover:bg-[#fffdf9]"
        >
          取消
        </Button>
        <Button
          unstyled
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className={cn(
            "rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
            canSubmit
              ? "bg-[#ff4f00] text-[#fffefb] hover:bg-[#ff4f00]"
              : "cursor-not-allowed bg-[#eceae3] text-[#bdb9ad]",
          )}
        >
          添加追踪
        </Button>
      </div>
    </div>
  );
}
