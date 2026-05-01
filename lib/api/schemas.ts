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
  OutreachSendRequest,
  ScenarioMatchRequest,
  ScenarioParseRequest,
  TrendingDiscoveryRequest,
} from "@/types/api";

const PlatformSchema = z.enum(["tiktok", "instagram", "youtube"]);

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

// /api/projects POST
export const CreateProjectInputSchema = z.object({
  name: z.string().min(1),
  productUrl: z.string().url().optional(),
  category: z.string().min(1),
  platform: PlatformSchema,
}) satisfies z.ZodType<CreateProjectInput>;

// /api/outreach POST
export const OutreachSendRequestSchema = z.object({
  creatorId: z.string().min(1),
  subject: z.string().min(1),
  content: z.string().min(1),
  projectId: z.string().min(1).optional(),
}) satisfies z.ZodType<OutreachSendRequest>;
