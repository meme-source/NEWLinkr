"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  BarChart3,
  List,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { cn } from "@/lib/utils";

type TabKey = "list" | "dashboard";

const TRACKING_ITEMS = [
  {
    id: 1, creator: "@skincare_sam", avatar: "S",
    title: "XX 品牌深度测评 · 晚间护肤 routine",
    publishedAt: "04-20", cost: "$2,800", views: "180K", likes: "12K",
    comments: "890", shares: "2.3K", cpm: "$15.6", cpe: "$0.13",
    trend: "growing", trendLabel: "增长中 · 日均 +8K 播放",
    chartData: [20, 45, 80, 120, 150, 165, 180],
  },
  {
    id: 2, creator: "@fit_jenny", avatar: "F",
    title: "健身后必备好物分享",
    publishedAt: "04-18", cost: "$720", views: "95K", likes: "7.8K",
    comments: "562", shares: "1.8K", cpm: "$7.6", cpe: "$0.07",
    trend: "stable", trendLabel: "已稳定 · 播放量趋于平稳",
    chartData: [15, 30, 55, 70, 80, 88, 95],
  },
  {
    id: 3, creator: "@glow_girl", avatar: "G",
    title: "我的晚间护肤 routine",
    publishedAt: "04-22", cost: "$1,500", views: "42K", likes: "2.1K",
    comments: "98", shares: "320", cpm: "$35.7", cpe: "$0.59",
    trend: "anomaly", trendLabel: "异常 · 48 小时播放增速骤停",
    chartData: [10, 28, 38, 40, 41, 41, 42],
  },
];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 32, w = 80;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrackingListTab() {
  const { openCreatorProfile } = useCreatorProfile();
  const openItem = (item: typeof TRACKING_ITEMS[number]) =>
    openCreatorProfile({
      name: item.creator, handle: item.creator,
      avatarUrl: `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(item.creator)}&backgroundColor=fdf0e8`,
      region: "--", followers: item.views, er: "--",
    });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-[#87867f]">
          <span>共 {TRACKING_ITEMS.length} 条追踪</span>
          <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />1 条异常</span>
        </div>
        <button type="button" className="flex items-center gap-1.5 rounded-xl bg-[#141413] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#2a2a28]">
          <Plus className="h-3.5 w-3.5" />添加追踪
        </button>
      </div>
      <div className="space-y-4">
        {TRACKING_ITEMS.map(item => {
          const trendColor = item.trend === "growing" ? "text-emerald-600" : item.trend === "anomaly" ? "text-amber-600" : "text-[#87867f]";
          const sparkColor = item.trend === "growing" ? "#10b981" : item.trend === "anomaly" ? "#f59e0b" : "#87867f";
          return (
            <div key={item.id} className={cn("rounded-2xl border bg-white p-5", item.trend === "anomaly" ? "border-amber-200" : "border-[#e8e6dc]")}>
              <div className="flex items-start gap-4">
                <button type="button" onClick={() => openItem(item)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c96442] text-base font-semibold text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:ring-offset-2" aria-label={`查看 ${item.creator} 详情`}>{item.avatar}</button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[#141413]">{item.creator}</span>
                    <span className="text-xs text-[#87867f]">发布 {item.publishedAt} · 费用 {item.cost}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-[#4d4c48]">{item.title}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    {[{ icon: Eye, label: item.views, color: "text-[#87867f]" },{ icon: Heart, label: item.likes, color: "text-rose-500" },{ icon: MessageCircle, label: item.comments, color: "text-blue-500" },{ icon: Share2, label: item.shares, color: "text-violet-500" }].map(m => (
                      <div key={m.label} className="flex items-center gap-1"><m.icon className={cn("h-3.5 w-3.5", m.color)} /><span className="font-medium text-[#4d4c48]">{m.label}</span></div>
                    ))}
                    <div className="text-xs text-[#87867f]">CPM <span className="font-medium text-[#4d4c48]">{item.cpm}</span></div>
                    <div className="text-xs text-[#87867f]">CPE <span className="font-medium text-[#4d4c48]">{item.cpe}</span></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className={cn("flex items-center gap-1.5 text-xs font-medium", trendColor)}>
                      {item.trend === "growing" ? <TrendingUp className="h-3.5 w-3.5" /> : item.trend === "anomaly" ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      {item.trendLabel}
                    </div>
                    <MiniSparkline data={item.chartData} color={sparkColor} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button type="button" className="rounded-lg border border-[#e8e6dc] px-3 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]">查看详情</button>
                  <button type="button" className="text-xs text-[#87867f] hover:text-red-600">停止追踪</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardTab() {
  const { openCreatorProfile } = useCreatorProfile();
  const openItem = (item: typeof TRACKING_ITEMS[number]) =>
    openCreatorProfile({
      name: item.creator, handle: item.creator,
      avatarUrl: `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(item.creator)}&backgroundColor=fdf0e8`,
      region: "--", followers: item.views, er: "--",
    });
  const totalSpend = TRACKING_ITEMS.reduce((s, i) => s + parseInt(i.cost.replace("$", "").replace(",", "")), 0);
  const totalViews = TRACKING_ITEMS.reduce((s, i) => s + parseInt(i.views.replace("K", "")) * 1000, 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "总投放花费", value: `$${(totalSpend / 1000).toFixed(1)}K`, sub: "3 条合作" },
          { label: "总曝光量",   value: `${(totalViews / 1000).toFixed(0)}K`,  sub: "累计播放" },
          { label: "平均 CPM",   value: "$19.6",                                sub: "本月" },
          { label: "综合互动率", value: "5.2%",                                 sub: "+0.8% vs 上月" },
        ].map(m => (
          <div key={m.label} className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
            <div className="text-xs text-[#87867f]">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold text-[#141413]">{m.value}</div>
            <div className="mt-1 text-xs text-[#87867f]">{m.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
          <div className="mb-4 font-semibold text-[#141413]">博主 ROI 排行</div>
          <div className="space-y-3">
            {TRACKING_ITEMS.slice().sort((a, b) => parseFloat(a.cpm.replace("$","")) - parseFloat(b.cpm.replace("$",""))).map((item, i) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-[#87867f]">{i + 1}</span>
                <button type="button" onClick={() => openItem(item)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c96442] text-xs font-semibold text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:ring-offset-1" aria-label={`查看 ${item.creator} 详情`}>{item.avatar}</button>
                <div className="min-w-0 flex-1 text-sm text-[#141413]">{item.creator}</div>
                <div className="text-xs font-medium text-emerald-600">CPM {item.cpm}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
          <div className="mb-4 font-semibold text-[#141413]">花费 vs 曝光量</div>
          <div className="space-y-3">
            {TRACKING_ITEMS.map(item => {
              const costNum = parseInt(item.cost.replace("$","").replace(",",""));
              const viewsNum = parseInt(item.views.replace("K","")) * 1000;
              const barW = Math.round((viewsNum / 180000) * 100);
              return (
                <div key={item.id}>
                  <div className="mb-1 flex items-center justify-between text-xs text-[#87867f]">
                    <span>{item.creator}</span><span>{item.cost} → {item.views}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f0ece4]">
                    <div className="h-full rounded-full bg-[#c96442]" style={{ width: `${barW}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) ?? "list";
  return (
    <div className="space-y-6">
      {tab === "list" ? <TrackingListTab /> : <DashboardTab />}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><div className="h-64 animate-pulse rounded-2xl bg-[#f0ece4]" /></div>}>
      <TrackingContent />
    </Suspense>
  );
}
