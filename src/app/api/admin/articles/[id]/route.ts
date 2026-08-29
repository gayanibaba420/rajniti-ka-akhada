import { NextRequest } from "next/server";
import { canEditArticle, getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseContentInput, resolveArticleAuthorId, syncArticleTags, upsertTags } from "@/lib/articles";
import { computeReadTimeMinutes } from "@/lib/types";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { revalidatePublicPages } from "@/lib/revalidate";
import { articleInputSchema, prepareArticleInput } from "@/lib/validators";
import { tryPublishArticleToFacebook } from "@/lib/facebook";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const { id } = await ctx.params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } }, scheduledPost: true },
    });
    if (!article) return jsonError("लेख नहीं मिला", 404);
    if (!canEditArticle(session.role, session.id, article.createdById)) return jsonError("अनुमति नहीं", 403);
    return jsonOk({ article });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const { id } = await ctx.params;
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) return jsonError("लेख नहीं मिला", 404);
    if (!canEditArticle(session.role, session.id, existing.createdById)) return jsonError("अनुमति नहीं", 403);

    const input = articleInputSchema.partial().parse(
      prepareArticleInput(await request.json(), { existingStatus: existing.status }),
    );
    const content = input.content ? parseContentInput(input.content) : undefined;
    const readTimeMinutes = content ? computeReadTimeMinutes(content) : undefined;

    let publishedAt = input.publishedAt !== undefined ? (input.publishedAt ? new Date(input.publishedAt) : null) : undefined;
    const scheduledAt = input.scheduledAt !== undefined ? (input.scheduledAt ? new Date(input.scheduledAt) : null) : undefined;
    const status = input.status;

    if (status === "PUBLISHED") {
      requireRole(session.role, ["SUPER_ADMIN", "EDITOR", "AUTHOR"]);
      if (publishedAt === undefined && !existing.publishedAt) publishedAt = new Date();
    }
    if (status === "SCHEDULED") {
      requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    }

    let authorId: string | undefined;
    if (input.authorId !== undefined || input.authorName !== undefined) {
      authorId = await resolveArticleAuthorId(
        { authorId: input.authorId, authorName: input.authorName },
        session.id,
      );
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.excerpt !== undefined && { excerpt: input.excerpt }),
        ...(content !== undefined && { content: content as never }),
        ...(input.highlight !== undefined && { highlight: input.highlight }),
        ...(input.location !== undefined && { location: input.location }),
        ...(status !== undefined && { status }),
        ...(input.featured !== undefined && { featured: input.featured }),
        ...(input.breaking !== undefined && { breaking: input.breaking }),
        ...(input.trending !== undefined && { trending: input.trending }),
        ...(input.trendingOverride !== undefined && { trendingOverride: input.trendingOverride }),
        ...(readTimeMinutes !== undefined && { readTimeMinutes }),
        ...(input.seoTitle !== undefined && { seoTitle: input.seoTitle }),
        ...(input.seoDescription !== undefined && { seoDescription: input.seoDescription }),
        ...(input.canonicalUrl !== undefined && { canonicalUrl: input.canonicalUrl || null }),
        ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl || null }),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(scheduledAt !== undefined && { scheduledAt }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(authorId !== undefined && { authorId }),
        ...(input.featuredImageId !== undefined && { featuredImageId: input.featuredImageId }),
      },
    });

    if (input.tags) {
      const tags = await upsertTags(input.tags);
      await syncArticleTags(article.id, tags.map((t) => t.id));
    }

    if (status === "SCHEDULED" && scheduledAt) {
      await prisma.scheduledPost.upsert({
        where: { articleId: article.id },
        create: { articleId: article.id, publishAt: scheduledAt },
        update: { publishAt: scheduledAt, processed: false },
      });
    } else if (status === "PUBLISHED") {
      await prisma.scheduledPost.deleteMany({ where: { articleId: article.id } });
    }

    if (input.breaking) {
      await prisma.breakingNews.upsert({
        where: { articleId: article.id },
        create: { title: article.title, articleId: article.id, enabled: true, sortOrder: 0 },
        update: { title: article.title, enabled: true },
      });
    } else if (input.breaking === false) {
      await prisma.breakingNews.deleteMany({ where: { articleId: article.id } });
    }

    const category = await prisma.category.findUnique({ where: { id: article.categoryId }, select: { slug: true } });
    revalidatePublicPages({
      slug: article.slug,
      categorySlug: category?.slug,
    });
    if (input.slug && input.slug !== existing.slug) {
      revalidatePublicPages({ slug: existing.slug, categorySlug: category?.slug });
    }

    let facebookPublish = null;
    const becamePublished = status === "PUBLISHED" && existing.status !== "PUBLISHED";
    if (becamePublished) {
      facebookPublish = await tryPublishArticleToFacebook(article.id);
    }

    const full = await prisma.article.findUnique({
      where: { id: article.id },
      include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } } },
    });

    return jsonOk({ article: full ?? article, facebookPublish });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    const { id } = await ctx.params;
    const existing = await prisma.article.findUnique({
      where: { id },
      include: { category: { select: { slug: true } } },
    });
    if (!existing) return jsonError("लेख नहीं मिला", 404);
    await prisma.article.delete({ where: { id } });
    revalidatePublicPages({ slug: existing.slug, categorySlug: existing.category.slug });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
