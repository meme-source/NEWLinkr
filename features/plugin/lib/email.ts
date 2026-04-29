import type {
  CreatorProfile,
  EmailTemplateKey,
  EmailTemplateSegment,
  ProjectSummary,
} from "@/features/plugin/types";
import {
  getCreatorEmail,
  getCreatorLocation,
  getCreatorReview,
  getCreatorType,
} from "@/features/plugin/lib/creator-helpers";

export function getCreatorPersonalizationSummary(
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  const location = getCreatorLocation(creator);
  const primaryTopic =
    creator.topics?.[0]?.label.replace(/^#/, "") ??
    creator.statBadges[0] ??
    getCreatorType(creator).replace("类", "");
  const secondaryTopic =
    creator.topics?.[1]?.label.replace(/^#/, "") ??
    creator.statBadges[1] ??
    "真实体验";
  const projectAngle = project?.productDescription.trim() || "这轮内容合作";
  const review = getCreatorReview(creator).replace(/[。.!！]$/, "");

  return {
    greetingName: creator.name,
    locationLabel: `${location.flag} ${location.country}`,
    primaryTopic,
    secondaryTopic,
    projectAngle,
    creatorProof: `${creator.handle} 最近围绕「${primaryTopic}」的内容和我们的「${projectAngle}」很契合`,
    aiReason: `${review}，适合用更自然的体验式内容切入`,
    replyAsk: "近期档期、报价区间和更适合的合作形式",
    email: getCreatorEmail(creator),
  };
}

export function getEmailTemplateSegments(
  template: EmailTemplateKey,
  creator: CreatorProfile,
  project?: ProjectSummary,
): EmailTemplateSegment[] {
  if (!template) {
    return [];
  }

  const info = getCreatorPersonalizationSummary(creator, project);

  if (template === "followup") {
    return [
      { text: "Hi " },
      { text: info.greetingName, personalized: true },
      { text: ",\n\n上次已经和你简单同步过合作方向，这边补充一下我们这轮的最新窗口。\n\n" },
      { text: "我重新看了一下你的账号，" },
      { text: info.creatorProof, personalized: true },
      { text: "。\n\n" },
      { text: "- 合作方向：" },
      { text: info.projectAngle, personalized: true },
      { text: "\n- 内容切入：" },
      { text: `${info.primaryTopic} / ${info.secondaryTopic}`, personalized: true },
      { text: "\n- 希望确认：近期档期、报价区间、可接受的合作形式\n\n如果方便的话，也可以直接回复到 " },
      { text: info.email, personalized: true },
      { text: "，我们会尽快跟进。\n\n谢谢！\n2Linkr 团队" },
    ];
  }

  if (template === "gifted") {
    return [
      { text: "Hi " },
      { text: info.greetingName, personalized: true },
      { text: ",\n\n我们正在为 " },
      { text: info.projectAngle, personalized: true },
      { text: " 寻找适合先体验、再决定合作形式的创作者。\n\n" },
      { text: "AI 觉得你很适合这轮寄样，是因为 " },
      { text: info.aiReason, personalized: true },
      { text: "。\n\n如果你愿意，我们可以先寄一份样品给你，等你体验后再一起确认是否做短视频、图文或长期合作。\n\n期待听听你的想法。\n2Linkr 团队" },
    ];
  }

  return [
    { text: "Hi " },
    { text: info.greetingName, personalized: true },
    { text: ",\n\n我们最近在筛选一批适合 " },
    { text: info.projectAngle, personalized: true },
    { text: " 的创作者，看到你的账号后觉得内容调性、受众画像和互动氛围都很匹配。\n\n" },
    { text: "尤其是 " },
    { text: info.creatorProof, personalized: true },
    { text: "，这部分非常适合做第一轮合作沟通。\n\n想先和你确认三件事：\n- 你最近是否方便接合作\n- 当前的大致报价区间\n- 更适合的合作形式（短视频 / 组合发布 / 长期合作）\n\n如果方便的话，可以直接回复这封邮件，我们会把更具体的 brief 发给你。\n\n谢谢！\n2Linkr 团队" },
  ];
}

export function getEmailTemplateDraft(
  template: EmailTemplateKey,
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  return getEmailTemplateSegments(template, creator, project)
    .map((segment) => segment.text)
    .join("");
}

export function getEmailSubjectSegments(
  template: EmailTemplateKey,
  creator: CreatorProfile,
  project?: ProjectSummary,
): EmailTemplateSegment[] {
  if (template === "followup") {
    return [
      { text: "跟进 " },
      { text: creator.name, personalized: true },
      { text: " 的合作档期" },
    ];
  }

  if (template === "gifted") {
    return [
      { text: creator.name, personalized: true },
      { text: "，想寄样给你体验 " },
      { text: project?.name ?? "这轮新品", personalized: true },
    ];
  }

  if (template === "intro") {
    return [
      { text: creator.name, personalized: true },
      { text: " x 2Linkr 内容合作邀约" },
    ];
  }

  return [];
}

export function getEmailTemplateSubject(
  template: EmailTemplateKey,
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  return getEmailSubjectSegments(template, creator, project)
    .map((segment) => segment.text)
    .join("");
}
