import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseContentInput,
  processScheduledPosts,
  resolveArticleAuthorId,
  syncArticleTags,
  upsertTags,
} from "@/lib/articles";
import { computeReadTimeMinutes, slugify } from "@/lib/types";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { revalidatePublicPages } from "@/lib/revalidate";
import { articleInputSchema, prepareArticleInput } from "@/lib/validators";
import { tryPublishArticleToFacebook } from "@/lib/facebook";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit") ?? 50);

    if (session.role === "AUTHOR") {
      const rows = await prisma.article.findMany({
        where: {
          createdById: session.id,
          ...(status ? { status: status as never } : {}),
        },
        include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } } },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });
      return jsonOk({ articles: rows });
    }

    const rows = await prisma.article.findMany({
      where: status ? { status: status as never } : {},
      include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return jsonOk({ articles: rows });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const input = articleInputSchema.parse(prepareArticleInput(await request.json()));
    const content = parseContentInput(input.content);
    const readTimeMinutes = computeReadTimeMinutes(content);

    let publishedAt: Date | null = input.publishedAt ? new Date(input.publishedAt) : null;
    const scheduledAt: Date | null = input.scheduledAt ? new Date(input.scheduledAt) : null;
    const status = input.status;

    if (status === "PUBLISHED") {
      requireRole(session.role, ["SUPER_ADMIN", "EDITOR", "AUTHOR"]);
      if (!publishedAt) publishedAt = new Date();
    } else if (status === "SCHEDULED") {
      requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
      if (!scheduledAt) return jsonError("निर्धारित समय आवश्यक है", 400);
    }

    const tags = await upsertTags(input.tags ?? []);
    const slug = input.slug || slugify(input.title);
    const authorId = await resolveArticleAuthorId(
      { authorId: input.authorId, authorName: input.authorName },
      session.id,
    );

    const article = await prisma.article.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: content as never,
        highlight: input.highlight,
        location: input.location,
        status,
        featured: input.featured ?? false,
        breaking: input.breaking ?? false,
        trending: input.trending ?? false,
        trendingOverride: input.trendingOverride ?? null,
        readTimeMinutes,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        canonicalUrl: input.canonicalUrl || null,
        videoUrl: input.videoUrl || null,
        publishedAt,
        scheduledAt,
        categoryId: input.categoryId,
        authorId,
        createdById: session.id,
        featuredImageId: input.featuredImageId ?? null,
      },
    });

    await syncArticleTags(article.id, tags.map((t) => t.id));

    if (status === "SCHEDULED" && scheduledAt) {
      await prisma.scheduledPost.create({
        data: { articleId: article.id, publishAt: scheduledAt },
      });
    }

    if (input.breaking) {
      await prisma.breakingNews.upsert({
        where: { articleId: article.id },
        create: { title: input.title, articleId: article.id, enabled: true, sortOrder: 0 },
        update: { title: input.title, enabled: true },
      });
    }

    const category = await prisma.category.findUnique({ where: { id: article.categoryId }, select: { slug: true } });
    revalidatePublicPages({ slug: article.slug, categorySlug: category?.slug });

    let facebookPublish = null;
    if (status === "PUBLISHED") {
      facebookPublish = await tryPublishArticleToFacebook(article.id);
    }

    const full = await prisma.article.findUnique({
      where: { id: article.id },
      include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } } },
    });

    return jsonOk({ article: full ?? article, facebookPublish }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function HEAD() {
  try {
    await processScheduledPosts();
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
