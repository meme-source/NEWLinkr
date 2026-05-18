"use client";

import { motion } from "framer-motion";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import type { MockFeatureId, MockPost } from "./mock-posts";

// 「单帖分析」tab 里各功能 accordion 展开后的内容。
// 从 SinglePostAnalysisView 拆出来，让视图文件保持在体积预算内。

export function FeatureBody({ id, post }: { id: MockFeatureId; post: MockPost }) {
  if (id === "track") return <TrackBody post={post} />;
  if (id === "audience") return <AudienceBody post={post} />;
  if (id === "fake-fans") return <FakeFansBody post={post} />;
  if (id === "extract-video") return <ExtractBody kind="video" />;
  if (id === "extract-audio") return <ExtractBody kind="audio" />;
  if (id === "subtitle") return <SubtitleBody />;
  if (id === "ai-breakdown") return <AiBreakdownBody />;
  return null;
}

function TrackBody({ post }: { post: MockPost }) {
  const { metrics } = post;
  // 刷新 icon 状态：rotation 每次点击 +360 触发 motion 旋转，
  // justRefreshed 控制 4 秒内显示"刚刚刷新"文案。mock 不真去拉数据。
  const [rotation, setRotation] = useState(0);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const handleRefresh = () => {
    setRotation((r) => r + 360);
    setJustRefreshed(true);
    window.setTimeout(() => setJustRefreshed(false), 4000);
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5">
        <Metric label="播放量" value={metrics.plays} />
        <Metric label="互动率" value={metrics.er} />
        <Metric label="新增收藏" value={metrics.saves} />
        <Metric label="新增评论" value={metrics.comments} />
      </div>
      <div
        className="mt-2 flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-[10.5px]"
        style={{ backgroundColor: "#fffdf9", color: "#939084", border: "1px solid #eceae3" }}
      >
        <span className="flex-1">
          {justRefreshed ? "刚刚刷新 · 下次同步 02:00" : "7 日内完成 4 次抓取 · 下次同步 02:00"}
        </span>
        <Button
          unstyled
          type="button"
          onClick={handleRefresh}
          aria-label="刷新数据"
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[4px] transition-colors hover:bg-[#eceae3]"
          style={{ color: justRefreshed ? "#ff4f00" : "#939084" }}
        >
          <motion.span
            animate={{ rotate: rotation }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "inline-flex" }}
          >
            <RefreshCw size={11} strokeWidth={2.2} />
          </motion.span>
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] px-2 py-2 text-center" style={{ backgroundColor: "#eceae3" }}>
      <div className="text-[10px]" style={{ color: "#939084" }}>
        {label}
      </div>
      <div className="mt-0.5 text-[14px] font-semibold tabular-nums" style={{ color: "#201515" }}>
        {value}
      </div>
    </div>
  );
}

function AudienceBody({ post }: { post: MockPost }) {
  const { audience } = post;
  return (
    <div>
      <SectionLabel text="性别" />
      <BarRow label="男性" pct={audience.gender.male} />
      <BarRow label="女性" pct={audience.gender.female} />
      <div className="mt-3">
        <SectionLabel text="年龄段" />
        {audience.age.map((a) => (
          <BarRow key={a.range} label={a.range} pct={a.pct} />
        ))}
      </div>
      <div className="mt-3">
        <SectionLabel text="受众地区（T1）" />
        {audience.regions.map((r) => (
          <BarRow key={r.label} label={`${r.flag}  ${r.label}`} pct={r.pct} />
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      className="mb-1 text-[9.5px] font-semibold tracking-[0.5px] uppercase"
      style={{ color: "#939084" }}
    >
      {text}
    </div>
  );
}

function BarRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="mb-1.5 last:mb-0">
      <div className="mb-0.5 flex items-baseline justify-between text-[11px]">
        <span style={{ color: "#36342e" }}>{label}</span>
        <span className="font-medium tabular-nums" style={{ color: "#201515" }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "#eceae3" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ffb88a 0%, #ff7a3d 100%)",
          }}
        />
      </div>
    </div>
  );
}

