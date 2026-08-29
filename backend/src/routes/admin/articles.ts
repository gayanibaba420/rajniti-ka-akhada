import { Router } from "express";
import { canEditArticle, requireRole } from "../../lib/auth";
import { prisma } from "../../lib/db";
import {
  parseContentInput,
  processScheduledPosts,
  syncArticleTags,
  upsertTags,
} from "../../lib/articles";
import { computeReadTimeMinutes, slugify } from "../../lib/types";
import { handleApiError, jsonError, jsonOk } from "../../lib/api-utils";
import { articleInputSchema, prepareArticleInput } from "../../lib/validators";
import { tryPublishArticleToFacebook } from "../../lib/facebook";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const limit = Number(req.query.limit ?? 50);
    const session = req.user!;

    if (session.role === "AUTHOR") {
      const rows = await prisma.article.findMany({
        where: { createdById: session.id, ...(status ? { status: status as never } : {}) },
        include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } } },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });
      return jsonOk(res, { articles: rows });
    }

    const rows = await prisma.article.findMany({
      where: status ? { status: status as never } : {},
      include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return jsonOk(res, { articles: rows });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const session = req.user!;
    const input = articleInputSchema.parse(prepareArticleInput(req.body));
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
      if (!scheduledAt) return jsonError(res, "निर्धारित समय आवश्यक है", 400);
    }

    const tags = await upsertTags(input.tags ?? []);
    const slug = input.slug || slugify(input.title);

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
        publishedAt,
        scheduledAt,
        categoryId: input.categoryId,
        authorId: input.authorId,
        createdById: session.id,
        featuredImageId: input.featuredImageId ?? null,
      },
    });

    await syncArticleTags(article.id, tags.map((t) => t.id));

    if (status === "SCHEDULED" && scheduledAt) {
      await prisma.scheduledPost.create({ data: { articleId: article.id, publishAt: scheduledAt } });
    }

    if (input.breaking) {
      await prisma.breakingNews.upsert({
        where: { articleId: article.id },
        create: { title: input.title, articleId: article.id, enabled: true, sortOrder: 0 },
        update: { title: input.title, enabled: true },
      });
    }

    let facebookPublish = null;
    if (status === "PUBLISHED") {
      facebookPublish = await tryPublishArticleToFacebook(article.id);
    }

    const full = await prisma.article.findUnique({
      where: { id: article.id },
      include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } } },
    });

    return jsonOk(res, { article: full ?? article, facebookPublish }, 201);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.head("/", async (_req, res) => {
  try {
    await processScheduledPosts();
    return res.status(204).end();
  } catch {
    return res.status(503).end();
  }
});

router.get("/:id", async (req, res) => {
  try {
    const session = req.user!;
    const article = await prisma.article.findUnique({
      where: { id: req.params.id },
      include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } }, scheduledPost: true },
    });
    if (!article) return jsonError(res, "लेख नहीं मिला", 404);
    if (!canEditArticle(session.role, session.id, article.createdById)) return jsonError(res, "अनुमति नहीं", 403);
    return jsonOk(res, { article });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const session = req.user!;
    const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!existing) return jsonError(res, "लेख नहीं मिला", 404);
    if (!canEditArticle(session.role, session.id, existing.createdById)) return jsonError(res, "अनुमति नहीं", 403);

    const input = articleInputSchema.partial().parse(
      prepareArticleInput(req.body, { existingStatus: existing.status }),
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

    const article = await prisma.article.update({
      where: { id: req.params.id },
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
        ...(publishedAt !== undefined && { publishedAt }),
        ...(scheduledAt !== undefined && { scheduledAt }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.authorId !== undefined && { authorId: input.authorId }),
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

    let facebookPublish = null;
    const becamePublished = status === "PUBLISHED" && existing.status !== "PUBLISHED";
    if (becamePublished) {
      facebookPublish = await tryPublishArticleToFacebook(article.id);
    }

    const full = await prisma.article.findUnique({
      where: { id: article.id },
      include: { category: true, author: true, featuredImage: true, tags: { include: { tag: true } } },
    });

    return jsonOk(res, { article: full ?? article, facebookPublish });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const session = req.user!;
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    const existing = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!existing) return jsonError(res, "लेख नहीं मिला", 404);
    await prisma.article.delete({ where: { id: req.params.id } });
    return jsonOk(res, { ok: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/:id/facebook", async (req, res) => {
  try {
    const article = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!article) return jsonError(res, "लेख नहीं मिला", 404);
    if (article.status !== "PUBLISHED") {
      return jsonError(res, "केवल प्रकाशित लेख Facebook पर भेजे जा सकते हैं", 400);
    }

    const facebookPublish = await tryPublishArticleToFacebook(req.params.id, true);
    const updated = await prisma.article.findUnique({
      where: { id: req.params.id },
      select: {
        facebookPostId: true,
        facebookPublishStatus: true,
        facebookPublishedAt: true,
        facebookPublishError: true,
      },
    });

    return jsonOk(res, { facebookPublish, article: updated });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
