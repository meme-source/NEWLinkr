"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Plus,
  CheckCircle2,
  ChevronRight,
  Search,
  Mail,
  Reply,
  ExternalLink,
  AlertCircle,
  Send,
  Users,
  TrendingUp,
  X,
  Pencil,
  Trash2,
  MoreHorizontal,
  Clock,
  FileText,
  MailOpen,
  XCircle,
  Eye,
} from "lucide-react";
import { useWorkspaceProject } from "@/components/workspace/project-context";
import { useCreatorProfile } from "@/components/ui/creator-profile-context";
import { cn } from "@/lib/utils";

type TabKey = "mail-mgmt" | "tasks" | "inbox" | "templates" | "stats" | "email-settings";

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtN(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ── Outreach tracking data ─────────────────────────────────────────────────────
type OutreachStatus = "待发送" | "已发送" | "已打开" | "待回复" | "已回复" | "建联成功" | "已拒绝";

const OUTREACH_STATUS_CFG: Record<OutreachStatus, { badge: string; dot: string }> = {
  待发送:   { badge: "bg-[#f5f4ed] text-[#87867f] border-[#e8e6dc]",  dot: "bg-[#c8c7c3]" },
  已发送:   { badge: "bg-[#eef2f7] text-[#4a5e7a] border-[#d8e0ea]",  dot: "bg-[#7892b3]" },
  已打开:   { badge: "bg-white    text-[#4a5e7a] border-[#b8c8de]",   dot: "bg-[#b8c8de]" },
  待回复:   { badge: "bg-[#fbf5ed] text-[#a6631f] border-[#f1d9b5]",  dot: "bg-[#d97706]" },
  已回复:   { badge: "bg-[#eef0e2] text-[#5a6a4a] border-[#d4dbb9]",  dot: "bg-[#7a8a5a]" },
  建联成功: { badge: "bg-[#dde3c4] text-[#465632] border-[#bfc99a]",  dot: "bg-[#5a6a3a]" },
  已拒绝:   { badge: "bg-[#fbf0ea] text-[#a14a2e] border-[#f3c9b3]",  dot: "bg-[#c96442]" },
};

interface OutreachCreator {
  id: string; handle: string; name: string;
  platform: string; method: string;
  status: OutreachStatus; lastContact: string;
  followers: number; projectId: string;
}

const OUTREACH_CREATORS: OutreachCreator[] = [
  { id:"skincare_sam",   handle:"@skincare_sam",         name:"Skincare Sam",       platform:"TikTok",    method:"Email", status:"已回复",   lastContact:"2小时前", followers:320000, projectId:"q2-summer" },
  { id:"glow_girl",      handle:"@glow_girl",             name:"Glow Girl",          platform:"TikTok",    method:"Email", status:"待回复",   lastContact:"1天前",   followers:180000, projectId:"q2-summer" },
  { id:"style_nina",     handle:"@style_nina_official",   name:"Style Nina",         platform:"Instagram", method:"Email", status:"建联成功", lastContact:"3天前",   followers:230000, projectId:"q2-summer" },
  { id:"fit_jenny",      handle:"@fit_jenny",             name:"Fit Jenny",          platform:"TikTok",    method:"DM",    status:"待发送",   lastContact:"—",       followers:89000,  projectId:"q2-summer" },
  { id:"glam_studio",    handle:"@glamstudio_hk",         name:"Glam Studio HK",     platform:"TikTok",    method:"Email", status:"已打开",   lastContact:"2天前",   followers:310000, projectId:"beauty-pool" },
  { id:"beauty_karen",   handle:"@beautytipskaren",       name:"Beauty Karen",       platform:"Instagram", method:"Email", status:"待发送",   lastContact:"—",       followers:64000,  projectId:"q2-summer" },
  { id:"rosy_glow",      handle:"@rosyglow_official",     name:"Rosy Glow",          platform:"Instagram", method:"Email", status:"已拒绝",   lastContact:"5天前",   followers:128000, projectId:"beauty-pool" },
  { id:"daily_delight",  handle:"@dailydelight_amy",      name:"Daily Delight Amy",  platform:"TikTok",    method:"DM",    status:"已回复",   lastContact:"6小时前", followers:115000, projectId:"q2-summer" },
  { id:"velvet_look",    handle:"@velvetlook_paris",      name:"Velvet Look Paris",  platform:"TikTok",    method:"Email", status:"待回复",   lastContact:"2天前",   followers:71000,  projectId:"beauty-pool" },
  { id:"beauty_de",      handle:"@beautylife_de",         name:"Beauty Life DE",     platform:"Instagram", method:"Email", status:"建联成功", lastContact:"1周前",   followers:87000,  projectId:"beauty-pool" },
  { id:"summer_look",    handle:"@summerlook_daily",      name:"Summer Look Daily",  platform:"TikTok",    method:"Email", status:"已打开",   lastContact:"3天前",   followers:47000,  projectId:"q2-summer" },
  { id:"yoga_sara",      handle:"@yogawithsara",          name:"Yoga With Sara",     platform:"Instagram", method:"Email", status:"待回复",   lastContact:"4天前",   followers:144000, projectId:"beauty-pool" },
];

const TASKS = [
  {
    projectId: "q2-summer",
    id: 1,
    name: "Q2 夏季外联 — 美妆博主",
    total: 24, sent: 18, opened: 12, replied: 4,
    status: "进行中", template: "首次建联 A", createdAt: "04-10",
  },
  {
    projectId: "beauty-pool",
    id: 2,
    name: "健身品类博主初次建联",
    total: 12, sent: 12, opened: 8, replied: 2,
    status: "已完成", template: "首次建联 B", createdAt: "04-05",
  },
  {
    projectId: "beauty-pool",
    id: 3,
    name: "CeraVe 竞品博主二次跟进",
    total: 8, sent: 3, opened: 2, replied: 1,
    status: "草稿", template: "二次催促", createdAt: "04-14",
  },
];

const INBOX_THREADS = [
  {
    projectId: "q2-summer",
    id: 1, handle: "@skincare_sam", avatar: "S",
    subject: "Re: 合作邀请 — MyBrand 护肤新品",
    preview: "Thanks for reaching out! I'd love to learn more about the collaboration...",
    time: "2小时前", unread: true, starred: true,
  },
  {
    projectId: "q2-summer",
    id: 2, handle: "@fit_jenny", avatar: "F",
    subject: "Re: 筋膜枪品牌合作",
    preview: "Hi! This sounds interesting. Could you share more details about the campaign requirements?",
    time: "昨天", unread: false, starred: false,
  },
  {
    projectId: "beauty-pool",
    id: 3, handle: "@glow_girl", avatar: "G",
    subject: "合作邀请 — MyBrand 护肤新品",
    preview: "（未回复）",
    time: "3天前", unread: false, starred: false,
  },
];

// ── Template data ──────────────────────────────────────────────────────────────
interface Template {
  id: number; name: string; scenes: string[];
  subject: string; body: string;
  usage: number; openRate: number; replyRate: number;
  lastUpdated: string;
}

const SCENE_CFG: Record<string, string> = {
  初次:   "bg-[#fdf5f0] text-[#c96442] border-[#f5c4a8]",
  简短:   "bg-[#f5f4ed] text-[#87867f] border-[#e8e6dc]",
  精品:   "bg-amber-50  text-amber-700  border-amber-200",
  跟进:   "bg-blue-50   text-blue-700   border-blue-200",
  确认:   "bg-violet-50 text-violet-700 border-violet-200",
  感谢:   "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function highlightVars(text: string) {
  return text.split(/(\{[^}]+\})/).map((p, i) =>
    p.startsWith("{") && p.endsWith("}")
      ? <span key={i} className="rounded bg-[#fdf5f0] px-0.5 font-mono text-[11px] text-[#c96442]">{p}</span>
      : <span key={i}>{p}</span>
  );
}

