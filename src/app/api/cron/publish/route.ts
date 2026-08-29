import { requireCronAuth } from "@/lib/api-utils";
import { processScheduledPosts } from "@/lib/articles";
import { handleApiError, jsonOk } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    requireCronAuth(request);
    const published = await processScheduledPosts();
    return jsonOk({ published, at: new Date().toISOString() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  return GET(request);
}
