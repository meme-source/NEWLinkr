// §3.7.1 Calendar event store — only holds **standalone** events (the "其他"
// category). Creator-bound events (达人档期 / 跟进提醒) live on
// OutreachCreator (`scheduledPublishAt` / `nextFollowUpAt`); project nodes
// (项目开始 / 项目结束) live on WorkspaceProject. The calendar surface
// merges these three sources at render time.

export type StandaloneEventType = "other";

export interface StandaloneCalendarEvent {
  id: string;
  type: StandaloneEventType;
  date: string; // ISO yyyy-mm-dd — start date
  // Optional end date (inclusive). When set, the event spans [date, endDate].
  // Only the "其他" category supports ranges; publish / followup are always
  // single-day because they map to a creator's specific publish or follow-up
  // date in the project.
  endDate?: string;
  title: string;
  notes?: string;
  // Optional project scoping. Null = appears in every project view (rare).
  projectId?: string;
  // Optional creator binding. Lets "其他" events reference a specific 博主
  // (e.g. "和 @creatorX 复盘") and turns the creator name into a clickable
  // entry point to the profile drawer in the day-panel.
  creatorId?: string;
}

// Mock seed: a couple of "其他" events so the new category isn't empty out
// of the box. Real data will replace this list when Phase 1 backend lands.
export const CALENDAR_EVENTS: StandaloneCalendarEvent[] = [
  {
    id: "evt-q2-launch-recap",
    type: "other",
    date: "2026-05-20",
    endDate: "2026-05-22",
    title: "Q2 投放中段复盘",
    notes: "拉齐目前 20 位博主的数据，对齐下半场节奏",
    projectId: "q2-summer",
  },
  {
    id: "evt-template-refresh",
    type: "other",
    date: "2026-05-11",
    title: "重写初次邀约模板",
    notes: "结合本月回复率数据更新通用模板",
    projectId: "q2-summer",
  },
  {
    id: "evt-beauty-recap",
    type: "other",
    date: "2026-05-28",
    title: "美妆博主池阶段总结",
    projectId: "beauty-pool",
  },
];

// Calendar event categories shown in the "新建事件" dropdown. The first three
// are user-selectable; 项目节点 is auto-rendered from project data and not
// listed here (you can't create a new project start/end from the calendar).
export type CalendarEventCategory = "publish" | "followup" | "other";

export const CATEGORY_LABEL: Record<CalendarEventCategory, string> = {
  publish: "达人档期",
  followup: "跟进提醒",
  other: "其他",
};

export const CATEGORY_DESCRIPTION: Record<CalendarEventCategory, string> = {
  publish: "约定博主的发文日期，写回 OutreachCreator",
  followup: "提醒自己跟进某位博主，写回 OutreachCreator",
  other: "其他临时安排，仅存在于日历",
};

// Visual tokens shared by chips on the calendar grid and rows in the day
// panel. Keep palette consistent with the project's warm earth tones.
export interface CalendarVisualToken {
  badge: string; // border + bg + text classes for chips
  dot: string; // small status dot
}

export const CATEGORY_VISUAL: Record<CalendarEventCategory | "milestone", CalendarVisualToken> = {
  publish: {
    badge: "border-[#fff7f4] bg-[#fff7f4] text-[#ff4f00]",
    dot: "bg-[#ff4f00]",
  },
  followup: {
    badge: "border-[#c5c0b1] bg-[#fffdf9] text-[#36342e]",
    dot: "bg-[#36342e]",
  },
  other: {
    badge: "border-[#c5c0b1] bg-[#eceae3] text-[#36342e]",
    dot: "bg-[#939084]",
  },
  milestone: {
    badge: "border-[#201515] bg-[#fffdf9] text-[#201515]",
    dot: "bg-[#201515]",
  },
};
