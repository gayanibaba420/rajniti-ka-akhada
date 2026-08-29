import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getArticleIdBySlug } from "@/lib/articles";
import { stripUnsafeMarkup } from "@/lib/types";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { z } from "zod";

const commentSchema = z.object({
  slug: z.string(),
  authorName: z.string().trim().min(2).max(80),
  content: z.string().trim().min(5).max(500),
});

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");
    if (!slug) return jsonError("slug आवश्यक", 400);
    const articleId = await getArticleIdBySlug(slug);
    if (!articleId) return jsonOk({ comments: [] });
    const comments = await prisma.comment.findMany({
      where: { articleId, approved: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { content: true, authorName: true, createdAt: true },
    });
    return jsonOk({ comments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = commentSchema.parse(await request.json());
    const articleId = await getArticleIdBySlug(body.slug);
    if (!articleId) return jsonError("लेख नहीं मिला", 404);
    const comment = await prisma.comment.create({
      data: {
        articleId,
        authorName: stripUnsafeMarkup(body.authorName),
        content: stripUnsafeMarkup(body.content),
        approved: false,
      },
    });
    return jsonOk({ comment: { id: comment.id }, message: "टिप्पणी समीक्षा के लिए भेजी गई" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
