import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { tryPublishArticleToFacebook } from "@/lib/facebook";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const { id } = await ctx.params;
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) return jsonError("लेख नहीं मिला", 404);
    if (article.status !== "PUBLISHED") {
      return jsonError("केवल प्रकाशित लेख Facebook पर भेजे जा सकते हैं", 400);
    }

    const facebookPublish = await tryPublishArticleToFacebook(id, true);
    const updated = await prisma.article.findUnique({
      where: { id },
      select: {
        facebookPostId: true,
        facebookPublishStatus: true,
        facebookPublishedAt: true,
        facebookPublishError: true,
      },
    });

    return jsonOk({ facebookPublish, article: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
