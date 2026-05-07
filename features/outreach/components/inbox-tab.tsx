"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Search } from "lucide-react";

import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { InboxReplyComposer } from "@/features/outreach/components/inbox-reply-composer";
import { InboxMailbar } from "@/features/outreach/components/mailbar/inbox-mailbar";
import { INBOX_THREADS } from "@/features/outreach/data/inbox-threads";
import { cn } from "@/lib/utils";

// §3.4: Inbox is intentionally cross-project. The project filter that used to
// scope threads to the current project has been removed; instead each row
// shows a project chip so the user can read mail across all projects.
export function InboxTab() {
  const { openCreatorProfile } = useCreatorProfile();
  const searchParams = useSearchParams();
  // 从 ?handle=... 跳转进来时优先选中对应博主的 thread。
  // 用「override + lastHandle」派生 active —— 当 URL 的 handle 变了，重置 override，
  // 让新进来的博主立刻被选中。这是 React 官方推荐的"在 render 期同步外部状态"写法，
  // 比 useEffect + setState 更轻量也不触发级联渲染。
  const handleParam = searchParams.get("handle");
  const handleThreadId = handleParam
    ? (INBOX_THREADS.find((t) => t.handle === handleParam)?.id ?? null)
    : null;
  const [selection, setSelection] = useState<{
    override: number | null;
    lastHandle: string | null;
  }>(() => ({ override: null, lastHandle: handleParam }));
  if (selection.lastHandle !== handleParam) {
    setSelection({ override: null, lastHandle: handleParam });
  }
  const active = selection.override ?? handleThreadId ?? INBOX_THREADS[0]?.id ?? null;
  const setActive = (id: number) =>
    setSelection((prev) => ({ override: id, lastHandle: prev.lastHandle }));
  const activeThread = INBOX_THREADS.find((t) => t.id === active);

  return (
    <div className="flex flex-col gap-3">
      <InboxMailbar />
      <div className="flex min-h-[480px] gap-4">
        <div className="w-72 shrink-0 overflow-y-auto rounded-2xl border border-[#c5c0b1] bg-[#fffefb]">
          <div className="border-b border-[#c5c0b1] p-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#939084]" />
              <input
                placeholder="搜索博主 / 主题 / 正文"
                className="w-full rounded-lg border border-[#c5c0b1] py-1.5 pr-3 pl-8 text-xs text-[#201515] placeholder:text-[#939084] focus:outline-none"
              />
            </div>
          </div>
          {INBOX_THREADS.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#939084]">暂无邮件对话</div>
          ) : (
            INBOX_THREADS.map((t) => (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(t.id);
                  }
                }}
                aria-pressed={active === t.id}
                className={cn(
                  "relative w-full cursor-pointer border-b border-b-[#eceae3] px-4 py-3 text-left transition-colors outline-none last:border-b-0 focus-visible:bg-[#fff7f4] focus-visible:ring-2 focus-visible:ring-[#ff4f00]/25",
                  active === t.id ? "bg-[#fff7f4]" : "hover:bg-[#eceae3]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-2 bottom-2 left-0 w-0.5 rounded-r-full transition-colors",
                    active === t.id ? "bg-[#ff4f00]" : "bg-transparent",
                  )}
                />
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreatorProfile({ handle: t.handle });
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff4f00] text-xs font-semibold text-[#fffefb] transition-transform hover:scale-105 focus:ring-2 focus:ring-[#ff4f00] focus:ring-offset-1 focus:outline-none"
                    aria-label={`查看 ${t.handle} 详情`}
                  >
                    {t.avatar}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "truncate text-sm",
                          t.unread ? "font-semibold text-[#201515]" : "text-[#36342e]",
                        )}
                      >
                        {t.handle}
                      </span>
                      <span className="shrink-0 text-[10px] text-[#939084]">{t.time}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#939084]">
                      <span className="rounded-full bg-[#eceae3] px-1.5 py-0.5">
                        {t.projectName}
                      </span>
                      {t.round >= 2 ? (
                        <span className="rounded-full bg-[#fff7f4] px-1.5 py-0.5 text-[#ff4f00]">
                          第 {t.round} 轮
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 truncate text-xs text-[#939084]">{t.preview}</div>
                  </div>
                  {t.unread && (
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff4f00]" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-[#c5c0b1] bg-[#fffefb]">
          {activeThread ? (
            <>
              <div className="flex items-center justify-between border-b border-[#c5c0b1] px-5 py-3">
                <div>
                  <span className="font-semibold text-[#201515]">{activeThread.handle}</span>
                  <p className="mt-0.5 text-xs text-[#939084]">{activeThread.subject}</p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-[#c5c0b1] px-3 py-1.5 text-xs text-[#36342e] hover:bg-[#eceae3]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  查看博主
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <div className="flex justify-end">
                  <div className="max-w-sm rounded-2xl rounded-tr-sm bg-[#201515] px-4 py-3 text-sm text-[#fffefb]">
                    <p className="font-medium">合作邀请 — MyBrand 护肤新品</p>
                    <p className="mt-2 leading-relaxed text-[#fffefb]/80">
                      Hi {activeThread.handle.replace("@", "")}! I&apos;m reaching out from MyBrand.
                      We&apos;ve been following your content and would love to collaborate on our
                      new skincare launch...
                    </p>
                    <p className="mt-2 text-xs text-[#fffefb]/50">04-10 · marketing@mybrand.com</p>
                  </div>
                </div>
                {activeThread.id === 1 && (
                  <div className="flex justify-start">
                    <div className="max-w-sm rounded-2xl rounded-tl-sm border border-[#c5c0b1] bg-[#eceae3] px-4 py-3 text-sm text-[#201515]">
                      <p className="leading-relaxed">
                        Thanks for reaching out! I&apos;d love to learn more about the
                        collaboration. Could you share the campaign brief and compensation details?
                      </p>
                      <p className="mt-2 text-xs text-[#939084]">2小时前</p>
                    </div>
                  </div>
                )}
              </div>
              <InboxReplyComposer key={activeThread.id} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[#939084]">
              选择一封邮件以查看
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
