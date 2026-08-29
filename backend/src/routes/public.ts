import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db";
import {
  getActiveAds,
  getArticleBySlug,
  getArticleIdBySlug,
  getBreakingNewsItems,
  getCategories,
  getCategoryBySlug,
  getPublishedArticles,
  getRelatedArticles,
  getSiteConfig,
  getTrendingArticles,
  recordArticleView,
  searchArticles,
} from "../lib/articles";
import { hashIp, stripUnsafeMarkup } from "../lib/types";
import { handleApiError, jsonError, jsonOk } from "../lib/api-utils";

const router = Router();

router.get("/site-config", async (_req, res) => {
  try {
    const config = await getSiteConfig();
    return jsonOk(res, config);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/categories", async (_req, res) => {
  try {
    const categories = await getCategories();
    return jsonOk(res, { categories });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/categories/:slug", async (req, res) => {
  try {
    const category = await getCategoryBySlug(req.params.slug);
    if (!category) return jsonError(res, "श्रेणी नहीं मिली", 404);
    return jsonOk(res, { category });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/articles", async (req, res) => {
  try {
    const { categorySlug, featured, breaking, limit, skip } = req.query;
    const articles = await getPublishedArticles({
      categorySlug: typeof categorySlug === "string" ? categorySlug : undefined,
      featured: featured === "true",
      breaking: breaking === "true",
      limit: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
    return jsonOk(res, { articles, slugs: articles.map((a) => a.slug) });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/articles/count", async (req, res) => {
  try {
    const categorySlug = typeof req.query.categorySlug === "string" ? req.query.categorySlug : undefined;
    const where = {
      status: "PUBLISHED" as const,
      publishedAt: { lte: new Date() },
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    };
    const total = await prisma.article.count({ where });
    return jsonOk(res, { total });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/articles/:slug", async (req, res) => {
  try {
    const article = await getArticleBySlug(req.params.slug);
    if (!article) return jsonError(res, "लेख नहीं मिला", 404);
    return jsonOk(res, { article });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/articles/:slug/related", async (req, res) => {
  try {
    const article = await getArticleBySlug(req.params.slug);
    if (!article) return jsonError(res, "लेख नहीं मिला", 404);
    const limit = req.query.limit ? Number(req.query.limit) : 4;
    const related = await getRelatedArticles(article, limit);
    return jsonOk(res, { articles: related });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/trending", async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const articles = await getTrendingArticles(limit);
    return jsonOk(res, { articles });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? req.query.limit ?? 6);
    const result = await searchArticles(q, page, pageSize);
    return jsonOk(res, result);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/breaking", async (_req, res) => {
  try {
    const items = await getBreakingNewsItems();
    return jsonOk(res, { items });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/ads", async (req, res) => {
  try {
    const position = typeof req.query.position === "string" ? req.query.position : undefined;
    const ads = await getActiveAds(position);
    return jsonOk(res, { ads });
  } catch (error) {
    return handleApiError(res, error);
  }
});

const commentSchema = z.object({
  slug: z.string(),
  authorName: z.string().trim().min(2).max(80),
  content: z.string().trim().min(5).max(500),
});

router.get("/comments", async (req, res) => {
  try {
    const slug = typeof req.query.slug === "string" ? req.query.slug : "";
    if (!slug) return jsonError(res, "slug आवश्यक", 400);
    const articleId = await getArticleIdBySlug(slug);
    if (!articleId) return jsonOk(res, { comments: [] });
    const comments = await prisma.comment.findMany({
      where: { articleId, approved: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { content: true, authorName: true, createdAt: true },
    });
    return jsonOk(res, { comments });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/comments", async (req, res) => {
  try {
    const body = commentSchema.parse(req.body);
    const articleId = await getArticleIdBySlug(body.slug);
    if (!articleId) return jsonError(res, "लेख नहीं मिला", 404);
    const comment = await prisma.comment.create({
      data: {
        articleId,
        authorName: stripUnsafeMarkup(body.authorName),
        content: stripUnsafeMarkup(body.content),
        approved: false,
      },
    });
    return jsonOk(res, { comment: { id: comment.id }, message: "टिप्पणी समीक्षा के लिए भेजी गई" }, 201);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/views", async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug || typeof slug !== "string") return jsonError(res, "slug आवश्यक", 400);
    const articleId = await getArticleIdBySlug(slug);
    if (!articleId) return jsonError(res, "लेख नहीं मिला", 404);
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? req.ip ?? "unknown";
    await recordArticleView(articleId, hashIp(ip));
    return jsonOk(res, { ok: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
