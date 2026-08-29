import { getSession } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/articles";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const analytics = await getAnalyticsSummary();
    return jsonOk(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}
