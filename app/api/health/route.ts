import { ok } from "@/lib/api/envelope";

export async function GET() {
  return ok({ status: "healthy", timestamp: new Date().toISOString() });
}