function FakeFansBody({ post }: { post: MockPost }) {
  const { fakeFans } = post;
  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        <StatBlock
          label="真实用户"
          value={`${fakeFans.real}%`}
          tone="#3f6b29"
          bg="rgba(63, 107, 41, 0.10)"
        />
        <StatBlock
          label="疑似假粉"
          value={`${fakeFans.fake}%`}
          tone="#ff4f00"
          bg="rgba(255, 79, 0, 0.10)"
        />
        <StatBlock label="网红粉丝" value={`${fakeFans.influencer}%`} tone="#36342e" bg="#eceae3" />
      </div>
      <div className="mt-3">
        <SectionLabel text="样例可疑账号" />
        <SuspiciousRow handle="@ty…ji.1710" reason="Low engagement, suspicious activity" />
        <SuspiciousRow handle="@musa190310" reason="No posts, suspicious username" />
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  tone,
  bg,
}: {
  label: string;
  value: string;
  tone: string;
  bg: string;
}) {
  return (
    <div className="rounded-[6px] px-1.5 py-2 text-center" style={{ backgroundColor: bg }}>
      <div className="text-[13px] font-semibold tabular-nums" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-0.5 text-[9.5px]" style={{ color: "#36342e" }}>
        {label}
      </div>
    </div>
  );
}

function SuspiciousRow({ handle, reason }: { handle: string; reason: string }) {
  return (
    <div
      className="mb-1.5 flex items-center gap-2 rounded-[6px] px-2 py-1.5 last:mb-0"
      style={{ border: "1px solid #eceae3", backgroundColor: "#fffdf9" }}
    >
      <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: "#eceae3" }} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium" style={{ color: "#201515" }}>
          {handle}
        </div>
        <div className="truncate text-[10px]" style={{ color: "#939084" }}>
          {reason}
        </div>
      </div>
    </div>
  );
}

function ExtractBody({ kind }: { kind: "video" | "audio" }) {
  const buttonText = kind === "video" ? "下载 mp4" : "下载 mp3";
  const hint =
    kind === "video"
      ? "原始 mp4（无水印）· 最大 100MB · 仅供分析使用"
      : "原声 mp3 · 最大 25MB · 适合配音 / 原声引用";
  return (
    <div>
      <Button
        unstyled
        type="button"
        className="flex w-full items-center justify-center gap-1.5 rounded-[6px] py-2 text-[12px] font-semibold text-[#fffefb] transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#201515" }}
      >
        <Download size={12} strokeWidth={2.4} aria-hidden />
        {buttonText}
      </Button>
      <div className="mt-1.5 text-[10.5px]" style={{ color: "#939084" }}>
        {hint}
      </div>
    </div>
  );
}

function SubtitleBody() {
  return (
    <div>
      <div
        className="rounded-[6px] px-2.5 py-2 text-[11.5px] leading-[1.55]"
        style={{ backgroundColor: "#fffdf9", border: "1px solid #eceae3", color: "#36342e" }}
      >
        <span className="font-medium tabular-nums" style={{ color: "#939084" }}>
          00:00
        </span>{" "}
        This is your sign to have people
        <br />
        <span className="font-medium tabular-nums" style={{ color: "#939084" }}>
          00:03
        </span>{" "}
        with the same body type as you as your fitness inspo.
      </div>
      <Button
        unstyled
        type="button"
        className="mt-2 text-[11px] font-medium transition-colors hover:underline"
        style={{ color: "#ff4f00" }}
      >
        复制全部字幕
      </Button>
    </div>
  );
}

function AiBreakdownBody() {
  return (
    <div>
      <div className="text-[11px] leading-[1.55]" style={{ color: "#939084" }}>
        选择一个分析角度，AI 会基于本帖的内容、画面、文案、互动综合输出。
      </div>
      <div className="mt-2 space-y-1.5">
        <RadioCard label="深度内容解析" desc="核心观点 + 叙事逻辑 + 情感基调" />
        <RadioCard label="爆款要素拆解" desc="选题 / 脚本 / 视觉 / 音乐" />
        <RadioCard label="把视频翻译成中文" desc="画面描述 + 字幕逐句翻译" />
      </div>
      <Button
        unstyled
        type="button"
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[6px] py-2 text-[12px] font-semibold text-[#fffefb] transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#ff4f00" }}
      >
        <Sparkles size={12} strokeWidth={2.4} aria-hidden />
        开始分析
      </Button>
    </div>
  );
}

function RadioCard({ label, desc }: { label: string; desc: string }) {
  return (
    <label
      className="flex cursor-pointer items-start gap-2 rounded-[6px] px-2 py-2 transition-colors hover:bg-[#fffdf9]"
      style={{ border: "1px solid #eceae3" }}
    >
      <input type="radio" name="ai-instruction" className="mt-1 accent-[#ff4f00]" />
      <div>
        <div className="text-[11.5px] font-medium" style={{ color: "#201515" }}>
          {label}
        </div>
        <div className="mt-0.5 text-[10.5px]" style={{ color: "#939084" }}>
          {desc}
        </div>
      </div>
    </label>
  );
}
