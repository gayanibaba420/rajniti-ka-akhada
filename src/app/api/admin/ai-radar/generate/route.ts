import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { generateDraftForRecord, generateDraftsForFetched } from "@/lib/ai-radar/pipeline";
import { rateLimitAiEndpoint } from "@/lib/ai-radar/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);

    const limit = rateLimitAiEndpoint(session.id);
    if (!limit.ok) {
      return jsonError(`बहुत अधिक अनुरोध — ${Math.ceil((limit.retryAfterMs ?? 60000) / 1000)} सेकंड बाद पुनः प्रयास करें`, 429);
    }

    const body = (await request.json().catch(() => ({}))) as { draftId?: string };
    if (body.draftId) {
      const result = await generateDraftForRecord(body.draftId);
      if (!result.ok) return jsonError(result.error ?? "जनरेशन विफल", 502);
      return jsonOk({ message: "AI ड्राफ्ट तैयार", generated: 1 });
    }

    const result = await generateDraftsForFetched();
    return jsonOk({
      message: `${result.generated} AI ड्राफ्ट तैयार`,
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
