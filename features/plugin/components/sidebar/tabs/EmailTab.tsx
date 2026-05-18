"use client";

import { Check, Eye, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { Button } from "@/components/ui/button";
import type { CreatorProfile, EmailSendOptions, EmailTemplateKey } from "@/features/plugin/types";
import { SIDEBAR_CARD_RADIUS, getCreatorLocation } from "../shared";
import { EmailComposerCard, type SenderEmail } from "./EmailComposerCard";

export function EmailTab({
  creator,
  orderedRecipientCreators,
  filteredRecipientCreatorsCount,
  emailRecipientCount,
  selectedRecipientSet,
  confirmedRecipientSet,
  previewCreator,
  previewIndex,
  unconfirmedRecipientCount,
  isPreviewConfirmed,
  allFilteredRecipientsSelected,
  onToggleAllFilteredRecipients,
  onToggleRecipient,
  onSetPreviewRecipient,
  onToggleConfirmPreview,
  onPreviewPrev,
  onPreviewNext,
  onOpenProfile,
  // composer
  senderEmails,
  selectedSenderId,
  onChangeSelectedSenderId,
  selectedEmailTemplate,
  onSelectEmailTemplate,
  emailSubject,
  onChangeEmailSubject,
  bodyHtml,
  onChangeBody,
  emailAttachments,
  onChangeEmailAttachments,
  personalizedSegmentCount,
  canOpenEmailReview,
  onSendAction,
  sendMode,
  onChangeSendMode,
  sendMenuOpen,
  onToggleSendMenu,
  scheduledAt,
  onChangeScheduledAt,
}: {
  creator: CreatorProfile;
  orderedRecipientCreators: CreatorProfile[];
  filteredRecipientCreatorsCount: number;
  emailRecipientCount: number;
  selectedRecipientSet: Set<string>;
  confirmedRecipientSet: Set<string>;
  previewCreator: CreatorProfile;
  previewIndex: number;
  unconfirmedRecipientCount: number;
  isPreviewConfirmed: boolean;
  allFilteredRecipientsSelected: boolean;
  onToggleAllFilteredRecipients: () => void;
  onToggleRecipient: (creatorId: string) => void;
  onSetPreviewRecipient: (creatorId: string) => void;
  onToggleConfirmPreview: () => void;
  onPreviewPrev: () => void;
  onPreviewNext: () => void;
  onOpenProfile: (creatorId: string) => void;
  senderEmails: SenderEmail[];
  selectedSenderId: string;
  onChangeSelectedSenderId: (id: string) => void;
  selectedEmailTemplate: EmailTemplateKey;
  onSelectEmailTemplate: (key: EmailTemplateKey) => void;
  emailSubject: string;
  onChangeEmailSubject: (value: string) => void;
  bodyHtml: string;
  onChangeBody: (html: string) => void;
  emailAttachments: File[];
  onChangeEmailAttachments: (files: File[]) => void;
  personalizedSegmentCount: number;
  canOpenEmailReview: boolean;
  onSendAction: () => void;
  sendMode: EmailSendOptions["mode"];
  onChangeSendMode: (mode: EmailSendOptions["mode"]) => void;
  sendMenuOpen: boolean;
  onToggleSendMenu: () => void;
  scheduledAt: string;
  onChangeScheduledAt: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className={`${SIDEBAR_CARD_RADIUS} border border-[#c5c0b1] bg-[#fffefb] p-3`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 shrink-0 text-[#ff4f00]" />
            <div className="min-w-0">
              <div className="text-base font-semibold text-[#201515]">建联对象</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-[8px] bg-[#eceae3] px-2 py-0.5 text-[10.5px] font-semibold text-[#36342e]">
              已选 {emailRecipientCount}/{filteredRecipientCreatorsCount}
            </span>
            <Button
              unstyled
              type="button"
              disabled={filteredRecipientCreatorsCount === 0}
              onClick={onToggleAllFilteredRecipients}
              aria-pressed={allFilteredRecipientsSelected}
              aria-label={allFilteredRecipientsSelected ? "取消全选" : "全选"}
              className={cn(
                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-[#fffefb] transition-all disabled:cursor-not-allowed",
                allFilteredRecipientsSelected
                  ? "border-[#ff4f00] bg-[#fff7f4] text-[#ff4f00]"
                  : "border-[#c5c0b1] text-[#b5b2aa] hover:border-[#ff4f00]/35 hover:bg-[#fff7f4] hover:text-[#ff4f00]",
                filteredRecipientCreatorsCount === 0 &&
                  "text-[#c5c0b1] hover:border-[#c5c0b1] hover:bg-[#fffefb]",
              )}
            >
              <Check className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>

        {orderedRecipientCreators.length > 0 ? (
          <div className="mt-2 max-h-[224px] space-y-1.5 overflow-y-auto pr-0.5">
            {orderedRecipientCreators.map((targetCreator) => {
              const isSelected = selectedRecipientSet.has(targetCreator.id);
              const isPreviewing = previewCreator.id === targetCreator.id;
              const isCurrentCreator = targetCreator.id === creator.id;
              const isConfirmed = confirmedRecipientSet.has(targetCreator.id);
              const targetLocation = getCreatorLocation(targetCreator);
              return (
                <div
                  key={targetCreator.id}
                  className={cn(
                    "group flex h-10 items-center gap-1.5 rounded-[8px] border bg-[#fffefb] px-2 py-1 transition-all",
                    isSelected ? "border-[#ff4f00]/40 bg-[#fff7f4]" : "border-[#c5c0b1]",
                    isPreviewing && "ring-1 ring-[#c5c0b1]/75 ring-inset",
                  )}
                >
                  <Button
                    unstyled
                    type="button"
                    title={`选择 ${targetCreator.handle}`}
                    aria-pressed={isSelected}
                    onClick={() => onToggleRecipient(targetCreator.id)}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all",
                      isSelected
                        ? "border-[#ff4f00] bg-[#ff4f00] text-[#fffefb]"
                        : "border-[#b5b2aa] bg-[#fffdf9] text-transparent hover:border-[#ff4f00]/45",
                    )}
                  >
                    <Check className="h-2 w-2" />
                  </Button>
                  <CreatorAvatar
                    creator={targetCreator}
                    className="h-7 w-7 shrink-0 border border-[#fffefb]"
                    labelClassName="text-[10px]"
                  />
                  <Button
                    unstyled
                    type="button"
                    title={`预览 ${targetCreator.handle} 的个性化邮件`}
                    onClick={() => onSetPreviewRecipient(targetCreator.id)}
                    className="flex min-w-0 flex-1 flex-col justify-center text-left"
                  >
                    <span className="flex min-w-0 items-center gap-1">
                      <span className="min-w-0 truncate text-[12px] font-semibold text-[#201515]">
                        {targetCreator.handle}
                      </span>
                      {isCurrentCreator ? (
                        <span className="shrink-0 rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[9px] font-semibold text-[#939084]">
                          当前
                        </span>
                      ) : null}
                      {isSelected && isConfirmed ? (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[#fff1ea] px-1.5 py-0.5 text-[9px] font-semibold text-[#ff4f00]">
                          <Check className="h-2 w-2" />
                          已确认
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] text-[#939084]">
                      <span className="shrink-0">{targetLocation.flag}</span>
                      <span className="min-w-0 truncate">{targetLocation.country}</span>
                      <span className="shrink-0">· {targetCreator.followers}</span>
                    </span>
                  </Button>
                  <Button
                    unstyled
                    type="button"
                    aria-label={`查看 ${targetCreator.name}`}
                    title="查看账号主页"
                    onClick={() => onOpenProfile(targetCreator.id)}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#fffefb] text-[#939084] transition-all hover:bg-[#eceae3] hover:text-[#36342e]"
                  >
                    <Eye className="h-2.5 w-2.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-2 rounded-[8px] border border-dashed border-[#b5b2aa] bg-[#fffefb] px-3 py-5 text-center text-xs text-[#939084]">
            当前筛选下暂无对象
          </div>
        )}
      </div>

      <EmailComposerCard
        senderEmails={senderEmails}
        selectedSenderId={selectedSenderId}
        onChangeSelectedSenderId={onChangeSelectedSenderId}
        selectedEmailTemplate={selectedEmailTemplate}
        onSelectEmailTemplate={onSelectEmailTemplate}
        emailSubject={emailSubject}
        onChangeEmailSubject={onChangeEmailSubject}
        bodyHtml={bodyHtml}
        onChangeBody={onChangeBody}
        emailAttachments={emailAttachments}
        onChangeEmailAttachments={onChangeEmailAttachments}
        previewCreator={previewCreator}
        previewIndex={previewIndex}
        onPreviewPrev={onPreviewPrev}
        onPreviewNext={onPreviewNext}
        unconfirmedRecipientCount={unconfirmedRecipientCount}
        isPreviewConfirmed={isPreviewConfirmed}
        onToggleConfirmPreview={onToggleConfirmPreview}
        personalizedSegmentCount={personalizedSegmentCount}
        emailRecipientCount={emailRecipientCount}
        canOpenEmailReview={canOpenEmailReview}
        onSendAction={onSendAction}
        sendMode={sendMode}
        onChangeSendMode={onChangeSendMode}
        sendMenuOpen={sendMenuOpen}
        onToggleSendMenu={onToggleSendMenu}
        scheduledAt={scheduledAt}
        onChangeScheduledAt={onChangeScheduledAt}
      />
    </div>
  );
}
