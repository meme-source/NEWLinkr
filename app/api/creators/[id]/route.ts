// 达人详情
// GET /api/creators/:id
import { ok } from "@/lib/api/envelope";
import { withRoute } from "@/lib/api/handler";
import { getCreatorDetail } from "@/lib/services/creators";

export const GET = withRoute(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return ok(await getCreatorDetail(id));
  },
);
