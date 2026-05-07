"use client";

import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

import type { Creator, CreatorRecentPost } from "@/types/api";
import { CREATOR_CATEGORY_LABEL } from "@/lib/creator";
import { cn } from "@/lib/utils";

interface Props {
  creator: Creator;
}

type Aggregate = "median" | "average";

// 「内容数据」tab：核心指标（中位数 / 平均切换）+ Hashtag 频道标签 + 品牌提及 + 近 10 条列表。
export function TabContent({ creator }: Props) {
  const [aggregate, setAggregate] = useState<Aggregate>("median");
  const posts = creator.recentPosts;

  const stats = useMemo(() => computeStats(posts, aggregate), [posts, aggregate]);
  const hashtagShares = useMemo(() => computeHashtagShares(posts), [posts]);
  const brandMentions = useMemo(() => computeBrandMentions(posts), [posts]);

  if (posts.length === 0) {
    return (
      <div className="space-y-5">
        <Profile creator={creator} />
        <p className="rounded-2xl border border-dashed border-[#c5c0b1] py-8 text-center text-[12px] text-[#939084]">
          暂无近期内容快照
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Profile creator={creator} />

      <Section
        title="核心指标"
        subtitle={`基于近 ${posts.length} 条内容`}
        right={<AggregateToggle value={aggregate} onChange={setAggregate} />}
      >
        <div className="grid grid-cols-3 gap-3">
          <Stat label={aggregateLabel("观看", aggregate)} value={fmtN(stats.views)} />
          <Stat label="互动率 (ER)" value={`${stats.er.toFixed(1)}%`} />
          <Stat label={aggregateLabel("点赞", aggregate)} value={fmtN(stats.likes)} />
          <Stat label={aggregateLabel("评论", aggregate)} value={fmtN(stats.comments)} />
          <Stat label={aggregateLabel("分享", aggregate)} value={fmtN(stats.shares)} />
          <Stat label="活跃" value={creator.recentActiveAt ?? "—"} />
        </div>
      </Section>

      {hashtagShares.length > 0 && (
        <Section title="频道标签" subtitle="近期内容 hashtag 出现频率">
          <HashtagChart shares={hashtagShares} />
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

      <Section title="近 10 条内容">
        <ul className="space-y-2">
          {posts.map((p) => (
            <RecentPostRow key={p.id} post={p} />
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Profile({ creator }: { creator: Creator }) {
  return (
    <Section title="博主基础数据">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="粉丝量" value={fmtN(creator.followers)} />
        <Stat label="平台中位播放" value={creator.medianViews ? fmtN(creator.medianViews) : "—"} />
        <Stat label="账号 ER" value={`${creator.engagementRate.toFixed(1)}%`} />
        <Stat label="类目" value={CREATOR_CATEGORY_LABEL[creator.category]} />
        <Stat label="地区" value={creator.region || "—"} />
        <Stat
          label="预估报价"
          value={creator.estimatedPrice ?? (creator.rateCard ? fmtRateCard(creator.rateCard) : "—")}
        />
      </div>
      {creator.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {creator.topics.map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-[#eceae3] px-2 py-0.5 text-[11px] text-[#36342e]"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </Section>
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
    { id: "median", label: "中位数" },
    { id: "average", label: "平均" },
  ];
  return (
    <div className="inline-flex rounded-full border border-[#c5c0b1] bg-[#fffefb] p-0.5 text-[11px]">
      {opts.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-full px-2.5 py-0.5 transition-colors",
              active ? "bg-[#ff4f00] text-[#fffefb]" : "text-[#36342e] hover:text-[#201515]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function HashtagChart({ shares }: { shares: { tag: string; share: number }[] }) {
  const top = shares[0];
  const rest = shares.slice(1);
  return (
    <div className="space-y-3 rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[24px] font-bold text-[#ff4f00]">{top.tag}</span>
        {rest.slice(0, 5).map((row) => (
          <span key={row.tag} className="text-[13px] text-[#36342e]">
            {row.tag}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {shares.slice(0, 6).map((row) => (
          <div key={row.tag} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-[12px] text-[#36342e]">{row.tag}</span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#eceae3]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#ff4f00]"
                style={{ width: `${Math.max(4, row.share * 100)}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-[11px] text-[#939084] tabular-nums">
              {(row.share * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentPostRow({ post }: { post: CreatorRecentPost }) {
  return (
    <li className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-[#201515]" title={post.caption}>
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
      <dl className="mt-2 grid grid-cols-4 gap-2 border-t border-[#eceae3] pt-2 text-[11px]">
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
    </li>
  );
}

function computeStats(posts: CreatorRecentPost[], mode: Aggregate) {
  if (posts.length === 0) {
    return { views: 0, likes: 0, comments: 0, shares: 0, er: 0 };
  }
  const reduce = (key: keyof Pick<CreatorRecentPost, "views" | "likes" | "comments" | "shares">) =>
    mode === "average"
      ? posts.reduce((acc, p) => acc + p[key], 0) / posts.length
      : median(posts.map((p) => p[key]));
  const views = reduce("views");
  const likes = reduce("likes");
  const comments = reduce("comments");
  const shares = reduce("shares");
  const er = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;
  return { views, likes, comments, shares, er };
}

function computeHashtagShares(posts: CreatorRecentPost[]): { tag: string; share: number }[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const post of posts) {
    for (const tag of post.hashtags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      total++;
    }
  }
  if (total === 0) return [];
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, share: count / total }))
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

function aggregateLabel(metric: string, mode: Aggregate): string {
  return mode === "average" ? `平均${metric}` : `中位${metric}`;
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
    <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-3">
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