const TEMPLATES: Template[] = [
  {
    id: 1, name: "首次建联", scenes: ["初次"], lastUpdated: "04-12",
    subject: "I'd love to work with you, {creator_name}",
    body: "Hi {creator_name},\n\nI've been following your content and love how authentically you connect with your audience. Your recent posts on {platform} really stood out to us at {brand_name}.\n\nWe'd love to explore a collaboration on our upcoming {product_name} launch — I think your audience would genuinely connect with it.\n\nWould you be open to a quick chat?\n\nBest,\nSarah · {brand_name}",
    usage: 68, openRate: 42, replyRate: 15,
  },
  {
    id: 2, name: "快速破冰", scenes: ["初次", "简短"], lastUpdated: "04-08",
    subject: "Quick initial idea for {platform}",
    body: "Hey {creator_name}!\n\nWe have a quick idea that might work well for your {platform} audience. Mind if I share more?\n\n— Sarah at {brand_name}",
    usage: 45, openRate: 38, replyRate: 12,
  },
  {
    id: 3, name: "独家合作", scenes: ["初次", "精品"], lastUpdated: "04-10",
    subject: "Exclusive partnership opportunity from {brand_name}",
    body: "Hi {creator_name},\n\nWe have an exclusive partnership we'd love to share with you — including {product_name} gifting, a custom discount code, and a paid rate. This is available to a select group of creators only.\n\nInterested in learning more?\n\nWarm regards,\n{brand_name} Partnerships",
    usage: 31, openRate: 51, replyRate: 20,
  },
  {
    id: 4, name: "二次跟进", scenes: ["跟进"], lastUpdated: "04-06",
    subject: "Just checking in — {brand_name} x {creator_name}",
    body: "Hi {creator_name},\n\nJust circling back on my earlier email — wanted to make sure it didn't get buried! We're still very interested in collaborating with you on {brand_name}.\n\nNo worries if the timing isn't right — happy to reconnect whenever suits you.\n\nBest,\nSarah",
    usage: 22, openRate: 51, replyRate: 19,
  },
  {
    id: 5, name: "Brief 发送", scenes: ["确认"], lastUpdated: "04-14",
    subject: "Last note from {brand_name}",
    body: "Hi {creator_name},\n\nThank you for your interest! Please find the campaign brief attached.\n\nKey deliverables:\n• 1× {platform} post featuring {product_name}\n• Post within 2 weeks of receiving the package\n• Include our tracking link\n\nLooking forward to working together!\n\n{brand_name} Team",
    usage: 19, openRate: 64, replyRate: 28,
  },
  {
    id: 6, name: "合作确认", scenes: ["确认"], lastUpdated: "04-15",
    subject: "Our collab brief for you",
    body: "Hi {creator_name},\n\nExciting — we're all set to move forward! Quick summary:\n\n✅ Product: {product_name}\n✅ Platform: {platform}\n✅ Timeline: Per agreement\n✅ Compensation: Per agreement\n\nPlease confirm receipt and we'll ship your package right away.\n\nThanks,\n{brand_name}",
    usage: 14, openRate: 71, replyRate: 35,
  },
  {
    id: 7, name: "定制感谢", scenes: ["感谢"], lastUpdated: "04-16",
    subject: "Thank you for the collaboration, {creator_name}",
    body: "Hi {creator_name},\n\nThank you so much for your amazing content featuring {product_name}! The response from your audience has been incredible.\n\nWe'd love to keep this going — would you be open to future collaborations with {brand_name}?\n\nWith gratitude,\nSarah · {brand_name} Partnerships",
    usage: 11, openRate: 78, replyRate: 42,
  },
];

