// Single source of truth for runtime validation of API request bodies.
//
// Convention: each schema is named after the type in `types/api.ts` it
// validates, with a `Schema` suffix. The handler in app/api/**/route.ts must
// call `Schema.safeParse(body)` — never `as Type`.
//
// When you add a new API route:
//   1. Declare the request type in types/api.ts
//   2. Add the matching schema here
//   3. Reference the schema from the route handler

import { z } from "zod";
import type {
  CompetitorDiscoveryRequest,
  CreateProjectInput,
  DiscoveryChatRequest,
  FindSimilarRequest,
  LibraryListRequest,
  OutreachSendRequest,
  ScenarioMatchRequest,
  ScenarioParseRequest,
  TrendingDiscoveryRequest,
  UpdateCollaborationStatusRequest,
} from "@/types/api";

const PlatformSchema = z.enum(["tiktok", "instagram", "youtube"]);

const CollaborationStatusSchema = z.enum([
  "pending",
  "queued",
  "sent",
  "collaborating",
  "completed",
  "paused",
  "rejected",
]);

// /api/discovery/competitor
export const CompetitorDiscoveryRequestSchema = z.object({
  projectId: z.string().min(1),
  platform: PlatformSchema,
  brandQuery: z.string().min(1),
  category: z.string().min(1),
  timeRangeDays: z.number().int().positive().max(365),
}) satisfies z.ZodType<CompetitorDiscoveryRequest>;

// /api/discovery/trending
export const TrendingDiscoveryRequestSchema = z.object({
  projectId: z.string().min(1),
  platform: PlatformSchema,
  category: z.string().min(1),
  timeRangeDays: z.union([z.literal(7), z.literal(14), z.literal(30)]),
}) satisfies z.ZodType<TrendingDiscoveryRequest>;

// /api/discovery/scenario — discriminated union on `action`
const ScenarioParseRequestSchema = z.object({
  action: z.literal("parse"),
  projectId: z.string().min(1),
  platform: PlatformSchema,
  productUrl: z.string().url().optional(),
  productDescription: z.string().min(1).optional(),
}) satisfies z.ZodType<ScenarioParseRequest>;

const ScenarioMatchRequestSchema = z.object({
  action: z.literal("match"),
  projectId: z.string().min(1),
  platform: PlatformSchema,
  sceneIds: z.array(z.string().min(1)).min(1),
}) satisfies z.ZodType<ScenarioMatchRequest>;

export const ScenarioRequestSchema = z
  .discriminatedUnion("action", [ScenarioParseRequestSchema, ScenarioMatchRequestSchema])
  // parse-flow constraint: at least one of productUrl or productDescription
  .refine(
    (input) =>
      input.action !== "parse" || Boolean(input.productUrl) || Boolean(input.productDescription),
    {
      path: ["productUrl"],
      message: "productUrl 或 productDescription 至少给一个",
    },
  );

// /api/discovery/chat — v3 SSE 流式接口请求体
//
// 文档：博主发现页实现逻辑.md §8.1。注意：响应是 SSE 事件流，不走 ApiResponse
// 信封；route 自己 new Response(stream, { headers: { ... } })。
const DiscoveryChipsSchema = z.object({
  platform: PlatformSchema,
  country: z.string().min(1),
  follower_bucket: z.enum(["nano", "micro", "mid", "macro", "mega", "any"]),
  views_bucket: z.enum(["lt_10k", "10k_100k", "100k_500k", "gte_500k", "any"]),
  contactable_only: z.boolean(),
});

export const DiscoveryChatRequestSchema = z.object({
  project_id: z.string().min(1),
  session_id: z.string().min(1),
  round: z.number().int().positive(),
  message: z.object({
    intent_hint: z.enum(["competitor_creators", "scenario_creators", "trending_creators"]),
    text: z.string().min(1),
    chips: DiscoveryChipsSchema,
  }),
  previous_result_id: z.string().min(1).nullable(),
}) satisfies z.ZodType<DiscoveryChatRequest>;

