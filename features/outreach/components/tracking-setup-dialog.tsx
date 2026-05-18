"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ExternalLink, Link2, Lock, Radar, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { parseTiktokUrl } from "@/features/outreach/lib/parse-tiktok-url";
import { cn } from "@/lib/utils";

// §3.3 「投放追踪」弹窗 —— 工作台与插件两端共用的 props 驱动展示组件。
//
// 点击任意「投放追踪」入口后，让用户先做选择 / 填条件：
//   1. 帖子链接：插件端自动识别当前帖子链接并锁定；工作台手动粘贴。
//   2. 追踪周期：设定追踪时长。
//   3. 合作信息：若决定与达人合作，填合作费用 / 发布时间 / 追踪截止时间；
//      不合作 = 仅作为「候选」观察对象，只追踪不录合作。
//
// 本组件不依赖任何 context —— 工作台包装层接 OutreachState，插件包装层接
// 插件本地状态，各自把结果通过 onSubmit 接走。

export interface TrackingSetupPayload {
  postUrl: string;
  // 从链接识别出的博主 handle（形如 "@xxx"）。
  creatorHandle: string;
  trackingPeriodDays: number;
  // true = 已确认合作（合作中）；false = 仅观察（候选）。
  collaborating: boolean;
  // 合作费用（USD）；候选时为 0。
  spendUsd: number;
  publishAt?: string;
  trackingEndsAt?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: TrackingSetupPayload) => void;
  // 预填帖子链接 —— 插件端自动识别当前帖子链接后传入。
  prefillPostUrl?: string;
  // 链接锁定（插件端已自动识别，不允许编辑）。
  lockPostUrl?: boolean;
  // 归属项目名（工作台传；插件不传）。
  projectName?: string;
}

const PERIOD_PRESETS = [7, 14, 30, 60] as const;
const DEFAULT_PERIOD = 30;

export function TrackingSetupDialog({
  open,
  onClose,
  onSubmit,
  prefillPostUrl,
  lockPostUrl,
  projectName,
}: Props) {
  if (!open || typeof document === "undefined") return null;
  return (
    <DialogBody
      onClose={onClose}
      onSubmit={onSubmit}
      prefillPostUrl={prefillPostUrl}
      lockPostUrl={lockPostUrl}
      projectName={projectName}
    />
  );
}

