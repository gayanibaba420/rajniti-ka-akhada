import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { publishAiNewsDraft } from "@/lib/ai-radar/publish";
import { aiNewsPublishSchema } from "@/lib/ai-radar/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    const { id } = await ctx.params;

    const input = aiNewsPublishSchema.parse(await request.json());

    const draft = await prisma.aiNewsDraft.findUnique({ where: { id } });
    if (!draft) return jsonError("AI समाचार ड्राफ्ट नहीं मिला", 404);
    if (draft.status === "FETCHED") {
      return jsonError("पहले AI ड्राफ्ट जनरेट करें", 400);
    }
    if (draft.status === "REJECTED") {
      return jsonError("अस्वीकृत ड्राफ्ट प्रकाशित नहीं किया जा सकता", 400);
    }

    const result = await publishAiNewsDraft(id, session, {
      featuredImageId: input.featuredImageId,
      authorName: input.authorName,
    });

    return jsonOk({
      message: "समाचार प्रकाशित — AI सामग्री सत्यापित करें",
      articleId: result.articleId,
      slug: result.slug,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
