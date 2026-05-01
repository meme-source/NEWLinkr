// Mock notifications for the workspace sidebar.
// TODO Phase 5: replace with a real notifications service.

export type WorkspaceNotification = {
  id: number;
  icon: string;
  text: string;
  time: string;
  unread: boolean;
};

export const WORKSPACE_DEMO_NOTIFICATIONS: WorkspaceNotification[] = [
  { id: 1, icon: "📧", text: "@skincare_sam 回复了你的邮件", time: "2 小时前", unread: true },
  { id: 2, icon: "📈", text: "投放帖子 #38291 播放突破 50 万", time: "5 小时前", unread: true },
  { id: 3, icon: "⚠️", text: "帖子 #38105 48 小时数据异常", time: "昨天", unread: true },
  { id: 4, icon: "📥", text: "插件同步了 3 个新博主，待评估", time: "昨天", unread: false },
];