// /api/projects POST
export const CreateProjectInputSchema = z.object({
  name: z.string().min(1),
  productUrl: z.string().url().optional(),
  category: z.string().min(1),
  platform: PlatformSchema,
}) satisfies z.ZodType<CreateProjectInput>;

// /api/outreach POST
const OutreachPersonalizedSegmentSchema = z.object({
  text: z.string(),
  personalized: z.boolean().optional(),
});

const OutreachSendMessageSchema = z.object({
  creatorId: z.string().min(1),
  subject: z.string().min(1),
  content: z.string().min(1),
  subjectSegments: z.array(OutreachPersonalizedSegmentSchema).optional(),
  contentSegments: z.array(OutreachPersonalizedSegmentSchema).optional(),
  personalizedSegmentCount: z.number().int().nonnegative().optional(),
});

export const OutreachSendRequestSchema = z
  .object({
    creatorId: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    projectId: z.string().min(1).optional(),
    templateKey: z.string().min(1).optional(),
    senderAddress: z.string().email().optional(),
    mode: z.enum(["now", "scheduled"]).optional(),
    scheduledAt: z.string().min(1).optional(),
    attachmentCount: z.number().int().nonnegative().optional(),
    messages: z.array(OutreachSendMessageSchema).min(1).optional(),
  })
  .refine(
    (input) =>
      Boolean(input.messages?.length) || Boolean(input.creatorId && input.subject && input.content),
    {
      path: ["messages"],
      message: "messages 或 creatorId/subject/content 至少提供一组",
    },
  )
  .refine((input) => input.mode !== "scheduled" || Boolean(input.scheduledAt), {
    path: ["scheduledAt"],
    message: "定时发送必须提供 scheduledAt",
  }) satisfies z.ZodType<OutreachSendRequest>;

// /api/library — listCreators
export const LibraryListRequestSchema = z.object({
  scope: z.enum(["project", "all"]),
  projectId: z.string().min(1).optional(),
}) satisfies z.ZodType<LibraryListRequest>;

// /api/library/collaboration — updateCollaborationStatus
export const UpdateCollaborationStatusRequestSchema = z.object({
  creatorId: z.string().min(1),
  projectId: z.string().min(1),
  status: CollaborationStatusSchema,
}) satisfies z.ZodType<UpdateCollaborationStatusRequest>;

// /api/creator-search/find — 找相似 / 找平替统一入口（spec §8.2）
//
// 校验完成后由 lib/services/find-similar.ts 接管业务逻辑。schema 同时是 API
// 入参的可机读契约：前端 fetch 时按这份结构传参即可。
const SimilarFiltersSchema = z.object({
  hasEmail: z.boolean().optional(),
  excludeRejected: z.boolean().optional(),
  excludeSaved: z.boolean().optional(),
  activeRecently: z.boolean().optional(),
  language: z.string().min(1).nullable().optional(),
  country: z.string().min(1).nullable().optional(),
  minFollowers: z.number().int().nonnegative().optional(),
  minMedianViews: z.number().int().nonnegative().optional(),
});

export const FindSimilarRequestSchema = z
  .object({
    projectId: z.string().min(1).nullable().optional(),
    platform: PlatformSchema,
    seedHandle: z.string().min(1).optional(),
    seedCreatorId: z.string().min(1).optional(),
    mode: z.enum(["comprehensive", "budget", "seed"]),
    postSampleSize: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    coverSampleSize: z.union([z.literal(3), z.literal(5)]),
    minSimilarityForAlt: z.number().int().min(0).max(100).optional(),
    limit: z.number().int().positive().max(50).optional(),
    filters: SimilarFiltersSchema.optional(),
  })
  .refine((input) => Boolean(input.seedHandle ?? input.seedCreatorId), {
    path: ["seedHandle"],
    message: "seedHandle 或 seedCreatorId 至少给一个",
  }) satisfies z.ZodType<FindSimilarRequest>;