function DialogBody({
  onClose,
  onSubmit,
  prefillPostUrl,
  lockPostUrl,
  projectName,
}: Omit<Props, "open">) {
  const [postUrl, setPostUrl] = useState(prefillPostUrl ?? "");
  const [periodDays, setPeriodDays] = useState<number>(DEFAULT_PERIOD);
  const [collaborating, setCollaborating] = useState(false);
  const [spend, setSpend] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [trackingEndsAt, setTrackingEndsAt] = useState("");

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
  const canSubmit = !!parsed && periodDays > 0 && !spendInvalid;

  const handleSubmit = () => {
    if (!parsed || !canSubmit) return;
    onSubmit({
      postUrl: postUrl.trim(),
      creatorHandle: `@${parsed.handle}`,
      trackingPeriodDays: periodDays,
      collaborating,
      spendUsd: collaborating && spend.trim() !== "" ? spendNumber : 0,
      publishAt: collaborating && publishAt ? publishAt : undefined,
      trackingEndsAt: collaborating && trackingEndsAt ? trackingEndsAt : undefined,
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#201515]/26 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-setup-title"
    >
      <Button
        unstyled
        type="button"
        aria-label="关闭"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative flex max-h-[88vh] w-full max-w-[460px] flex-col overflow-hidden rounded-lg border border-[#c5c0b1] bg-[linear-gradient(180deg,#fffefb_0%,#fffdf9_55%,#eceae3_100%)]">
        <Header onClose={onClose} />
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <PostUrlField
            value={postUrl}
            onChange={setPostUrl}
            invalid={linkInvalid}
            handle={parsed ? `@${parsed.handle}` : null}
            locked={!!lockPostUrl}
          />
          <PeriodField value={periodDays} onChange={setPeriodDays} />
          <CollabSection
            on={collaborating}
            onToggle={() => setCollaborating((v) => !v)}
            spend={spend}
            onSpend={setSpend}
            spendInvalid={spendInvalid}
            publishAt={publishAt}
            onPublishAt={setPublishAt}
            trackingEndsAt={trackingEndsAt}
            onTrackingEndsAt={setTrackingEndsAt}
          />
          {projectName ? <ProjectHint projectName={projectName} /> : null}
        </div>
        <Footer onClose={onClose} onSubmit={handleSubmit} canSubmit={canSubmit} />
      </div>
    </div>,
    document.body,
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#eceae3] px-5 py-4">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd9c8] bg-[#fff7f4] px-2 py-0.5 text-[11px] font-medium text-[#ff4f00]">
          <Radar className="h-3 w-3" aria-hidden /> 投放追踪
        </div>
        <h3 id="tracking-setup-title" className="mt-2 text-[16px] font-semibold text-[#201515]">
          建立帖子追踪
        </h3>
        <p className="mt-1 text-[12px] leading-5 text-[#939084]">
          确认要追踪的帖子与周期；如已决定与达人合作，可一并录入合作信息。
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

function PostUrlField({
  value,
  onChange,
  invalid,
  handle,
  locked,
}: {
  value: string;
  onChange: (next: string) => void;
  invalid: boolean;
  handle: string | null;
  locked: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[#36342e]">
        帖子链接 <span className="text-[#ff4f00]">*</span>
      </span>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
          locked ? "border-[#eceae3] bg-[#eceae3]/55" : "bg-[#fffefb]",
          invalid
            ? "border-[#ff4f00]"
            : !locked && "border-[#c5c0b1] focus-within:border-[#ff4f00]",
        )}
      >
        {locked ? (
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#939084]" aria-hidden />
        ) : (
          <Link2 className="h-3.5 w-3.5 shrink-0 text-[#939084]" aria-hidden />
        )}
        <input
          type="url"
          inputMode="url"
          value={value}
          readOnly={locked}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.tiktok.com/@handle/video/123…"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-[#201515] outline-none placeholder:text-[#bdb9ad]"
        />
      </div>
      {locked ? (
        <span className="text-[11px] text-[#3a8c5b]">
          已自动识别当前帖子链接{handle ? ` · ${handle}` : ""}
        </span>
      ) : invalid ? (
        <span className="text-[11px] text-[#ff4f00]">仅支持 TikTok 视频链接，请检查格式。</span>
      ) : handle ? (
        <span className="text-[11px] text-[#3a8c5b]">
          已识别博主 <span className="font-semibold">{handle}</span>
        </span>
      ) : (
        <span className="text-[11px] text-[#939084]">链接格式：tiktok.com/@博主/video/编号</span>
      )}
    </label>
  );
}

function PeriodField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[#36342e]">追踪周期</span>
      <div className="flex items-center gap-1.5">
        {PERIOD_PRESETS.map((days) => (
          <Button
            key={days}
            unstyled
            type="button"
            onClick={() => onChange(days)}
            className={cn(
              "flex-1 rounded-lg border py-1.5 text-[12px] font-medium transition-colors",
              value === days
                ? "border-[#ff4f00] bg-[#fff7f4] text-[#ff4f00]"
                : "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:bg-[#fffdf9]",
            )}
          >
            {days} 天
          </Button>
        ))}
      </div>
      <span className="text-[11px] text-[#939084]">
        追踪期内系统按日抓取该帖的播放 / 互动数据。
      </span>
    </div>
  );
}

function CollabSection({
  on,
  onToggle,
  spend,
  onSpend,
  spendInvalid,
  publishAt,
  onPublishAt,
  trackingEndsAt,
  onTrackingEndsAt,
}: {
  on: boolean;
  onToggle: () => void;
  spend: string;
  onSpend: (v: string) => void;
  spendInvalid: boolean;
  publishAt: string;
  onPublishAt: (v: string) => void;
  trackingEndsAt: string;
  onTrackingEndsAt: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#eceae3] bg-[#fffefb] px-3 py-3">
      <Button
        unstyled
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className="flex items-center gap-2.5 text-left"
      >
        <span
          className={cn(
            "relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors",
            on ? "bg-[#ff4f00]" : "bg-[#c5c0b1]",
          )}
        >
          <span
            className={cn(
              "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-[#fffefb] transition-all",
              on ? "left-[16px]" : "left-[2px]",
            )}
          />
        </span>
        <span className="min-w-0">
          <span className="block text-[12px] font-medium text-[#201515]">确认与该达人合作</span>
          <span className="block text-[11px] text-[#939084]">
            {on ? "录入合作信息，标记为「合作中」" : "不开启 = 仅作为「候选」观察，不录合作"}
          </span>
        </span>
      </Button>

      {on ? (
        <div className="flex flex-col gap-3 border-t border-[#eceae3] pt-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-[#36342e]">
              合作费用 <span className="text-[#939084]">（USD）</span>
            </span>
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border bg-[#fffefb] px-3 py-2 transition-colors",
                spendInvalid
                  ? "border-[#ff4f00]"
                  : "border-[#c5c0b1] focus-within:border-[#ff4f00]",
              )}
            >
              <span className="text-[12px] text-[#939084]">$</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={spend}
                onChange={(e) => onSpend(e.target.value)}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#201515] tabular-nums outline-none placeholder:text-[#bdb9ad]"
              />
            </div>
            {spendInvalid ? (
              <span className="text-[11px] text-[#ff4f00]">请输入非负数字。</span>
            ) : null}
          </label>
          <DateField label="发布时间" value={publishAt} onChange={onPublishAt} />
          <DateField label="追踪截止时间" value={trackingEndsAt} onChange={onTrackingEndsAt} />
        </div>
      ) : null}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[#36342e]">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-2 transition-colors focus-within:border-[#ff4f00]">
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#939084]" aria-hidden />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[12px] text-[#201515] outline-none"
        />
      </div>
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
    <div className="flex items-center justify-between gap-3 border-t border-[#eceae3] px-5 py-3">
      <span className="inline-flex items-center gap-1 text-[10px] text-[#939084]">
        <ExternalLink className="h-3 w-3" aria-hidden /> 追踪期内曝光 / 互动数据自动回填
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
          开始追踪
        </Button>
      </div>
    </div>
  );
}
