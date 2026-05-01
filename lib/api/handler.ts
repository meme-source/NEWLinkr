// Route handler wrapper. Wrap every `app/api/**/route.ts` export with this
// to get consistent error → response mapping and structured logging.
//
// Usage:
//   export const POST = withRoute(async (req) => {
//     const json = await req.json().catch(() => null);
//     if (json === null) throw new BadRequestError("Body must be valid JSON");
//     const input = MySchema.parse(json);          // ZodError handled here
//     const result = await myService(input);        // AppError handled here
//     return ok(result);
//   });
//
// Errors are mapped:
//   - ZodError              -> 400 with formatted issues
//   - AppError subclass     -> error.status with error.message, plus error.code logged
//   - anything else         -> 500 with a generic message; full error logged server-side
//
// Logging is intentionally `console.error` for now — when we add a real logger
// (pino/winston/structured), update this one place.

import { ZodError } from "zod";
import type { NextResponse } from "next/server";
import { fail, failValidation } from "@/lib/api/envelope";
import { AppError } from "@/lib/api/errors";

type RouteHandler<Args extends unknown[]> = (...args: Args) => Promise<NextResponse> | NextResponse;

export function withRoute<Args extends unknown[]>(
  handler: RouteHandler<Args>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      return mapErrorToResponse(error);
    }
  };
}

function mapErrorToResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return failValidation(error);
  }

  if (error instanceof AppError) {
    // Log domain errors at info-ish severity — they're expected outcomes.
    // (Switch to a real logger when one exists.)
    console.warn(`[api] ${error.code}: ${error.message}`);
    return fail(error.message, error.status);
  }

  // Unknown error: log full detail server-side, return generic message to client.
  console.error("[api] unhandled error", error);
  return fail("Internal server error", 500);
}
