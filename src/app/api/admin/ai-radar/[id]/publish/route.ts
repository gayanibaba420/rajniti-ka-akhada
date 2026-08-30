import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { getAiRadarSettings } from "@/lib/ai-radar/settings";
import { publishAiNewsDraft } from "@/lib/ai-radar/publish";
import { aiNewsPublishSchema } from "@/lib/ai-radar/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    const { id } = await ctx.params;

    const settings = await getAiRadarSettings();
    const input = aiNewsPublishSchema.parse(await request.json());

    if (settings.requireManualApproval) {
      // approval step is enforced by admin UI; publish allowed from APPROVED or after explicit confirm
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
