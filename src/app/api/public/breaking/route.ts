import { getBreakingNewsItems } from "@/lib/articles";
import { handleApiError, jsonOk } from "@/lib/api-utils";

export async function GET() {
  try {
    const items = await getBreakingNewsItems();
    return jsonOk({ items });
  } catch (error) {
    return handleApiError(error);
  }
}
