// §3.4: Inbox is a cross-project surface. Each thread carries projectName so
// the UI can show the project chip without filtering on the current project.
export interface InboxThread {
  id: number;
  projectId: string;
  projectName: string;
  handle: string;
  avatar: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  starred: boolean;
  round: number;
}

export const INBOX_THREADS: InboxThread[] = [
  {
    projectId: "q2-summer",
    projectName: "Q2夏季 Campaign",
    id: 1,
    handle: "@skincare_sam",
    avatar: "S",
    subject: "Re: 合作邀请 — MyBrand 护肤新品",
    preview: "Thanks for reaching out! I'd love to learn more about the collaboration...",
    time: "2小时前",
    unread: true,
    starred: true,
    round: 2,
  },
  {
    projectId: "q2-summer",
    projectName: "Q2夏季 Campaign",
    id: 2,
    handle: "@fit_jenny",
    avatar: "F",
    subject: "Re: 筋膜枪品牌合作",
    preview:
      "Hi! This sounds interesting. Could you share more details about the campaign requirements?",
    time: "昨天",
    unread: false,
    starred: false,
    round: 1,
  },
  {
    projectId: "beauty-pool",
    projectName: "美妆博主池",
    id: 3,
    handle: "@glow_girl",
    avatar: "G",
    subject: "合作邀请 — MyBrand 护肤新品",
    preview: "（未回复）",
    time: "3天前",
    unread: false,
    starred: false,
    round: 1,
  },
];
