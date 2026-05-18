"use client";

import { Check, ChevronDown, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Creator, CreatorRecentPost } from "@/types/api";
import { CREATOR_CATEGORY_LABEL, dominantStatus } from "@/lib/creator";
import { RATING_LABELS, RatingStars } from "@/features/library/components/rating-stars";
import { cn } from "@/lib/utils";

interface Props {
  creator: Creator;
}

type Aggregate = "median" | "average";
type AggregableMetric = "views" | "likes" | "comments" | "shares";

const AGGREGABLE_LABEL: Record<AggregableMetric, string> = {
  views: "观看",
  likes: "点赞",
  comments: "评论",
  shares: "分享",
};

// 与插件端 SCRAPE_COUNT_OPTIONS 保持一致，默认值 10。
const SCRAPE_COUNT_OPTIONS = [5, 10, 15] as const;
type ScrapeCount = (typeof SCRAPE_COUNT_OPTIONS)[number];

// 词云调色板：保留品牌暖色调，避免一片灰色。
const TOPIC_COLORS = ["#ff4f00", "#c96442", "#b8853b", "#6b4f3b", "#5b5a4d"];

// 「内容数据」tab：基础数据 + 全局样本范围选择器 + 核心指标 + 话题词云图 + 品牌提及 + 近 N 条列表。
export function TabContent({ creator }: Props) {
  const [aggregates, setAggregates] = useState<Record<AggregableMetric, Aggregate>>({
    views: "median",
    likes: "median",
    comments: "median",
    shares: "median",
  });
  const [scrapeCount, setScrapeCount] = useState<ScrapeCount>(10);

  const setMetric = (metric: AggregableMetric) => (next: Aggregate) =>
    setAggregates((prev) => ({ ...prev, [metric]: next }));

  // 全局样本：核心指标、话题词、近期内容列表都基于这同一份切片。
  const sampledPosts = useMemo(
    () => creator.recentPosts.slice(0, scrapeCount),
    [creator.recentPosts, scrapeCount],
  );
  const effectiveSampleSize = sampledPosts.length;

  const erBase = useMemo(() => computeMetricBase(sampledPosts), [sampledPosts]);
  const topicShares = useMemo(() => computeTopicShares(sampledPosts), [sampledPosts]);
  const brandMentions = useMemo(() => computeBrandMentions(sampledPosts), [sampledPosts]);

  if (creator.recentPosts.length === 0) {
    // 没有近期内容快照时（例如建联 / 投放表合成的博主），仍保留与有数据态完全一致的结构：
    // SampleScopeBar + 新版 Profile。下方将核心指标 / 频道标签 / 流量表现 / 近 N 条收敛成
    // 一个空态卡片，避免出现"老版"6 项 Profile 或仅一行"暂无"的不一致体验。
    return (
      <div className="space-y-5">
        <SampleScopeBar value={scrapeCount} onChange={setScrapeCount} />
        <Profile creator={creator} />
        <div className="rounded-lg border border-dashed border-[#c5c0b1] bg-[#fffefb] py-10 text-center text-[12px] text-[#939084]">
          暂无近期内容快照
          <span className="mt-1 block text-[11px] text-[#bdb9ac]">
            核心指标、频道标签、流量表现等数据需要博主有近期内容后才能展示
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SampleScopeBar value={scrapeCount} onChange={setScrapeCount} />

      <Profile creator={creator} />

      <Section title="核心指标" subtitle={`基于近 ${effectiveSampleSize} 条内容`}>
        <div className="grid grid-cols-3 gap-3">
          <AggregateStat
            metric="views"
            posts={sampledPosts}
            aggregate={aggregates.views}
            onAggregateChange={setMetric("views")}
          />
          <Stat label="互动率 (ER)" value={`${erBase.er.toFixed(1)}%`} />
          <AggregateStat
            metric="likes"
            posts={sampledPosts}
            aggregate={aggregates.likes}
            onAggregateChange={setMetric("likes")}
          />
          <AggregateStat
            metric="comments"
            posts={sampledPosts}
            aggregate={aggregates.comments}
            onAggregateChange={setMetric("comments")}
          />
          <AggregateStat
            metric="shares"
            posts={sampledPosts}
            aggregate={aggregates.shares}
            onAggregateChange={setMetric("shares")}
          />
        </div>
      </Section>

      {topicShares.length > 0 && (
        <Section title="频道标签" subtitle={`基于近 ${effectiveSampleSize} 条内容`}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TopicWordCloud topics={topicShares.slice(0, 12)} />
            <TopicBarList topics={topicShares.slice(0, 3)} />
          </div>
        </Section>
      )}

      {brandMentions.length > 0 && (
        <Section title="品牌提及">
          <div className="flex flex-wrap gap-1.5">
            {brandMentions.map((b) => (
              <span
                key={b.brand}
                className="inline-flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2 py-0.5 text-[11px] text-[#36342e]"
              >
                {b.brand}
                <span className="text-[10px] text-[#939084]">×{b.count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title={`近 ${effectiveSampleSize} 条内容`}>
        <div className="space-y-3">
          <TrafficChart posts={sampledPosts} />
          <ul className="space-y-2">
            {sampledPosts.map((p) => (
              <RecentPostRow key={p.id} post={p} />
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
}

function Profile({ creator }: { creator: Creator }) {
  const categoryLabel = `${CREATOR_CATEGORY_LABEL[creator.category]}类博主`;
  const priceLabel =
    creator.estimatedPrice ?? (creator.rateCard ? fmtRateCard(creator.rateCard) : "—");
  return (
    <Section title="博主基础数据">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="类目" value={categoryLabel} />
        <Stat label="预估报价" value={priceLabel} />
        <CollaborationStat creator={creator} />
      </div>
    </Section>
  );
}

// 合作次数卡片：次数 | 星级 + 文案 同行展示。
// 合作流程尚未完成时分隔线右侧显示 "合作完成后可评级"，与抽屉头部保持同一交互口径。
function CollaborationStat({ creator }: { creator: Creator }) {
  const count = creator.collaborations.length;
  const canRate = dominantStatus(creator) === "completed";
  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-3">
      <p className="text-[11px] text-[#939084]">合作次数</p>
      <div className="mt-1 flex items-center gap-2 text-[15px] font-bold text-[#201515]">
        <span>{count} 次</span>
        <span aria-hidden className="text-[#c5c0b1]">
          |
        </span>
        {canRate ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
            <RatingStars value={creator.rating} size="sm" ariaLabel="博主评级" />
            <span className="text-[#36342e]">{RATING_LABELS[creator.rating]}</span>
          </span>
        ) : (
          <span className="text-[11px] font-medium text-[#bdb9ac]" title="合作完成后可评级">
            合作完成后可评级
          </span>
        )}
      </div>
    </div>
  );
}

// 全局样本范围选择器。核心指标、话题词、近期内容列表都基于此切片。
function SampleScopeBar({
  value,
  onChange,
}: {
  value: ScrapeCount;
  onChange: (next: ScrapeCount) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="flex items-center gap-3 border-b border-[#c5c0b1] pb-3">
      <h3 className="text-[15px] font-semibold text-[#201515]">数据样本</h3>
      <div ref={wrapperRef} className="relative">
        <Button
          unstyled
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1 text-[11px] font-semibold text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
        >
          <span>近 {value} 条</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        </Button>
        {open ? (
          <div
            role="listbox"
            className="absolute top-full right-0 z-30 mt-1 w-[120px] overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb] shadow-[0_8px_24px_-12px_rgba(20,20,19,0.32)]"
          >
            {SCRAPE_COUNT_OPTIONS.map((opt) => (
              <Button
                unstyled
                key={opt}
                type="button"
                role="option"
                aria-selected={opt === value}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-[11px] transition-colors hover:bg-[#eceae3]",
                  opt === value ? "font-semibold text-[#ff4f00]" : "text-[#36342e]",
                )}
              >
                <span>近 {opt} 条</span>
                {opt === value ? <Check className="h-3 w-3" /> : null}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AggregateStat({
  metric,
  posts,
  aggregate,
  onAggregateChange,
}: {
  metric: AggregableMetric;
  posts: CreatorRecentPost[];
  aggregate: Aggregate;
  onAggregateChange: (next: Aggregate) => void;
}) {
  const value = useMemo(
    () => computeAggregate(posts, metric, aggregate),
    [posts, metric, aggregate],
  );
  const labelPrefix = aggregate === "average" ? "平均数" : "中位数";
  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-3">
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-[11px] text-[#939084]">
          {labelPrefix}
          {AGGREGABLE_LABEL[metric]}
        </p>
        <AggregateToggle value={aggregate} onChange={onAggregateChange} />
      </div>
      <p className="mt-1 truncate text-[15px] font-bold text-[#201515]">{fmtN(value)}</p>
    </div>
  );
}

function AggregateToggle({
  value,
  onChange,
}: {
  value: Aggregate;
  onChange: (next: Aggregate) => void;
}) {
  const opts: { id: Aggregate; label: string }[] = [
    { id: "median", label: "中" },
    { id: "average", label: "均" },
  ];
  return (
    <div className="inline-flex rounded-full border border-[#c5c0b1] bg-[#fffefb] p-0.5 text-[10px]">
      {opts.map((opt) => {
        const active = opt.id === value;
        return (
          <Button
            unstyled
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            title={opt.id === "median" ? "中位数" : "平均"}
            aria-pressed={active}
            className={cn(
              "rounded-full px-1.5 py-0.5 transition-colors",
              active ? "bg-[#ff4f00] text-[#fffefb]" : "text-[#36342e] hover:text-[#201515]",
            )}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

// 词云图：按出现频率排序，字号随排名平滑递减，颜色从主色调循环出。
function TopicWordCloud({ topics }: { topics: { tag: string; share: number }[] }) {
  if (topics.length === 0) return null;
  const maxShare = topics[0]?.share ?? 1;
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-4 py-5">
      <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2">
        {topics.map((topic, index) => {
          const fontSize = topicFontSize(topic.share, maxShare);
          const color = TOPIC_COLORS[index % TOPIC_COLORS.length];
          const pct = Math.round(topic.share * 100);
          return (
            <span
              key={topic.tag}
              className="leading-tight font-semibold"
              style={{ color, fontSize }}
              title={`${pct}% 内容出现 ${topic.tag}`}
            >
              {topic.tag}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// 出现率最高的字号 28px，最低 12px。share 介于其间用线性插值。
function topicFontSize(share: number, maxShare: number): number {
  if (maxShare <= 0) return 14;
  const ratio = Math.min(1, share / maxShare);
  const min = 12;
  const max = 28;
  return Math.round(min + (max - min) * ratio);
}

// 前 3 个主题的柱状百分比列表，搭配词云左右展示。
function TopicBarList({ topics }: { topics: { tag: string; share: number }[] }) {
  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-4 py-4">
      <p className="text-[12px] font-semibold text-[#201515]">前 3 个主题标签</p>
      <ul className="mt-3 space-y-2.5">
        {topics.map((topic, index) => {
          const color = TOPIC_COLORS[index % TOPIC_COLORS.length];
          const pct = topic.share * 100;
          return (
            <li key={topic.tag} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[12px]">
                <span className="truncate font-medium text-[#36342e]">{topic.tag}</span>
                <span className="shrink-0 text-[#939084] tabular-nums">{pct.toFixed(1)}%</span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${Math.max(4, pct)}%`, background: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RecentPostRow({ post }: { post: CreatorRecentPost }) {
  return (
    <li className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-3">
      <div className="flex items-stretch gap-3">
        <PostCover post={post} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[12px] text-[#201515]" title={post.caption}>
                {post.caption}
              </p>
              <p className="mt-0.5 text-[10px] text-[#939084]">{post.postedAt}</p>
            </div>
            <a
              href={post.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[#36342e] hover:text-[#ff4f00]"
            >
              原帖 <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <dl className="mt-auto grid grid-cols-4 gap-2 border-t border-[#eceae3] pt-2 text-[11px]">
            <Metric label="观看" value={fmtN(post.views)} />
            <Metric label="点赞" value={fmtN(post.likes)} />
            <Metric label="评论" value={fmtN(post.comments)} />
            <Metric label="分享" value={fmtN(post.shares)} />
          </dl>
          {(post.hashtags.length > 0 || post.brandMentions.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
              {post.hashtags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[#36342e]">
                  {tag}
                </span>
              ))}
              {post.brandMentions.map((brand) => (
                <span
                  key={brand}
                  className="rounded-full border border-[#ff4f00]/30 bg-[#fff7f4] px-1.5 py-0.5 text-[#ff4f00]"
                >
                  @{brand}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

// 真实封面图后续接入；目前用根据 post.id 派生的渐变占位块，保持视觉一致性。
// self-stretch + min-h 让封面充满整行高度，不再是 56×72 的小块。
function PostCover({ post }: { post: CreatorRecentPost }) {
  const hue = hashHue(post.id);
  const background = `linear-gradient(135deg, hsl(${hue}, 55%, 72%) 0%, hsl(${(hue + 40) % 360}, 60%, 58%) 100%)`;
  return (
    <div
      aria-hidden
      className="relative flex w-28 shrink-0 self-stretch overflow-hidden rounded-[6px] ring-1 ring-[#c5c0b1]"
      style={{ background, minHeight: 132 }}
    >
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-2 pt-4 pb-1.5 text-[10px] font-medium text-white/95">
        {fmtN(post.views)}
      </span>
    </div>
  );
}

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
}

// 「近期流量表现」双轴图：柱状（点赞+评论）+ 平滑折线（播放量）+ 悬浮提示。
function TrafficChart({ posts }: { posts: CreatorRecentPost[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 按发布时间升序，确保时间轴左→右递增。
  const sorted = useMemo(
    () => [...posts].sort((a, b) => a.postedAt.localeCompare(b.postedAt)),
    [posts],
  );
  if (sorted.length === 0) return null;

  const width = 640;
  const height = 240;
  // top 36 留给「播放量 / 点赞数 / 评论数」轴单位，避免与最高刻度文字撞在一起。
  // bottom 36 留给日期标签。left/right 56 留给纵轴数字。
  const pad = { top: 36, right: 56, bottom: 36, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const viewsMax = niceCeil(Math.max(...sorted.map((p) => p.views), 1));
  const engagementMax = niceCeil(Math.max(...sorted.map((p) => p.likes + p.comments), 1));
  const slot = innerW / sorted.length;
  const barW = Math.max(6, Math.min(26, slot * 0.5));

  const yLeft = (v: number) => pad.top + innerH - (v / viewsMax) * innerH;
  const xCenter = (i: number) => pad.left + slot * i + slot / 2;

  const linePoints = sorted.map((p, i) => ({ x: xCenter(i), y: yLeft(p.views) }));
  const linePath = smoothPath(linePoints);
  const baselineY = pad.top + innerH;
  const areaPath =
    linePoints.length > 0
      ? `${linePath} L${linePoints[linePoints.length - 1].x},${baselineY} L${linePoints[0].x},${baselineY} Z`
      : "";

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  // 日期最多 5 个，避免横向标签互相挤压。
  const dateTickIndexes = pickTickIndexes(sorted.length, 5);

  const hovered = hoverIndex !== null ? sorted[hoverIndex] : null;
  const tooltipX = hoverIndex !== null ? xCenter(hoverIndex) : 0;
  // 把 tooltip 控制在画布内，不让它跑出右边。
  const tooltipBoxW = 132;
  const tooltipLeft = Math.min(
    Math.max(tooltipX - tooltipBoxW / 2, pad.left),
    width - pad.right - tooltipBoxW,
  );

  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[13px] font-semibold text-[#201515]">近期流量表现</h4>
        <div className="flex items-center gap-3 text-[11px] text-[#36342e]">
          <LegendItem color="#ff4f00" shape="line" label="播放量" />
          <LegendItem color="#5b5a4d" shape="bar" label="点赞数" />
          <LegendItem color="#d8a880" shape="bar" label="评论数" />
        </div>
      </div>
      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="近期流量表现折线柱状图"
          className="w-full"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="trafficViewsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff4f00" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ff4f00" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 横向网格 + 左右纵轴刻度 */}
          {yTicks.map((t) => {
            const y = pad.top + innerH - t * innerH;
            return (
              <g key={t}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="#eceae3"
                  strokeWidth={1}
                />
                <text
                  x={pad.left - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-[#939084]"
                  fontSize="10"
                >
                  {fmtAxis(t * viewsMax)}
                </text>
                <text
                  x={width - pad.right + 8}
                  y={y}
                  textAnchor="start"
                  dominantBaseline="middle"
                  className="fill-[#939084]"
                  fontSize="10"
                >
                  {fmtAxis(t * engagementMax)}
                </text>
              </g>
            );
          })}

          {/* 轴单位（放在画布顶端的留白区里，远离顶层刻度） */}
          <text
            x={pad.left - 8}
            y={pad.top - 14}
            textAnchor="end"
            className="fill-[#939084]"
            fontSize="10"
          >
            播放量
          </text>
          {/* 右轴单位文本较长，锚定到 viewBox 右边并向左生长，避免超出 SVG 视口被裁掉。 */}
          <text
            x={width - 4}
            y={pad.top - 14}
            textAnchor="end"
            className="fill-[#939084]"
            fontSize="10"
          >
            点赞数 / 评论数
          </text>

          {/* 柱：点赞（底） + 评论（堆叠） */}
          {sorted.map((p, i) => {
            const cx = xCenter(i);
            const x = cx - barW / 2;
            const likesH = (p.likes / engagementMax) * innerH;
            const commentsH = (p.comments / engagementMax) * innerH;
            const yLikes = pad.top + innerH - likesH;
            const yComments = yLikes - commentsH;
            const active = i === hoverIndex;
            return (
              <g key={p.id} opacity={hoverIndex === null || active ? 1 : 0.55}>
                <rect x={x} y={yLikes} width={barW} height={likesH} fill="#5b5a4d" rx={2} />
                <rect x={x} y={yComments} width={barW} height={commentsH} fill="#d8a880" rx={2} />
              </g>
            );
          })}

          {/* 面积 + 折线：播放量 */}
          {areaPath && <path d={areaPath} fill="url(#trafficViewsArea)" />}
          <path d={linePath} fill="none" stroke="#ff4f00" strokeWidth={1.75} />
          {sorted.map((p, i) => (
            <circle
              key={`pt-${p.id}`}
              cx={xCenter(i)}
              cy={yLeft(p.views)}
              r={hoverIndex === i ? 4 : 2.5}
              fill="#ff4f00"
              stroke="#fffefb"
              strokeWidth={hoverIndex === i ? 2 : 0}
            />
          ))}

          {/* 悬浮垂直引导线 */}
          {hoverIndex !== null && (
            <line
              x1={tooltipX}
              x2={tooltipX}
              y1={pad.top}
              y2={baselineY}
              stroke="#c5c0b1"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}

          {/* X 轴日期标签 */}
          {dateTickIndexes.map((i) => (
            <text
              key={`x-${i}`}
              x={xCenter(i)}
              y={baselineY + 18}
              textAnchor="middle"
              className="fill-[#939084]"
              fontSize="10"
            >
              {fmtDate(sorted[i].postedAt)}
            </text>
          ))}

          {/* 悬浮 hit area：每条占满纵向，鼠标移入即激活 */}
          {sorted.map((p, i) => (
            <rect
              key={`hit-${p.id}`}
              x={pad.left + slot * i}
              y={pad.top}
              width={slot}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              tabIndex={0}
              role="presentation"
            />
          ))}
        </svg>

        {hovered && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute top-1 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1.5 text-[11px] leading-[1.4] text-[#201515] shadow-[0_8px_20px_-12px_rgba(20,20,19,0.35)]"
            style={{
              left: `${(tooltipLeft / width) * 100}%`,
              width: `${(tooltipBoxW / width) * 100}%`,
            }}
          >
            <p className="text-[10px] text-[#939084]">{fmtDate(hovered.postedAt)}</p>
            <p className="mt-0.5 flex items-center justify-between gap-2">
              <span className="text-[#36342e]">播放量</span>
              <span className="font-semibold tabular-nums" style={{ color: "#ff4f00" }}>
                {fmtN(hovered.views)}
              </span>
            </p>
            <p className="mt-0.5 flex items-center justify-between gap-2">
              <span className="text-[#36342e]">点赞数</span>
              <span className="font-semibold tabular-nums" style={{ color: "#5b5a4d" }}>
                {fmtN(hovered.likes)}
              </span>
            </p>
            <p className="mt-0.5 flex items-center justify-between gap-2">
              <span className="text-[#36342e]">评论数</span>
              <span className="font-semibold tabular-nums" style={{ color: "#b8853b" }}>
                {fmtN(hovered.comments)}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Catmull-Rom 平滑 → cubic Bezier，让播放量曲线随相邻点起伏更自然。
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function LegendItem({
  color,
  shape,
  label,
}: {
  color: string;
  shape: "line" | "bar";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {shape === "bar" ? (
        <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
      ) : (
        <span className="inline-block h-[2px] w-3.5 rounded-full" style={{ background: color }} />
      )}
      <span>{label}</span>
    </span>
  );
}

// 让 Y 轴上限落在「漂亮的数字」上（1/2/5 × 10^n），避免出现 73.84% 这种刻度。
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const norm = value / base;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * base;
}

function pickTickIndexes(total: number, max = 5): number[] {
  if (total === 0) return [];
  if (total <= max) return Array.from({ length: total }, (_, i) => i);
  const count = Math.max(2, Math.min(max, total));
  return Array.from({ length: count }, (_, i) => Math.round((i * (total - 1)) / (count - 1)));
}

function fmtAxis(value: number): string {
  if (value === 0) return "0";
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}亿`;
  if (value >= 10_000) return `${Math.round(value / 10_000)}万`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const parts = iso.slice(0, 10).split("-");
  if (parts.length < 3) return iso;
  return `${parts[1]}/${parts[2]}`;
}

function computeAggregate(
  posts: CreatorRecentPost[],
  metric: AggregableMetric,
  mode: Aggregate,
): number {
  if (posts.length === 0) return 0;
  const values = posts.map((p) => p[metric]);
  return mode === "average"
    ? values.reduce((acc, v) => acc + v, 0) / values.length
    : median(values);
}

// ER 用「中位数」作基准，避免随单项指标切换变化（不同基准混算会让 ER 失真）。
function computeMetricBase(posts: CreatorRecentPost[]): { er: number } {
  if (posts.length === 0) return { er: 0 };
  const v = median(posts.map((p) => p.views));
  const l = median(posts.map((p) => p.likes));
  const c = median(posts.map((p) => p.comments));
  const s = median(posts.map((p) => p.shares));
  const er = v > 0 ? ((l + c + s) / v) * 100 : 0;
  return { er };
}

// 「出现频率」改为「内容覆盖率」：含此 hashtag 的帖子数 / 样本帖子总数。
function computeTopicShares(posts: CreatorRecentPost[]): { tag: string; share: number }[] {
  if (posts.length === 0) return [];
  const counts = new Map<string, number>();
  for (const post of posts) {
    const unique = new Set(post.hashtags);
    for (const tag of unique) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, share: count / posts.length }))
    .sort((a, b) => b.share - a.share);
}

function computeBrandMentions(posts: CreatorRecentPost[]): { brand: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const brand of post.brandMentions) {
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function fmtN(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function fmtRateCard(rate: NonNullable<Creator["rateCard"]>): string {
  const v = rate.videoPrice ?? rate.postPrice ?? rate.storyPrice;
  return v ? `${rate.currency} ${v}` : "—";
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ff4f00]" />
          <h3 className="text-[14px] font-semibold text-[#201515]">{title}</h3>
          {subtitle && <span className="text-[11px] text-[#939084]">{subtitle}</span>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-3">
      <p className="text-[11px] text-[#939084]">{label}</p>
      <p className="mt-1 truncate text-[15px] font-bold text-[#201515]">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#939084]">{label}</p>
      <p className="mt-0.5 text-[12px] font-semibold text-[#201515] tabular-nums">{value}</p>
    </div>
  );
}