function TasksTab() {
  const { currentProject, currentProjectId } = useWorkspaceProject();
  const tasks = TASKS.filter((task) => task.projectId === currentProjectId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#87867f]">当前项目「{currentProject.name}」共 {tasks.length} 个任务</span>
        <button type="button" className="flex items-center gap-1.5 rounded-xl bg-[#141413] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#2a2a28]">
          <Plus className="h-3.5 w-3.5" />新建发送任务
        </button>
      </div>
      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e8e6dc] bg-white px-6 py-12 text-center">
          <p className="text-sm text-[#141413]">当前项目还没有发送任务</p>
          <p className="mt-1.5 text-xs text-[#87867f]">先建立首轮任务，后续发送与回复统计会自动归属到当前项目。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
          const progress = Math.round((task.sent / task.total) * 100);
          return (
            <div key={task.id} className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#141413]">{task.name}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium",
                      task.status === "进行中" ? "bg-blue-50 text-blue-700" :
                      task.status === "已完成" ? "bg-emerald-50 text-emerald-700" :
                      "bg-[#f5f4ed] text-[#87867f]")}>{task.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#87867f]">模板：{task.template} · 创建于 {task.createdAt}</div>
                  <div className="mt-3 flex gap-6 text-sm">
                    {[
                      { label: "发件总数", value: task.total },
                      { label: "已发送",   value: task.sent },
                      { label: "已打开",   value: `${task.opened} (${Math.round((task.opened/task.sent)*100)}%)` },
                      { label: "已回复",   value: `${task.replied} (${Math.round((task.replied/task.sent)*100)}%)` },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="text-xs text-[#87867f]">{m.label}</div>
                        <div className="mt-0.5 font-semibold text-[#141413]">{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-[#87867f]">
                      <span>发送进度</span><span>{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f0ece4]">
                      <div className="h-full rounded-full bg-[#c96442] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
                <button type="button" className="flex items-center gap-1 rounded-lg border border-[#e8e6dc] px-3 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]">
                  查看详情<ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}

function InboxTab() {
  const { currentProject, currentProjectId } = useWorkspaceProject();
  const { openCreatorProfile } = useCreatorProfile();
  const threads = INBOX_THREADS.filter((thread) => thread.projectId === currentProjectId);
  const [active, setActive] = useState<number | null>(threads[0]?.id ?? null);

  useEffect(() => {
    setActive(threads[0]?.id ?? null);
  }, [currentProjectId]);

  const activeThread = threads.find(t => t.id === active);
  return (
    <div className="flex h-[600px] gap-4">
      <div className="w-72 shrink-0 overflow-y-auto rounded-2xl border border-[#e8e6dc] bg-white">
        <div className="border-b border-[#e8e6dc] p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
            <input placeholder="搜索对话..." className="w-full rounded-lg border border-[#e8e6dc] py-1.5 pl-8 pr-3 text-xs text-[#141413] placeholder:text-[#87867f] focus:outline-none" />
          </div>
        </div>
        {threads.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#87867f]">
            当前项目「{currentProject.name}」暂无邮件对话
          </div>
        ) : threads.map(t => (
          <div key={t.id} role="button" tabIndex={0} onClick={() => setActive(t.id)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(t.id); } }}
            className={cn("w-full cursor-pointer border-b border-[#f0ece4] px-4 py-3 text-left last:border-0", active === t.id ? "bg-[#fdf9f5]" : "hover:bg-[#f5f4ed]")}>
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={(e) => { e.stopPropagation(); openCreatorProfile({ name: t.handle, handle: t.handle, avatarUrl: `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(t.handle)}&backgroundColor=fdf0e8`, region: "--", followers: "--", er: "--" }); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c96442] text-xs font-semibold text-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:ring-offset-1" aria-label={`查看 ${t.handle} 详情`}>{t.avatar}</button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={cn("truncate text-sm", t.unread ? "font-semibold text-[#141413]" : "text-[#4d4c48]")}>{t.handle}</span>
                  <span className="shrink-0 text-[10px] text-[#87867f]">{t.time}</span>
                </div>
                <div className="mt-0.5 truncate text-xs text-[#87867f]">{t.preview}</div>
              </div>
              {t.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c96442]" />}
            </div>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-[#e8e6dc] bg-white">
        {activeThread ? (
          <>
            <div className="flex items-center justify-between border-b border-[#e8e6dc] px-5 py-3">
              <div>
                <span className="font-semibold text-[#141413]">{activeThread.handle}</span>
                <p className="mt-0.5 text-xs text-[#87867f]">{activeThread.subject}</p>
              </div>
              <button type="button" className="flex items-center gap-1.5 rounded-lg border border-[#e8e6dc] px-3 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]">
                <ExternalLink className="h-3.5 w-3.5" />查看博主
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex justify-end">
                <div className="max-w-sm rounded-2xl rounded-tr-sm bg-[#141413] px-4 py-3 text-sm text-white">
                  <p className="font-medium">合作邀请 — MyBrand 护肤新品</p>
                  <p className="mt-2 leading-relaxed text-white/80">Hi {activeThread.handle.replace("@", "")}! I'm reaching out from MyBrand. We've been following your content and would love to collaborate on our new skincare launch...</p>
                  <p className="mt-2 text-xs text-white/50">04-10 · marketing@mybrand.com</p>
                </div>
              </div>
              {activeThread.id === 1 && (
                <div className="flex justify-start">
                  <div className="max-w-sm rounded-2xl rounded-tl-sm border border-[#e8e6dc] bg-[#f5f4ed] px-4 py-3 text-sm text-[#141413]">
                    <p className="leading-relaxed">Thanks for reaching out! I'd love to learn more about the collaboration. Could you share the campaign brief and compensation details?</p>
                    <p className="mt-2 text-xs text-[#87867f]">2小时前</p>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-[#e8e6dc] p-4">
              <textarea placeholder="回复..." rows={2} className="w-full resize-none rounded-xl border border-[#e8e6dc] bg-[#f5f4ed] px-3 py-2.5 text-sm text-[#141413] placeholder:text-[#87867f] focus:border-[#c96442]/40 focus:outline-none" />
              <div className="mt-2 flex justify-end">
                <button type="button" className="flex items-center gap-1.5 rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white hover:bg-[#b85a3b]">
                  <Reply className="h-3.5 w-3.5" />发送回复
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-[#87867f]">当前项目没有可查看的对话</div>
        )}
      </div>
    </div>
  );
}

// ── Templates extended data ────────────────────────────────────────────────────
interface MyTemplate extends Template {
  basedOn?: string; // name of the system template this was copied from
  wordCount?: number;
}

interface TrashItem {
  id: number; name: string; deletedDaysAgo: number;
}

const SYS_TEMPLATES: Template[] = TEMPLATES; // the 7 default system templates

const INIT_MY_TEMPLATES: MyTemplate[] = [
  {
    id: 101, name: "首次建联·复制", basedOn: "首次建联",
    scenes: ["初次"], lastUpdated: "04-15",
    subject: "Hey {creator_name}, collaboration idea from {brand_name}",
    body: "Hi {creator_name},\n\nWe've been following your amazing content on {platform} and have a collaboration idea tailored just for you and your audience around {product_name}.\n\nBest,\n{brand_name} Team",
    usage: 3, openRate: 48, replyRate: 18, wordCount: 42,
  },
  {
    id: 102, name: "夏季美妆专题",
    scenes: ["初次", "精品"], lastUpdated: "04-13",
    subject: "夏日美妆合作邀请 — {brand_name} × {creator_name}",
    body: "Hi {creator_name},\n\n夏日来了！我们正在为 {product_name} 系列寻找最能传递夏日氛围的创作者。\n\nBest,\n{brand_name}",
    usage: 11, openRate: 52, replyRate: 21, wordCount: 55,
  },
  {
    id: 103, name: "季末美妆促销",
    scenes: ["跟进"], lastUpdated: "04-17",
    subject: "Quick follow-up — {brand_name} x {creator_name}",
    body: "Hi {creator_name},\n\nJust circling back on our previous message. We'd love to partner with you before the end of the quarter.\n\n{brand_name}",
    usage: 6, openRate: 39, replyRate: 13, wordCount: 38,
  },
];

const INIT_TRASH: TrashItem[] = [
  { id: 201, name: "晨间护肤 routine", deletedDaysAgo: 25 },
  { id: 202, name: "初版促销",         deletedDaysAgo: 3  },
];

type TemplateTab = "all" | "system" | "mine" | "trash";

// ── SystemTemplateModal ────────────────────────────────────────────────────────
function SystemTemplateModal({ templateName, onClose, onCopyEdit }: {
  templateName: string; onClose: () => void; onCopyEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[400px] rounded-2xl border border-[#e8e6dc] bg-white p-6 shadow-2xl">
        <h3 className="font-semibold text-[#141413]">系统模板不可直接修改</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#87867f]">
          你可以复制一份到「我的模板」进行编辑，系统模板将始终保持原始不变。
        </p>
        <div className="mt-2 rounded-xl bg-[#faf9f5] px-3.5 py-2.5">
          <p className="text-xs text-[#4d4c48]">将基于 <span className="font-medium text-[#141413]">「{templateName}」</span> 创建副本</p>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-[#e8e6dc] py-2.5 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]">
            取消
          </button>
          <button type="button" onClick={onCopyEdit}
            className="flex-1 rounded-xl bg-[#c96442] py-2.5 text-sm font-medium text-white hover:bg-[#b85a3b]">
            复制并编辑
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TrashView ─────────────────────────────────────────────────────────────────
function TrashView({ trash, onRestore, onPermDelete, onClearAll, onBack }: {
  trash: TrashItem[];
  onRestore: (id: number) => void;
  onPermDelete: (id: number) => void;
  onClearAll: () => void;
  onBack: () => void;
}) {
  const [clearConfirm, setClearConfirm]   = useState(false);
  const [permConfirmId, setPermConfirmId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Trash header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack}
          className="text-sm text-[#87867f] hover:text-[#c96442]">← 返回模板</button>
        <span className="text-[#e8e6dc]">|</span>
        <span className="text-sm font-semibold text-[#141413]">回收站</span>
        <span className="rounded-full bg-[#f5f4ed] px-2 py-0.5 text-[10px] text-[#87867f]">{trash.length} 条</span>
        <div className="ml-auto">
          {clearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#87867f]">确认清空？</span>
              <button type="button" onClick={() => { onClearAll(); setClearConfirm(false); }}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">确认</button>
              <button type="button" onClick={() => setClearConfirm(false)}
                className="rounded-lg border border-[#e8e6dc] px-3 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]">取消</button>
            </div>
          ) : (
            <button type="button" onClick={() => setClearConfirm(true)} disabled={trash.length === 0}
              className="rounded-xl border border-red-200 px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-30">
              清空回收站
            </button>
          )}
        </div>
      </div>

      {trash.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e8e6dc] bg-[#faf9f5] py-16 text-center">
          <p className="text-sm text-[#87867f]">回收站为空</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trash.map(item => {
            const remaining = 30 - item.deletedDaysAgo;
            const nearExpiry = remaining <= 7;
            return (
              <div key={item.id}
                className={cn(
                  "rounded-2xl border bg-white p-5",
                  nearExpiry ? "border-amber-200" : "border-[#e8e6dc]"
                )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[#141413]">{item.name}</div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs">
                      <span className="text-[#87867f]">{item.deletedDaysAgo} 天前删除</span>
                      <span className={cn(
                        "font-medium",
                        nearExpiry ? "text-amber-600" : "text-[#87867f]"
                      )}>
                        {nearExpiry && "⚠ "}还有 {remaining} 天自动删除
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => onRestore(item.id)}
                      className="rounded-lg border border-[#e8e6dc] px-3 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]">
                      恢复
                    </button>
                    {permConfirmId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#87867f]">确认永久删除？</span>
                        <button type="button" onClick={() => { onPermDelete(item.id); setPermConfirmId(null); }}
                          className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs text-white hover:bg-red-600">确认</button>
                        <button type="button" onClick={() => setPermConfirmId(null)}
                          className="rounded-lg border border-[#e8e6dc] px-2.5 py-1.5 text-xs text-[#4d4c48]">取消</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setPermConfirmId(item.id)}
                        className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">
                        永久删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TemplateCard ───────────────────────────────────────────────────────────────
function TemplateCard({ template: t, isSystem, onEdit, onDelete }: {
  template: Template & { basedOn?: string };
  isSystem: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#e8e6dc] bg-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#141413]">{t.name}</span>
            {isSystem && (
              <span className="rounded-full bg-[#f5f4ed] px-1.5 py-0.5 text-[9px] font-medium text-[#87867f]">系统</span>
            )}
            {!isSystem && (t as MyTemplate).basedOn && (
              <span className="rounded-full bg-[#fdf5f0] px-1.5 py-0.5 text-[9px] font-medium text-[#c96442]/70">
                基于·{(t as MyTemplate).basedOn}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {t.scenes.map(s => (
              <span key={s} className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium",
                SCENE_CFG[s] ?? "bg-[#f5f4ed] text-[#87867f] border-[#e8e6dc]")}>{s}</span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button type="button" onClick={onEdit}
            className="flex items-center gap-1 rounded-lg border border-[#e8e6dc] px-2.5 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]">
            <Pencil className="h-3 w-3" />{isSystem ? "编辑" : "编辑"}
          </button>
          {!isSystem && onDelete && (
            <button type="button" onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e8e6dc] text-[#87867f] hover:border-red-200 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="mt-3 rounded-xl bg-[#faf9f5] px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#87867f]">主题行</span>
        <p className="mt-0.5 text-xs text-[#4d4c48]">{t.subject}</p>
      </div>

      {/* Body preview */}
      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#87867f]">
        {t.body.split("\n")[0]}
      </p>

      {/* Stats */}
      <div className="mt-4 flex items-end justify-between border-t border-[#f0ece4] pt-4">
        <div className="flex gap-5">
          {isSystem ? (
            <>
              {[
                { label: "全局使用", value: String(t.usage) },
                { label: "打开率",   value: `${t.openRate}%` },
                { label: "回复率",   value: `${t.replyRate}%`, accent: true },
              ].map(m => (
                <div key={m.label}>
                  <div className="text-[10px] text-[#87867f]">{m.label}</div>
                  <div className={cn("mt-0.5 text-sm font-semibold", m.accent ? "text-[#c96442]" : "text-[#141413]")}>
                    {m.value}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                { label: "字数",   value: `${(t as MyTemplate).wordCount ?? t.body.split(" ").length}` },
                { label: "打开率", value: `${t.openRate}%` },
                { label: "回复率", value: `${t.replyRate}%`, accent: true },
              ].map(m => (
                <div key={m.label}>
                  <div className="text-[10px] text-[#87867f]">{m.label}</div>
                  <div className={cn("mt-0.5 text-sm font-semibold", m.accent ? "text-[#c96442]" : "text-[#141413]")}>
                    {m.value}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <span className="text-[10px] text-[#c8c7c3]">更新 {t.lastUpdated}</span>
      </div>
    </div>
  );
}

// ── TemplatesTab ───────────────────────────────────────────────────────────────
function TemplatesTab() {
  const [tab, setTab]               = useState<TemplateTab>("all");
  const [myTemplates, setMyTemplates] = useState<MyTemplate[]>(INIT_MY_TEMPLATES);
  const [trash, setTrash]           = useState<TrashItem[]>(INIT_TRASH);
  const [sysModalFor, setSysModalFor] = useState<Template | null>(null);
  const [editTarget, setEditTarget] = useState<{ template: MyTemplate; isCopy?: boolean } | null>(null);
  const [creating, setCreating]     = useState(false);
  const [toast, setToast]           = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2500);
  };

  const handleSysEdit = (t: Template) => setSysModalFor(t);

  const handleCopyEdit = () => {
    if (!sysModalFor) return;
    const copy: MyTemplate = {
      ...sysModalFor,
      id: Date.now(),
      name: `${sysModalFor.name}·复制`,
      basedOn: sysModalFor.name,
      usage: 0, openRate: 0, replyRate: 0,
      lastUpdated: "04-18",
      wordCount: sysModalFor.body.split(" ").length,
    };
    setSysModalFor(null);
    setEditTarget({ template: copy, isCopy: true });
  };

  const handleMyEdit = (t: MyTemplate) => setEditTarget({ template: t });

  const handleSave = (updated: Template) => {
    const mine = updated as MyTemplate;
    setMyTemplates(prev => {
      const exists = prev.find(t => t.id === mine.id);
      return exists
        ? prev.map(t => t.id === mine.id ? mine : t)
        : [...prev, mine];
    });
    setEditTarget(null);
    setCreating(false);
    showToast(editTarget?.isCopy ? "副本已保存到「我的模板」" : "模板已保存");
  };

  const handleCreate = (t: Template) => {
    setMyTemplates(prev => [...prev, { ...t, wordCount: t.body.split(" ").length }]);
    setCreating(false);
    showToast("模板已创建");
  };

  const handleDelete = (id: number, name: string) => {
    setMyTemplates(prev => prev.filter(t => t.id !== id));
    setTrash(prev => [...prev, { id, name, deletedDaysAgo: 0 }]);
    showToast("已移入回收站，30 天内可恢复");
  };

  const handleRestore = (id: number) => {
    const item = trash.find(t => t.id === id);
    setTrash(prev => prev.filter(t => t.id !== id));
    if (item) {
      setMyTemplates(prev => [...prev, {
        id: item.id, name: item.name, scenes: [], subject: "", body: "",
        usage: 0, openRate: 0, replyRate: 0, lastUpdated: "04-18", wordCount: 0,
      }]);
    }
    showToast("已恢复");
  };

  const handlePermDelete = (id: number) => setTrash(prev => prev.filter(t => t.id !== id));
  const handleClearAll = () => setTrash([]);

  // Displayed list based on tab
  const sysCount  = SYS_TEMPLATES.length;
  const mineCount = myTemplates.length;
  const totalCount = sysCount + mineCount;
  const tabCount = tab === "all" ? totalCount : tab === "system" ? sysCount : tab === "mine" ? mineCount : trash.length;

  const editingTemplate = editTarget?.template ?? null;

  if (tab === "trash") {
    return (
      <>
        <TrashView trash={trash}
          onRestore={handleRestore}
          onPermDelete={handlePermDelete}
          onClearAll={handleClearAll}
          onBack={() => setTab("all")} />
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#141413] px-5 py-2.5 text-sm text-white shadow-xl">
            {toast}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Count */}
        <span className="text-sm text-[#87867f]">{tabCount} 个模板</span>

        {/* Tab pills */}
        <div className="flex gap-1 rounded-xl bg-[#f5f4ed] p-1">
          {(["all", "system", "mine"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t ? "bg-white text-[#141413] shadow-sm" : "text-[#87867f] hover:text-[#4d4c48]"
              )}>
              {t === "all" ? "全部" : t === "system" ? "系统模板" : "我的模板"}
            </button>
          ))}
        </div>

        {/* Trash link */}
        <button type="button" onClick={() => setTab("trash")}
          className="text-xs text-[#87867f] hover:text-[#c96442]">
          回收站{trash.length > 0 && <span className="ml-1 rounded-full bg-[#f5f4ed] px-1.5 py-0.5 text-[10px]">{trash.length}</span>}
        </button>

        {/* New template */}
        <button type="button" onClick={() => setCreating(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-[#141413] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#2a2a28]">
          <Plus className="h-3.5 w-3.5" />新建模板
        </button>
      </div>

      {/* ── Card grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* System templates */}
        {(tab === "all" || tab === "system") && SYS_TEMPLATES.map(t => (
          <TemplateCard key={`sys-${t.id}`} template={t} isSystem
            onEdit={() => handleSysEdit(t)} />
        ))}

        {/* My templates */}
        {(tab === "all" || tab === "mine") && myTemplates.map(t => (
          <TemplateCard key={`mine-${t.id}`} template={t} isSystem={false}
            onEdit={() => handleMyEdit(t)}
            onDelete={() => handleDelete(t.id, t.name)} />
        ))}
      </div>

      {/* ── Modals & Drawers ─────────────────────────────────────────────────── */}
      {sysModalFor && (
        <SystemTemplateModal
          templateName={sysModalFor.name}
          onClose={() => setSysModalFor(null)}
          onCopyEdit={handleCopyEdit} />
      )}

      {editingTemplate && (
        <TemplateDrawer
          template={editingTemplate}
          isCopy={editTarget?.isCopy}
          onClose={() => setEditTarget(null)}
          onSave={handleSave} />
      )}

      {creating && (
        <TemplateDrawer
          onClose={() => setCreating(false)}
          onSave={handleCreate} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#141413] px-5 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

// template = undefined → create mode; template provided → edit mode
function TemplateDrawer({ template, isCopy, onClose, onSave }: {
  template?: Template; isCopy?: boolean; onClose: () => void; onSave: (t: Template) => void;
}) {
  const isCreate = !template;
  const [name,       setName]       = useState(template?.name    ?? "");
  const [scenes,     setScenes]     = useState<string[]>(template?.scenes ?? []);
  const [subject,    setSubject]    = useState(template?.subject  ?? "");
  const [body,       setBody]       = useState(template?.body     ?? "");
  const [sceneInput, setSceneInput] = useState("");

  const VARS = ["{creator_name}", "{brand_name}", "{product_name}", "{platform}"];

  const insertVar = (v: string) => setBody(prev => prev + v);

  const addScene = () => {
    const s = sceneInput.trim();
    if (s && !scenes.includes(s)) setScenes(prev => [...prev, s]);
    setSceneInput("");
  };
  const removeScene = (s: string) => setScenes(prev => prev.filter(x => x !== s));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id:          template?.id       ?? Date.now(),
      name:        name.trim(),
      scenes,
      subject,
      body,
      usage:       template?.usage    ?? 0,
      openRate:    template?.openRate ?? 0,
      replyRate:   template?.replyRate ?? 0,
      lastUpdated: "04-18",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div className="relative flex h-full w-[820px] flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e6dc] px-6 py-4">
          <span className="font-semibold text-[#141413]">{isCopy ? `编辑副本 · 基于（${template?.name}）` : isCreate ? "新建模板" : "编辑模板"}</span>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#87867f] hover:bg-[#f5f4ed]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Two-column body */}
        <div className="grid flex-1 grid-cols-2 overflow-hidden">

          {/* Left — live email preview */}
          <div className="flex flex-col overflow-y-auto border-r border-[#e8e6dc] bg-[#faf9f5] p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-[#87867f]">实时预览</p>

            <div className="rounded-2xl border border-[#e8e6dc] bg-white">
              {/* Sender */}
              <div className="flex items-center gap-3 border-b border-[#f0ece4] px-5 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c96442] text-sm font-semibold text-white">S</div>
                <div>
                  <div className="text-sm font-medium text-[#141413]">Sarah from MyBrand</div>
                  <div className="text-[11px] text-[#87867f]">marketing@mybrand.com</div>
                </div>
              </div>

              <div className="space-y-2.5 px-5 py-4">
                <div className="flex gap-2 text-xs">
                  <span className="w-10 shrink-0 font-medium text-[#87867f]">收件人</span>
                  <span className="rounded bg-[#fdf5f0] px-1.5 font-mono text-[#c96442]">{"{creator_name}"}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="w-10 shrink-0 font-medium text-[#87867f]">主题</span>
                  <span className="leading-relaxed text-[#141413]">
                    {subject ? highlightVars(subject) : <span className="italic text-[#c8c7c3]">（请输入邮件主题）</span>}
                  </span>
                </div>
                <div className="border-t border-[#f0ece4]" />
                <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#141413]">
                  {body ? highlightVars(body) : <span className="italic text-[#c8c7c3]">（请输入正文内容）</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Right — edit form */}
          <div className="flex flex-col overflow-y-auto p-6">
            <div className="flex-1 space-y-4">

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">模板名称</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="如：首次建联 · 美妆"
                  className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] placeholder:text-[#87867f] focus:border-[#c96442]/40 focus:outline-none" />
              </div>

              {/* Scenes — editable */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">使用场景标签</label>

                {/* Current tags */}
                {scenes.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {scenes.map(s => (
                      <span key={s} className={cn(
                        "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                        SCENE_CFG[s] ?? "bg-[#f5f4ed] text-[#87867f] border-[#e8e6dc]"
                      )}>
                        {s}
                        <button type="button" onClick={() => removeScene(s)}
                          className="ml-0.5 opacity-60 hover:opacity-100">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add tag input */}
                <div className="flex gap-2">
                  <input value={sceneInput} onChange={e => setSceneInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addScene(); } }}
                    placeholder="输入标签后按 Enter 添加"
                    className="flex-1 rounded-xl border border-dashed border-[#e8e6dc] bg-[#faf9f5] px-3 py-2 text-xs text-[#141413] placeholder:text-[#87867f] focus:border-[#c96442]/40 focus:outline-none" />
                  <button type="button" onClick={addScene} disabled={!sceneInput.trim()}
                    className="rounded-xl border border-[#e8e6dc] px-3 py-2 text-xs text-[#4d4c48] hover:bg-[#f5f4ed] disabled:opacity-40">
                    添加
                  </button>
                </div>

                {/* Preset scene quick-pick */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.keys(SCENE_CFG).filter(s => !scenes.includes(s)).map(s => (
                    <button key={s} type="button" onClick={() => setScenes(prev => [...prev, s])}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium opacity-50 hover:opacity-100 transition-opacity",
                        SCENE_CFG[s]
                      )}>
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">邮件主题</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Hi {creator_name}, ..."
                  className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] placeholder:text-[#87867f] focus:border-[#c96442]/40 focus:outline-none" />
              </div>

              {/* Body */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">正文内容</label>
                <textarea rows={9} value={body} onChange={e => setBody(e.target.value)}
                  placeholder={"Hi {creator_name},\n\n..."}
                  className="w-full resize-none rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] placeholder:text-[#87867f] focus:border-[#c96442]/40 focus:outline-none" />
              </div>

              {/* Variable chips */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">插入变量</label>
                <div className="flex flex-wrap gap-1.5">
                  {VARS.map(v => (
                    <button key={v} type="button" onClick={() => insertVar(v)}
                      className="rounded-lg border border-[#e8e6dc] bg-[#fdf5f0] px-2.5 py-1 font-mono text-[11px] text-[#c96442] hover:border-[#c96442]/40 hover:bg-[#fdf0e8]">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-2 border-t border-[#e8e6dc] pt-4">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-[#e8e6dc] py-2.5 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]">
                取消
              </button>
              <button type="button" onClick={handleSave} disabled={!name.trim()}
                className="flex-1 rounded-xl bg-[#c96442] py-2.5 text-sm font-medium text-white hover:bg-[#b85a3b] disabled:opacity-40">
                {isCreate ? "创建模板" : "保存"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsTab() {
  const { currentProject, currentProjectId } = useWorkspaceProject();
  const projectCreators = OUTREACH_CREATORS.filter((creator) => creator.projectId === currentProjectId);
  const sentCount = projectCreators.filter((creator) => creator.status !== "待发送").length;
  const openedCount = projectCreators.filter((creator) =>
    ["已打开", "待回复", "已回复", "建联成功", "已拒绝"].includes(creator.status)
  ).length;
  const repliedCount = projectCreators.filter((creator) =>
    ["已回复", "建联成功", "已拒绝"].includes(creator.status)
  ).length;
  const connectedCount = projectCreators.filter((creator) => creator.status === "建联成功").length;
  const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
  const replyRate = sentCount > 0 ? Math.round((repliedCount / sentCount) * 100) : 0;
  const templateBreakdown = TEMPLATES.slice(0, 4).map((template, index) => ({
    ...template,
    usage: Math.max(sentCount - index * 2, 0),
    openRate: Math.max(openRate - index * 3, 0),
    replyRate: Math.max(replyRate - index * 2, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e8e6dc] bg-white px-4 py-3 text-sm text-[#4d4c48]">
        当前统计范围：<span className="font-semibold text-[#141413]">{currentProject.name}</span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "已发送邮件", value: String(sentCount), sub: "当前项目" },
          { label: "平均打开率", value: `${openRate}%`,  sub: "当前项目" },
          { label: "平均回复率", value: `${replyRate}%`,  sub: "当前项目" },
          { label: "已建联博主", value: String(connectedCount), sub: "当前项目" },
        ].map(m => (
          <div key={m.label} className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
            <div className="text-xs text-[#87867f]">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold text-[#141413]">{m.value}</div>
            <div className="mt-1 text-xs text-emerald-600">{m.sub}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
        <div className="mb-4 font-semibold text-[#141413]">建联漏斗</div>
        <div className="space-y-2">
          {[
            { label: "发送", value: sentCount, color: "bg-[#c96442]", pct: "100%" },
            { label: "打开", value: openedCount,  color: "bg-amber-400",  pct: `${openRate}%` },
            { label: "回复", value: repliedCount,  color: "bg-emerald-500",pct: `${replyRate}%` },
            { label: "建联成功", value: connectedCount, color: "bg-violet-500",pct: sentCount > 0 ? `${Math.round((connectedCount / sentCount) * 100)}%` : "0%" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-16 shrink-0 text-xs text-[#87867f]">{s.label}</div>
              <div className="flex-1"><div className={cn("h-6 rounded-lg", s.color)} style={{ width: s.pct }} /></div>
              <div className="w-12 shrink-0 text-right text-sm font-medium text-[#141413]">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
        <div className="mb-4 font-semibold text-[#141413]">按模板拆分</div>
        <div className="space-y-3">
          {templateBreakdown.map(t => (
            <div key={t.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1 text-sm text-[#4d4c48]">{t.name}</div>
              <div className="flex gap-6 text-xs text-[#87867f]">
                <span>用 {t.usage} 次</span>
                <span>开 {t.openRate}%</span>
                <span className="font-medium text-[#c96442]">回 {t.replyRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmailSettingsTab() {
  const [senderName,      setSenderName]      = useState("Sarah from MyBrand");
  const [signature,       setSignature]       = useState("Sarah Chen\nBrand Partnerships | MyBrand\nwww.mybrand.com");
  const [connected,       setConnected]       = useState(true);
  const [showDisconnect,  setShowDisconnect]  = useState(false);
  const [toast,           setToast]           = useState(false);

  // Mock quota data
  const sentToday = 42;
  const dailyLimit = 500;
  const usagePct = sentToday / dailyLimit;
  const nearLimit = usagePct > 0.8;

  const handleSave = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  return (
    <div className="w-full space-y-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4" />设置已保存
        </div>
      )}

      {/* ── 卡片一：Gmail 绑定 ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
        <div className="mb-4 font-semibold text-[#141413]">Gmail 绑定</div>

        {connected ? (
          <>
            {/* Connected account row */}
            <div className="flex items-start justify-between rounded-xl border border-[#e8e6dc] bg-[#faf9f5] p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#87867f]" />
                  <span className="font-medium text-[#141413]">marketing@mybrand.com</span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs">
                  <span className="text-[#87867f]">Gmail</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />已连接
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button"
                  className="rounded-lg border border-[#e8e6dc] px-3 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]">
                  重新授权
                </button>
                <button type="button" onClick={() => setShowDisconnect(true)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                  断开连接
                </button>
              </div>
            </div>

            {/* Disconnect confirmation */}
            {showDisconnect && (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">断开后，进行中的发件任务将暂停。确认断开？</p>
                <div className="mt-3 flex gap-2">
                  <button type="button"
                    onClick={() => { setConnected(false); setShowDisconnect(false); }}
                    className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                    确认断开
                  </button>
                  <button type="button" onClick={() => setShowDisconnect(false)}
                    className="rounded-lg border border-[#e8e6dc] bg-white px-4 py-1.5 text-xs text-[#4d4c48] hover:bg-[#f5f4ed]">
                    取消
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Not connected — OAuth CTA */
          <div className="rounded-xl border border-dashed border-[#e8e6dc] bg-[#faf9f5] px-5 py-8 text-center">
            <Mail className="mx-auto h-8 w-8 text-[#c8c7c3]" />
            <p className="mt-3 text-sm text-[#87867f]">尚未绑定邮箱</p>
            <button type="button" onClick={() => setConnected(true)}
              className="mx-auto mt-4 flex items-center gap-1.5 rounded-xl bg-[#141413] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a2a28]">
              <Mail className="h-3.5 w-3.5" />连接 Gmail（OAuth 授权）
            </button>
          </div>
        )}

        {/* Bind another account */}
        <div className="mt-4 border-t border-[#f0ece4] pt-4">
          <p className="text-xs text-[#87867f]">支持绑定多个邮箱（多账号场景）</p>
          <button type="button"
            className="mt-2 flex items-center gap-1.5 text-sm text-[#c96442] hover:underline">
            <Plus className="h-3.5 w-3.5" />绑定新邮箱
          </button>
        </div>
      </div>

      {/* ── 卡片二：发件人信息 ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
        <div className="mb-4 font-semibold text-[#141413]">发件人信息</div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[#4d4c48]">
              发件人名称<span className="text-red-500">*</span>
            </label>
            <input value={senderName} onChange={e => setSenderName(e.target.value)}
              className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:outline-none" />
            <p className="mt-1.5 text-[10px] text-[#87867f]">博主收到邮件时看到的名字，必填</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">邮件签名</label>
            <textarea value={signature} onChange={e => setSignature(e.target.value)} rows={4}
              className="w-full resize-none rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:outline-none" />
            <p className="mt-1.5 text-[10px] text-[#87867f]">富文本，支持换行，可选</p>
          </div>
        </div>
      </div>

      {/* ── 卡片三：发送限额（只读） ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#e8e6dc] bg-white p-5">
        <div className="mb-1 font-semibold text-[#141413]">发送限额</div>
        <p className="mb-5 text-xs text-[#87867f]">数据来自 Gmail API 实时计数，纯展示，不可编辑</p>

        {/* Quota display */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs text-[#87867f]">今日已发送</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={cn("text-3xl font-semibold tabular-nums",
                nearLimit ? "text-[#c96442]" : "text-[#141413]")}>
                {sentToday}
              </span>
              <span className="text-sm text-[#87867f]">/ {dailyLimit} 封</span>
            </div>
          </div>
          <span className="text-xs text-[#87867f]">每日 00:00 UTC 重置</span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f0ece4]">
          <div
            className={cn("h-full rounded-full transition-all", nearLimit ? "bg-[#c96442]" : "bg-emerald-500")}
            style={{ width: `${Math.min(usagePct * 100, 100)}%` }}
          />
        </div>

        {/* Info note */}
        <p className="mt-3 text-[11px] text-[#87867f]">
          Gmail 账号每日最多发送 500 封；Google Workspace 账号最多 2,000 封。
          {nearLimit && (
            <span className="ml-1 font-medium text-[#c96442]">
              当日配额临近上限（{Math.round(usagePct * 100)}%）
            </span>
          )}
        </p>
      </div>

      {/* ── 底部操作 ───────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button type="button" onClick={handleSave}
          className="rounded-xl bg-[#141413] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a2a28]">
          保存设置
        </button>
      </div>
    </div>
  );
}

function NewTaskDrawer({ onClose }: { onClose: () => void }) {
  const { currentProject } = useWorkspaceProject();
  const [taskName, setTaskName]       = useState("");
  const [selTemplate, setSelTemplate] = useState("");

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[440px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e6dc] px-6 py-4">
          <div>
            <h2 className="font-semibold text-[#141413]">新建发件任务</h2>
            <p className="mt-0.5 text-xs text-[#87867f]">Step 1 · 基础配置</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#87867f] hover:bg-[#f5f4ed]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">任务名称</label>
              <input value={taskName} onChange={e => setTaskName(e.target.value)}
                placeholder={`如：${currentProject.name} 首轮建联`}
                className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] placeholder:text-[#87867f] focus:border-[#c96442]/40 focus:outline-none" />
              <p className="mt-1.5 text-[10px] text-[#87867f]">任务会自动归属到当前项目：{currentProject.name}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">归属项目</label>
              <div className="rounded-xl border border-[#e8e6dc] bg-white px-3.5 py-2.5 text-sm text-[#141413]">
                {currentProject.name}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">发件账号</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
                <select className="w-full appearance-none rounded-xl border border-[#e8e6dc] bg-[#faf9f5] py-2.5 pl-9 pr-3.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:outline-none">
                  <option>marketing@mybrand.com</option>
                </select>
              </div>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />已连接 · 正常
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">使用模板</label>
              <select value={selTemplate} onChange={e => setSelTemplate(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:outline-none">
                <option value="">选择邮件模板...</option>
                {TEMPLATES.map(t => (
                  <option key={t.id} value={t.name}>{t.name}（回复率 {t.replyRate}%）</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4d4c48]">计划发送时间</label>
              <input type="date" defaultValue="2026-04-21"
                className="w-full rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141413] focus:border-[#c96442]/40 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e8e6dc] px-6 py-4">
          <button type="button" disabled={!taskName.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f5f4ed] px-4 py-2.5 text-sm font-medium text-[#4d4c48] hover:bg-[#e8e6dc] disabled:opacity-40">
            下一步：内容配置<ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

type MetricKey = "sent" | "connected" | "waiting" | "rejected";

const STATUS_ACTIONS: Record<OutreachStatus, { label: string; action: string; primary: boolean }> = {
  待发送:   { label: "发送",     action: "send",      primary: true  },
  已发送:   { label: "查看",     action: "view",      primary: false },
  已打开:   { label: "跟进",     action: "followup",  primary: true  },
  待回复:   { label: "跟进",     action: "followup",  primary: true  },
  已回复:   { label: "查看对话", action: "view",      primary: true  },
  建联成功: { label: "查看",     action: "view",      primary: false },
  已拒绝:   { label: "查看",     action: "view",      primary: false },
};

function MailMgmtTab() {
  const router = useRouter();
  const { currentProject, currentProjectId } = useWorkspaceProject();
  const { openCreatorProfile } = useCreatorProfile();
  const [tabFilter, setTabFilter] = useState<OutreachStatus | "全部">("全部");
  const [search, setSearch] = useState("");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const projectCreators = OUTREACH_CREATORS.filter((creator) => creator.projectId === currentProjectId);
  const projectTasks = TASKS.filter((task) => task.projectId === currentProjectId);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    };
    if (menuOpenId) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpenId]);

  // Metric computations
  const totalReach = projectCreators.reduce((sum, creator) => sum + creator.followers, 0);
  const total = projectCreators.length;
  const sentCount = projectCreators.filter(c => c.status !== "待发送").length;
  const connectedCount = projectCreators.filter(c => c.status === "建联成功").length;
  const waitingCount = projectCreators.filter(c => c.status === "已回复").length;
  const rejectedCount = projectCreators.filter(c => c.status === "已拒绝").length;

  const metrics: Array<{ key: MetricKey; label: string; value: number; total: number; tone: string; iconBg: string; iconColor: string; barColor: string; icon: React.ReactNode }> = [
    { key: "sent",      label: "已发送",   value: sentCount,      total,               tone: "#4a5e7a",
      iconBg: "bg-[#eef2f7]", iconColor: "text-[#4a5e7a]", barColor: "bg-[#7892b3]",
      icon: <Send className="h-4 w-4" /> },
    { key: "connected", label: "建联成功", value: connectedCount, total,               tone: "#4a5a3a",
      iconBg: "bg-[#dde3c4]", iconColor: "text-[#4a5a3a]", barColor: "bg-[#7a8a5a]",
      icon: <CheckCircle2 className="h-4 w-4" /> },
    { key: "waiting",   label: "待回复",   value: waitingCount,   total: sentCount||1, tone: "#a6631f",
      iconBg: "bg-[#fbf5ed]", iconColor: "text-[#a6631f]", barColor: "bg-[#d97706]",
      icon: <MailOpen className="h-4 w-4" /> },
    { key: "rejected",  label: "已拒绝",   value: rejectedCount,  total,               tone: "#a14a2e",
      iconBg: "bg-[#fbf0ea]", iconColor: "text-[#a14a2e]", barColor: "bg-[#c96442]",
      icon: <XCircle className="h-4 w-4" /> },
  ];

  const pendingCount = projectCreators.filter(c => c.status === "已回复").length;

  const displayed = projectCreators.filter(c => {
    if (tabFilter !== "全部" && c.status !== tabFilter) return false;
    if (search && !c.handle.toLowerCase().includes(search.toLowerCase()) &&
                  !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const avatarSrc = (id: string) =>
    `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(id)}&backgroundColor=fdf0e8`;

  const tabCount = (s: OutreachStatus | "全部") =>
    s === "全部" ? projectCreators.length : projectCreators.filter(c => c.status === s).length;

  const TAB_KEYS: (OutreachStatus | "全部")[] =
    ["全部", "待发送", "已发送", "已打开", "待回复", "已回复", "建联成功", "已拒绝"];

  // Task grouping for right column
  const activeTask = projectTasks.find(t => t.status === "进行中") ?? projectTasks[0];
  const inProgressTasks = projectTasks.filter(t => t.status === "进行中");
  const draftTasks      = projectTasks.filter(t => t.status === "草稿");
  const completedTasks  = projectTasks.filter(t => t.status === "已完成");

  const goInbox = (c: OutreachCreator, action: string) => {
    router.push(`/workspace/outreach?tab=inbox&blogger=${encodeURIComponent(c.handle)}&action=${action}`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#e8e6dc] bg-white px-4 py-3 text-sm text-[#4d4c48]">
        当前正在查看 <span className="font-semibold text-[#141413]">{currentProject.name}</span> 的建联数据，覆盖约 {fmtN(totalReach)} 粉丝体量，指标、任务和收件动作都会按当前项目收口。
      </div>

      {/* ── Zone 1: 4 metric cards ───────────────────────────────────────────── */}
      <div className="relative">
        <div className="grid grid-cols-4 gap-4">
          {metrics.map(m => {
            const pct = m.total > 0 ? Math.round((m.value / m.total) * 100) : 0;
            return (
              <div key={m.key} className="rounded-2xl border border-[#e8e6dc] bg-white p-5 shadow-[0_4px_14px_-10px_rgba(20,20,19,0.08)]">
                <div className="flex items-center justify-between">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", m.iconBg, m.iconColor)}>{m.icon}</span>
                  <span className="text-[11px] font-medium text-[#87867f]">{m.label}</span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums text-[#141413]">{m.value}</span>
                  <span className="text-xs text-[#87867f]">/ {m.total}</span>
                  <span className="ml-auto text-[11px] font-medium tabular-nums" style={{ color: m.tone }}>{pct}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f0ece4]">
                  <div className={cn("h-full rounded-full transition-all", m.barColor)} style={{ width: `${Math.max(pct, 3)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating pending-badge, top-right */}
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={() => setTabFilter("已回复")}
            className="absolute -top-3 right-0 flex items-center gap-1.5 rounded-full border border-[#f1d9b5] bg-[#fbf5ed] px-3 py-1 text-[11px] font-medium text-[#a6631f] shadow-sm hover:bg-[#f5ebd8]"
          >
            <span className="inline-block h-0 w-0 border-x-[4px] border-b-[6px] border-x-transparent border-b-[#d97706]" />
            {pendingCount} 个待处理
          </button>
        )}
      </div>

      {/* ── Zone 2: 6:4 — Current task detail + Recent task list ─────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "6fr 4fr" }}>

        {/* Left: Current task key-value detail */}
        <div className="rounded-2xl border border-[#e8e6dc] bg-white p-6">
          {activeTask ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fdf5f0]">
                    <FileText className="h-4 w-4 text-[#c96442]" />
                  </div>
                  <span className="text-sm font-semibold text-[#141413]">当前任务</span>
                </div>
                <button type="button" className="text-[11px] text-[#c96442] hover:underline">查看全部任务 →</button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3.5">
                {[
                  { label: "任务名称", value: activeTask.name, strong: true },
                  { label: "状态",     value: activeTask.status, pill: true },
                  { label: "使用模板", value: activeTask.template },
                  { label: "发件账号", value: "hi@mybrand.co" },
                  { label: "创建时间", value: activeTask.createdAt },
                  { label: "计划发送", value: "今日 14:30" },
                ].map(kv => (
                  <div key={kv.label} className="flex items-center justify-between border-b border-dashed border-[#f0ece4] pb-2.5">
                    <span className="text-[11px] text-[#87867f]">{kv.label}</span>
                    {"pill" in kv && kv.pill ? (
                      <span className="rounded-full border border-[#d4dbb9] bg-[#eef0e2] px-2 py-0.5 text-[11px] font-medium text-[#5a6a4a]">
                        {kv.value}
                      </span>
                    ) : (
                      <span className={cn("text-xs text-[#141413]", kv.strong && "font-medium")}>
                        {kv.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-[#faf9f5] p-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#87867f]">发送进度</span>
                  <span className="tabular-nums text-[#4d4c48]">
                    发 {activeTask.sent}/{activeTask.total} · 打开 {activeTask.opened} · 回复 {activeTask.replied}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0ece4]">
                  <div
                    className="h-full rounded-full bg-[#c96442]/70 transition-all"
                    style={{ width: `${Math.round((activeTask.sent / activeTask.total) * 100)}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[#e8e6dc] bg-[#faf9f5] text-sm text-[#87867f]">
              当前项目还没有进行中的建联任务
            </div>
          )}
        </div>

        {/* Right: Grouped task list */}
        <div className="rounded-2xl border border-[#e8e6dc] bg-white p-4">
          <div className="mb-3 flex items-center justify-between px-2">
            <span className="text-sm font-semibold text-[#141413]">最近任务</span>
            <button type="button" onClick={() => setNewTaskOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-[#c96442] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#b5583a]">
              <Plus className="h-3 w-3" />新建
            </button>
          </div>

          <div className="space-y-4">
            {inProgressTasks.length > 0 && (
              <TaskGroup
                title="进行中"
                count={inProgressTasks.length}
                dotColor="bg-[#7a8a5a]"
                items={inProgressTasks.map(t => ({
                  id: t.id,
                  name: t.name,
                  meta: `${t.sent}/${t.total} 已发送`,
                  pct: Math.round((t.sent / t.total) * 100),
                  cta: "查看详情",
                  ctaTone: "primary" as const,
                }))}
              />
            )}
            {draftTasks.length > 0 && (
              <TaskGroup
                title="草稿"
                count={draftTasks.length}
                dotColor="bg-[#d97706]"
                items={draftTasks.map(t => ({
                  id: t.id,
                  name: t.name,
                  meta: `${t.total} 位博主 · ${t.template}`,
                  cta: "继续编辑",
                  ctaTone: "warn" as const,
                }))}
              />
            )}
            {completedTasks.length > 0 && (
              <TaskGroup
                title="已完成"
                count={completedTasks.length}
                dotColor="bg-[#c8c7c3]"
                items={completedTasks.map(t => ({
                  id: t.id,
                  name: t.name,
                  meta: `回复 ${t.replied}/${t.total}`,
                  cta: "查看报告",
                  ctaTone: "ghost" as const,
                }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Zone 3: Full-width tracking table ────────────────────────────────── */}
      <div className="rounded-2xl border border-[#e8e6dc] bg-white">

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-[#e8e6dc] px-5 py-3">
          <span className="text-sm font-semibold text-[#141413]">建联追踪</span>

          <div className="flex flex-wrap gap-1.5">
            {TAB_KEYS.map(s => (
              <button key={s} type="button"
                onClick={() => setTabFilter(s)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  tabFilter === s
                    ? "bg-[#c96442] text-white"
                    : "bg-[#f5f4ed] text-[#87867f] hover:bg-[#e8e6dc]"
                )}>
                {s}<span className="ml-1 opacity-60">{tabCount(s)}</span>
              </button>
            ))}
          </div>

          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索博主..."
              className="w-44 rounded-lg border border-[#e8e6dc] py-1.5 pl-8 pr-3 text-xs text-[#141413] placeholder:text-[#87867f] focus:border-[#c96442]/40 focus:outline-none" />
          </div>
        </div>

        {/* Column header */}
        <div className="grid items-center gap-3 border-b border-[#f0ece4] bg-[#faf9f5] px-5 py-2.5 text-xs font-medium text-[#87867f]"
          style={{ gridTemplateColumns: "minmax(0,2fr) 80px 100px 84px 120px 36px" }}>
          <span>博主</span>
          <span>建联方式</span>
          <span>状态</span>
          <span>最后联系</span>
          <span>操作</span>
          <span />
        </div>

        {/* Rows */}
        {displayed.length === 0 && (
          <div className="rounded-b-2xl py-12 text-center text-sm text-[#87867f]">暂无符合条件的博主</div>
        )}
        {displayed.map((c, idx) => {
          const action = STATUS_ACTIONS[c.status];
          return (
            <div key={c.id}
              className={cn(
                "grid items-center gap-3 border-b border-[#f0ece4] px-5 py-3 last:rounded-b-2xl last:border-b-0 hover:bg-[#faf9f5]",
                idx % 2 === 0 ? "bg-white" : "bg-[#fdfcfa]"
              )}
              style={{ gridTemplateColumns: "minmax(0,2fr) 80px 100px 84px 120px 36px" }}>

              {/* Creator */}
              <div className="flex min-w-0 items-center gap-2.5">
                <button type="button" onClick={() => openCreatorProfile({ name: c.name, handle: c.handle, avatarUrl: avatarSrc(c.id), region: "--", followers: fmtN(c.followers), er: "--", platform: (c.platform.toLowerCase() as "tiktok" | "instagram" | "youtube") })} className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c96442] focus:ring-offset-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarSrc(c.id)} alt={c.name} width={32} height={32}
                    className="h-8 w-8 rounded-full border border-[#e8e6dc] bg-[#fdf0e8]" />
                </button>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[#141413]">{c.handle}</div>
                  <div className="mt-0.5 text-[10px] text-[#87867f]">{c.platform} · {fmtN(c.followers)}</div>
                </div>
              </div>

              <span className="text-xs text-[#4d4c48]">{c.method}</span>

              <span className={cn(
                "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                OUTREACH_STATUS_CFG[c.status].badge
              )}>
                <span className={cn("mr-1 h-1.5 w-1.5 rounded-full", OUTREACH_STATUS_CFG[c.status].dot)} />
                {c.status}
              </span>

              <span className="text-xs text-[#87867f]">{c.lastContact}</span>

              <button type="button"
                onClick={() => goInbox(c, action.action)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
                  action.primary
                    ? "bg-[#c96442] text-white hover:bg-[#b5583a]"
                    : "border border-[#e8e6dc] text-[#4d4c48] hover:bg-[#f5f4ed] hover:text-[#c96442]"
                )}>
                {action.label}
              </button>

              {/* Overflow menu */}
              <div className="relative" ref={menuOpenId === c.id ? menuRef : undefined}>
                <button type="button"
                  onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#87867f] hover:bg-[#f5f4ed] hover:text-[#4d4c48]">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpenId === c.id && (
                  <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-[#e8e6dc] bg-white py-1 shadow-[0_10px_28px_-10px_rgba(20,20,19,0.18)]">
                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#4d4c48] hover:bg-[#faf9f5]">
                      <Pencil className="h-3.5 w-3.5" />修改状态
                    </button>
                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#4d4c48] hover:bg-[#faf9f5]">
                      <Mail className="h-3.5 w-3.5" />移入其他任务
                    </button>
                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#a14a2e] hover:bg-[#fbf0ea]">
                      <X className="h-3.5 w-3.5" />停止建联
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {newTaskOpen && <NewTaskDrawer onClose={() => setNewTaskOpen(false)} />}
    </div>
  );
}

// ── TaskGroup helper ───────────────────────────────────────────────────────────
interface TaskGroupItem {
  id: number;
  name: string;
  meta: string;
  pct?: number;
  cta: string;
  ctaTone: "primary" | "warn" | "ghost";
}

function TaskGroup({
  title, count, dotColor, items,
}: {
  title: string;
  count: number;
  dotColor: string;
  items: TaskGroupItem[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
        <span className="text-[11px] font-medium text-[#4d4c48]">{title}</span>
        <span className="text-[10px] text-[#87867f]">{count}</span>
      </div>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border border-[#f0ece4] bg-[#faf9f5] p-3 hover:bg-[#f5f4ed]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-[#141413]">{item.name}</div>
                <div className="mt-1 text-[10px] text-[#87867f]">{item.meta}</div>
                {item.pct !== undefined && (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#f0ece4]">
                    <div className="h-full rounded-full bg-[#7a8a5a]" style={{ width: `${item.pct}%` }} />
                  </div>
                )}
              </div>
              <button type="button" className={cn(
                "shrink-0 rounded-md px-2 py-1 text-[10px] font-medium whitespace-nowrap",
                item.ctaTone === "primary" && "bg-white text-[#c96442] hover:bg-[#fbf0ea]",
                item.ctaTone === "warn"    && "bg-[#fbf5ed] text-[#a6631f] hover:bg-[#f5ebd8]",
                item.ctaTone === "ghost"   && "text-[#87867f] hover:text-[#4d4c48]",
              )}>
                {item.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TAB_COMPONENTS: Record<TabKey, React.ComponentType> = {
  "mail-mgmt": MailMgmtTab,
  tasks: TasksTab,
  inbox: InboxTab,
  templates: TemplatesTab,
  stats: StatsTab,
  "email-settings": EmailSettingsTab,
};

function OutreachContent() {
  const searchParams = useSearchParams();
  const { currentProject } = useWorkspaceProject();
  const tab = (searchParams.get("tab") as TabKey) ?? "mail-mgmt";
  const TabContent = TAB_COMPONENTS[tab] ?? MailMgmtTab;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e8e6dc] bg-[#faf9f5] px-4 py-3 text-sm text-[#4d4c48]">
        当前项目视角：<span className="font-semibold text-[#141413]">{currentProject.name}</span>。邮件任务、收件箱与建联统计都会围绕这个项目收口。
      </div>
      <TabContent />
    </div>
  );
}

export default function OutreachPage() {
  return (
    <Suspense fallback={<div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded-xl bg-[#f0ece4]" /><div className="h-64 animate-pulse rounded-2xl bg-[#f0ece4]" /></div>}>
      <OutreachContent />
    </Suspense>
  );
}
