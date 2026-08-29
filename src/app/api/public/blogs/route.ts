import { NextRequest } from "next/server";
import { countPublishedBlogPosts, getPublishedBlogPosts } from "@/lib/blogs";
import { handleApiError, jsonOk } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(24, Math.max(1, Number(searchParams.get("pageSize") ?? 12)));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      getPublishedBlogPosts({ limit: pageSize, skip }),
      countPublishedBlogPosts(),
    ]);

    return jsonOk({ items, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
