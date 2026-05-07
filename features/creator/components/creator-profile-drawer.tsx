"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, FileText, Folder, History, Mail, StickyNote, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RELATIONSHIP_BADGE, RELATIONSHIP_LABEL } from "@/features/library/data/status-config";
import type {
  Collaboration,
  CreatorRelationship,
  CreatorSource,
  TimelineEvent,
} from "@/features/library/types";
import type { Platform } from "@/types/api";
import { CollaborationsTab } from "./profile-tabs/collaborations-tab";
import { InfoTab } from "./profile-tabs/info-tab";
import { NotesTab } from "./profile-tabs/notes-tab";
import { OverviewTab } from "./profile-tabs/overview-tab";
import { C, Pill, PlatformBadge } from "./profile-tabs/shared";
import { TimelineTab } from "./profile-tabs/timeline-tab";

// CreatorProfileInput is consumed by every "open creator detail" surface
// (library, discovery results, outreach inbox). Phase 1 callers in the library
// pass the full CRM payload; lighter callers (discovery card, inbox row) pass
// only identity + summary fields and the 5 tabs render empty states.
export interface CreatorProfileInput {
  name: string;
  handle: string;
  avatarUrl: string;
  region: string;
  language?: string;
  category?: string;
  verified?: boolean;
  platform?: Platform;
  followers: string;
  er: string;
  tags?: string[];
  avgViews?: number;
  avgLikes?: number;

  currentProjectId?: string;
  relationship?: CreatorRelationship;
  owner?: string | null;
  source?: CreatorSource;
  lastContactAt?: string | null;
  lastResponseAt?: string | null;
  nextFollowUp?: string | null;
  addedAt?: string;
  emails?: string[];
  dms?: Partial<Record<Platform, string>>;
  socialLinks?: string[];
  collaborations?: Collaboration[];
  notes?: string;
  timeline?: TimelineEvent[];
}

interface Props {
  creator: CreatorProfileInput | null;
  onClose: () => void;
}

type TabId = "overview" | "info" | "timeline" | "collaborations" | "notes";

const TABS: { id: TabId; label: string; Icon: typeof BarChart3 }[] = [
  { id: "overview", label: "概览", Icon: BarChart3 },
  { id: "info", label: "资料", Icon: FileText },
  { id: "timeline", label: "时间线", Icon: History },
  { id: "collaborations", label: "合作", Icon: Folder },
  { id: "notes", label: "笔记", Icon: StickyNote },
];

export function CreatorProfileDrawer({ creator, onClose }: Props) {
  useEffect(() => {
    if (!creator) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [creator, onClose]);

  return (
    <AnimatePresence>
      {creator && (
        <>
          <motion.div
            key="bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(20,20,19,0.22)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[min(560px,95vw)] overflow-y-auto"
            style={{ background: C.ivory, boxShadow: "-30px 0 80px -40px rgba(20,20,19,0.35)" }}
          >
            {/* Key by handle so tab state + tab-local state reset cleanly when
                a different creator is opened — avoids setState-in-effect. */}
            <DrawerBody key={creator.handle} creator={creator} onClose={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerBody({ creator, onClose }: { creator: CreatorProfileInput; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("overview");
  return (
    <>
      <header
        className="sticky top-0 z-10 border-b px-6 py-4"
        style={{
          background: "rgba(250,249,245,0.92)",
          backdropFilter: "blur(10px)",
          borderColor: C.border,
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px]" style={{ color: C.stone }}>
            博主详情
          </span>
          <button
            onClick={onClose}
            className="rounded-full border p-1.5 transition-colors hover:bg-background"
            style={{ borderColor: C.border, color: C.stone }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creator.avatarUrl}
            alt={creator.name}
            className="h-14 w-14 rounded-full object-cover shadow-sm ring-2 ring-white"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-bold" style={{ color: C.ink }}>
                {creator.name}
              </h2>
              {creator.verified && <Pill tone="accent">认证</Pill>}
              <span className="text-[12px]" style={{ color: C.stone }}>
                {creator.handle}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12px]" style={{ color: C.charcoal }}>
              <span>{creator.region}</span>
              {creator.language && (
                <>
                  <span>·</span>
                  <span>{creator.language}</span>
                </>
              )}
              {creator.relationship && (
                <>
                  <span>·</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${RELATIONSHIP_BADGE[creator.relationship]}`}
                  >
                    {RELATIONSHIP_LABEL[creator.relationship]}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              style={{ background: C.terracotta }}
            >
              <Mail className="h-3.5 w-3.5" /> 发起建联
            </button>
            {creator.platform && <PlatformBadge platform={creator.platform} />}
          </div>
        </div>

        <nav className="mt-4 flex items-center gap-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                )}
                style={{
                  background: active ? C.terracottaSoft : "transparent",
                  color: active ? C.terracotta : C.charcoal,
                }}
              >
                <t.Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="px-6 py-6">
        {tab === "overview" && <OverviewTab creator={creator} />}
        {tab === "info" && <InfoTab creator={creator} />}
        {tab === "timeline" && <TimelineTab creator={creator} />}
        {tab === "collaborations" && <CollaborationsTab creator={creator} />}
        {tab === "notes" && <NotesTab creator={creator} />}
      </div>
    </>
  );
}
