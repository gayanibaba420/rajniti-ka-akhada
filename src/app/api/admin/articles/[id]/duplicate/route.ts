import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { canEditArticle, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncArticleTags } from "@/lib/articles";
import { slugify } from "@/lib/types";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const { id } = await ctx.params;
    const source = await prisma.article.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    if (!source) return jsonError("लेख नहीं मिला", 404);
    if (!canEditArticle(session.role, session.id, source.createdById)) {
      return jsonError("अनुमति नहीं", 403);
    }

    let slug = `${source.slug}-copy`;
    let suffix = 2;
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${source.slug}-copy-${suffix}`;
      suffix++;
    }

    const copy = await prisma.article.create({
      data: {
        title: `${source.title} (प्रति)`,
        slug,
        excerpt: source.excerpt,
        content: source.content as Prisma.InputJsonValue,
        highlight: source.highlight,
        location: source.location,
        status: "DRAFT",
        featured: false,
        breaking: false,
        trending: false,
        trendingOverride: null,
        readTimeMinutes: source.readTimeMinutes,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        canonicalUrl: null,
        videoUrl: source.videoUrl,
        publishedAt: null,
        scheduledAt: null,
        categoryId: source.categoryId,
        authorId: source.authorId,
        createdById: session.id,
        featuredImageId: source.featuredImageId,
      },
    });

    await syncArticleTags(copy.id, source.tags.map((t) => t.tagId));

    const full = await prisma.article.findUnique({
      where: { id: copy.id },
      include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } } },
    });

    return jsonOk({ article: full ?? copy, message: "ड्राफ्ट प्रति बनाई गई" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
