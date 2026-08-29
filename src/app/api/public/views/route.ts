import { NextRequest } from "next/server";
import { getArticleIdBySlug, recordArticleView } from "@/lib/articles";
import { hashIp } from "@/lib/types";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();
    if (!slug || typeof slug !== "string") return jsonError("slug आवश्यक", 400);
    const articleId = await getArticleIdBySlug(slug);
    if (!articleId) return jsonError("लेख नहीं मिला", 404);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await recordArticleView(articleId, hashIp(ip));
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
