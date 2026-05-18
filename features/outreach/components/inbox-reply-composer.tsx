"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Reply, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RichEmailEditor } from "@/features/outreach/components/inbox-rich-editor";
import { TEMPLATES } from "@/features/outreach/data/templates";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

// §3.4.4: Auto follow-up is embedded in the inbox composer rather than a
// separate workflow, so users schedule a follow-up while writing the reply.
interface AutoFollowUp {
  enabled: boolean;
  waitDays: number;
  templateId: number;
  maxRounds: number;
}

const WAIT_DAY_OPTIONS = [2, 3, 5, 7] as const;
const MAX_ROUND_OPTIONS = [1, 2, 3] as const;

const DEFAULT_FOLLOW_UP: AutoFollowUp = {
  enabled: false,
  waitDays: 3,
  templateId: TEMPLATES.find((t) => t.scenes.includes("跟进"))?.id ?? TEMPLATES[0].id,
  maxRounds: 2,
};

// Caller should remount this component (via React `key`) when the active
// thread changes, so the composer naturally resets without internal effects.
export function InboxReplyComposer() {
  const [, setBody] = useState("");
  const [followUp, setFollowUp] = useState<AutoFollowUp>(DEFAULT_FOLLOW_UP);
  const [expanded, setExpanded] = useState(false);

  const followUpTemplates = useMemo(() => TEMPLATES.filter((t) => t.scenes.includes("跟进")), []);
  const activeTemplate = followUpTemplates.find((t) => t.id === followUp.templateId);

  const summary = followUp.enabled
    ? `${followUp.waitDays} 天后自动跟进 · ${activeTemplate?.name ?? "默认模板"} · 最多 ${followUp.maxRounds} 次`
    : "未启用自动跟进";

  const toggleFollowUpEnabled = () => {
    const enabled = !followUp.enabled;
    setFollowUp({ ...followUp, enabled });
    setExpanded(enabled);
  };

  return (
    <div className="border-t border-[#c5c0b1]">
      <div className="p-4">
        <RichEmailEditor onChange={setBody} placeholder="回复..." />
      </div>

      <FollowUpRow
        followUp={followUp}
        summary={summary}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((v) => !v)}
        onToggleEnabled={toggleFollowUpEnabled}
      />

      {expanded && followUp.enabled ? (
        <FollowUpControls
          followUp={followUp}
          templates={followUpTemplates}
          onChange={setFollowUp}
        />
      ) : null}

      <div className="flex items-center justify-end border-t border-[#eceae3] px-4 py-3">
        <Button
          unstyled
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-[#ff4f00] px-4 py-2 text-sm font-medium text-[#fffefb] hover:bg-[#ff4f00]"
        >
          <Reply className="h-3.5 w-3.5" />
          {followUp.enabled ? "发送并安排跟进" : "发送回复"}
        </Button>
      </div>
    </div>
  );
}

interface FollowUpRowProps {
  followUp: AutoFollowUp;
  summary: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleEnabled: () => void;
}

function FollowUpRow({
  followUp,
  summary,
  expanded,
  onToggleExpanded,
  onToggleEnabled,
}: FollowUpRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#eceae3] bg-[#fffdf9] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Toggle
          checked={followUp.enabled}
          onCheckedChange={onToggleEnabled}
          size="sm"
          aria-label="自动跟进开关"
        />
        <span className="shrink-0 text-xs font-medium text-[#201515]">自动跟进</span>
        <span className="min-w-0 truncate text-[11px] text-[#939084]">{summary}</span>
      </div>
      <Button
        unstyled
        type="button"
        onClick={onToggleExpanded}
        disabled={!followUp.enabled}
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors",
          followUp.enabled
            ? "text-[#36342e] hover:bg-[#eceae3]"
            : "cursor-not-allowed text-[#c5c0b1]",
        )}
      >
        {expanded ? "收起" : "配置"}
        <ChevronDown className={cn("h-3 w-3 transition-transform", expanded ? "rotate-180" : "")} />
      </Button>
    </div>
  );
}

interface FollowUpControlsProps {
  followUp: AutoFollowUp;
  templates: typeof TEMPLATES;
  onChange: (next: AutoFollowUp) => void;
}

function FollowUpControls({ followUp, templates, onChange }: FollowUpControlsProps) {
  return (
    <div className="space-y-3 border-t border-[#eceae3] bg-[#fffdf9] px-4 pb-3">
      <ControlGroup label="等待回复">
        <div className="flex flex-wrap gap-1.5">
          {WAIT_DAY_OPTIONS.map((d) => (
            <PillButton
              key={d}
              active={followUp.waitDays === d}
              onClick={() => onChange({ ...followUp, waitDays: d })}
            >
              {d} 天
            </PillButton>
          ))}
        </div>
      </ControlGroup>

      <ControlGroup label="跟进模板">
        <select
          value={followUp.templateId}
          onChange={(e) => onChange({ ...followUp, templateId: Number(e.target.value) })}
          className="w-full max-w-xs rounded-md border border-[#c5c0b1] bg-[#fffefb] px-2 py-1.5 text-xs text-[#201515] focus:border-[#ff4f00]/40 focus:outline-none"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · 回复率 {t.replyRate}%
            </option>
          ))}
        </select>
      </ControlGroup>

      <ControlGroup label="最多跟进">
        <div className="flex items-center gap-1.5">
          {MAX_ROUND_OPTIONS.map((n) => (
            <PillButton
              key={n}
              active={followUp.maxRounds === n}
              onClick={() => onChange({ ...followUp, maxRounds: n })}
            >
              {n} 次
            </PillButton>
          ))}
        </div>
      </ControlGroup>

      <div className="flex items-start gap-1.5 rounded-md bg-[#fffefb]/60 px-2.5 py-2 text-[11px] text-[#939084]">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[#ff4f00]" />
        <span>
          对方回复后会自动取消剩余跟进；跟进邮件发送前会出现在「待发送」列表，可随时编辑或取消。
        </span>
      </div>
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[11px] text-[#939084]">{label}</span>
      {children}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      unstyled
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1 text-[11px] transition-colors",
        active
          ? "border-[#ff4f00] bg-[#fff7f4] text-[#ff4f00]"
          : "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:border-[#c5c0b1]",
      )}
    >
      {children}
    </Button>
  );
}
