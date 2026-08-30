import { getSession, requireRole } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { runAiNewsFetchOnly } from "@/lib/ai-radar/pipeline";
import { rateLimitAiEndpoint } from "@/lib/ai-radar/rate-limit";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);

    const limit = rateLimitAiEndpoint(session.id);
    if (!limit.ok) {
      return jsonError(`बहुत अधिक अनुरोध — ${Math.ceil((limit.retryAfterMs ?? 60000) / 1000)} सेकंड बाद पुनः प्रयास करें`, 429);
    }

    const result = await runAiNewsFetchOnly();
    return jsonOk({
      message: `खबरें प्राप्त: ${result.fetched}, सहेजी: ${result.stored}, छोड़ी: ${result.skipped}`,
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
