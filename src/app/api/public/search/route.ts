import { NextRequest } from "next/server";
import { searchArticles } from "@/lib/articles";
import { handleApiError, jsonOk } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 6);
    const { items } = await searchArticles(q, 1, limit);
    return jsonOk({
      items: items.map((a) => ({ slug: a.slug, title: a.title, categoryName: a.categoryName })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
