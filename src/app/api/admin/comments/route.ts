import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    const comments = await prisma.comment.findMany({
      include: { article: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonOk({ comments });
  } catch (error) {
    return handleApiError(error);
  }
}
