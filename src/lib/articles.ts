import type { Prisma, Article as DbArticle, ArticleStatus } from "@prisma/client";
import { getSiteUrl } from "./data";
import { prisma } from "./db";
import type { ContentBlock, PublicArticle, PublicCategory } from "./types";
import { blocksToPlainText, computeReadTimeMinutes, formatReadTime } from "./types";
import { tryPublishArticleToFacebook } from "./facebook";

const DEFAULT_IMAGE = "/news-assembly.svg";
const DEFAULT_IMAGE_ALT = "राजनीति का अखाड़ा";

const articleInclude = {
  category: true,
  author: true,
  featuredImage: true,
  tags: { include: { tag: true } },
} satisfies Prisma.ArticleInclude;

type ArticleWithRelations = Prisma.ArticleGetPayload<{ include: typeof articleInclude }>;

export function toPublicArticle(article: ArticleWithRelations): PublicArticle {
  const blocks = (Array.isArray(article.content) ? article.content : []) as ContentBlock[];
  const paragraphs = blocksToPlainText(blocks);
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category.slug,
    categoryName: article.category.name,
    location: article.location ?? undefined,
    image: article.featuredImage?.url ?? DEFAULT_IMAGE,
    imageAlt: article.featuredImage?.alt ?? article.title,
    author: article.author.name,
    publishedAt: (article.publishedAt ?? article.createdAt).toISOString(),
    readTime: formatReadTime(article.readTimeMinutes),
    breaking: article.breaking || undefined,
    featured: article.featured || undefined,
    trending: article.trending || undefined,
    views: article.viewCount,
    content: paragraphs.length ? paragraphs : [article.excerpt],
    contentBlocks: blocks,
    tags: article.tags.map((t) => t.tag.name),
    seoTitle: article.seoTitle ?? undefined,
    seoDescription: article.seoDescription ?? undefined,
    canonicalUrl: article.canonicalUrl ?? undefined,
    highlight: article.highlight ?? undefined,
  };
}

export async function getCategories(): Promise<PublicCategory[]> {
  const rows = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map((c) => ({ slug: c.slug, name: c.name, description: c.description }));
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

const publishedWhere: Prisma.ArticleWhereInput = {
  status: "PUBLISHED",
  publishedAt: { lte: new Date() },
};

export async function getPublishedArticles(options?: {
  categorySlug?: string;
  featured?: boolean;
  breaking?: boolean;
  limit?: number;
  skip?: number;
  orderBy?: Prisma.ArticleOrderByWithRelationInput[];
}) {
  const where: Prisma.ArticleWhereInput = { ...publishedWhere };
  if (options?.categorySlug) where.category = { slug: options.categorySlug };
  if (options?.featured) where.featured = true;
  if (options?.breaking) where.breaking = true;

  const rows = await prisma.article.findMany({
    where,
    include: articleInclude,
    orderBy: options?.orderBy ?? [{ publishedAt: "desc" }],
    take: options?.limit,
    skip: options?.skip,
  });
  return rows.map(toPublicArticle);
}

export async function getArticleBySlug(slug: string, includeDraft = false) {
  const row = await prisma.article.findUnique({
    where: { slug },
    include: articleInclude,
  });
  if (!row) return null;
  if (!includeDraft && (row.status !== "PUBLISHED" || !row.publishedAt || row.publishedAt > new Date())) {
    return null;
  }
  return toPublicArticle(row);
}

export async function getRelatedArticles(article: PublicArticle, limit = 4) {
  const rows = await prisma.article.findMany({
    where: {
      ...publishedWhere,
      slug: { not: article.slug },
      OR: [{ category: { slug: article.category } }, { location: article.location ?? undefined }],
    },
    include: articleInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return rows.map(toPublicArticle);
}

export async function searchArticles(query: string, page = 1, pageSize = 6) {
  const clean = query.trim();
  if (!clean) return { items: [] as PublicArticle[], total: 0, page, pageSize };

  const where: Prisma.ArticleWhereInput = {
    ...publishedWhere,
    OR: [
      { title: { contains: clean, mode: "insensitive" } },
      { excerpt: { contains: clean, mode: "insensitive" } },
      { location: { contains: clean, mode: "insensitive" } },
      { category: { name: { contains: clean, mode: "insensitive" } } },
      { tags: { some: { tag: { name: { contains: clean, mode: "insensitive" } } } } },
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  return { items: rows.map(toPublicArticle), total, page, pageSize };
}

export async function getTrendingArticles(limit = 10) {
  const rows = await prisma.article.findMany({
    where: publishedWhere,
    include: {
      ...articleInclude,
      views: { where: { viewedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, select: { id: true } },
    },
    take: 50,
  });

  const scored = rows
    .map((article) => ({
      article,
      score: computeTrendingScore(article),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ article }) => toPublicArticle(article));
}

function computeTrendingScore(article: ArticleWithRelations & { views?: { id: string }[] }) {
  if (article.trendingOverride != null) return article.trendingOverride;
  const recentViews = article.views?.length ?? 0;
  const totalViews = article.viewCount;
  const ageHours = Math.max(1, (Date.now() - (article.publishedAt?.getTime() ?? article.createdAt.getTime())) / 3600000);
  const recencyBoost = Math.max(0, 168 - ageHours) / 168;
  return totalViews * 0.4 + recentViews * 2 + recencyBoost * 100 + (article.trending ? 50 : 0);
}

export async function recordArticleView(articleId: string, ipHash?: string) {
  await prisma.$transaction([
    prisma.articleView.create({ data: { articleId, ipHash } }),
    prisma.article.update({ where: { id: articleId }, data: { viewCount: { increment: 1 } } }),
  ]);
}

export async function getArticleIdBySlug(slug: string) {
  const row = await prisma.article.findUnique({ where: { slug }, select: { id: true, status: true, publishedAt: true } });
  if (!row || row.status !== "PUBLISHED" || !row.publishedAt || row.publishedAt > new Date()) return null;
  return row.id;
}

export async function getBreakingNewsItems() {
  const now = new Date();

  const mapItems = (
    items: Awaited<ReturnType<typeof prisma.breakingNews.findMany<{ include: { article: { include: typeof articleInclude } } }>>>,
  ) =>
    items.map((item) => {
      if (item.article && item.article.status === "PUBLISHED") {
        const pub = toPublicArticle(item.article);
        return { title: item.title || pub.title, slug: pub.slug, link: item.link ?? `/article/${pub.slug}` };
      }
      return { title: item.title, slug: null as string | null, link: item.link ?? "#" };
    });

  try {
    const items = await prisma.breakingNews.findMany({
      where: {
        enabled: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      include: { article: { include: articleInclude } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    const expiredIds = await prisma.breakingNews.findMany({
      where: { enabled: true, expiresAt: { lte: now } },
      select: { id: true },
    });
    if (expiredIds.length) {
      await prisma.breakingNews.updateMany({
        where: { id: { in: expiredIds.map((i) => i.id) } },
        data: { enabled: false },
      });
    }

    return mapItems(items);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code !== "P2022") throw error;

    const items = await prisma.breakingNews.findMany({
      where: { enabled: true },
      include: { article: { include: articleInclude } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return mapItems(items);
  }
}

export async function getActiveAds(position?: string) {
  const where = position
    ? { enabled: true, position: position as never }
    : { enabled: true };
  return prisma.advertisement.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSiteConfig() {
  const settings = await getSiteSettings();
  return {
    name: settings.site_name ?? "राजनीति का अखाड़ा",
    tagline: settings.site_tagline ?? "हिंदी समाचार • निष्पक्ष विचार",
    description: settings.site_description ?? "हरियाणा, हिसार, राजनीति और देश-दुनिया की विश्वसनीय हिंदी खबरें।",
    url: getSiteUrl(),
    email: settings.contact_email ?? "sampark@rajnitikaakhada.in",
  };
}

export async function getAnalyticsSummary() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [today, week, month, total, topArticles, topCategories] = await Promise.all([
    prisma.articleView.count({ where: { viewedAt: { gte: todayStart } } }),
    prisma.articleView.count({ where: { viewedAt: { gte: weekStart } } }),
    prisma.articleView.count({ where: { viewedAt: { gte: monthStart } } }),
    prisma.articleView.count(),
    prisma.article.findMany({
      where: publishedWhere,
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { title: true, slug: true, viewCount: true },
    }),
    prisma.article.groupBy({
      by: ["categoryId"],
      where: publishedWhere,
      _sum: { viewCount: true },
      orderBy: { _sum: { viewCount: "desc" } },
      take: 5,
    }),
  ]);

  const categoryIds = topCategories.map((c) => c.categoryId);
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return {
    views: { today, week, month, total },
    topArticles,
    topCategories: topCategories.map((c) => ({
      name: categoryMap[c.categoryId] ?? "अज्ञात",
      views: c._sum.viewCount ?? 0,
    })),
    postCounts: {
      total: await prisma.article.count(),
      published: await prisma.article.count({ where: { status: "PUBLISHED" } }),
      draft: await prisma.article.count({ where: { status: "DRAFT" } }),
      review: await prisma.article.count({ where: { status: "REVIEW" } }),
      scheduled: await prisma.article.count({ where: { status: "SCHEDULED" } }),
    },
  };
}

export async function processScheduledPosts() {
  const now = new Date();
  const due = await prisma.scheduledPost.findMany({
    where: { processed: false, publishAt: { lte: now } },
    include: { article: true },
  });

  let published = 0;
  for (const item of due) {
    await prisma.$transaction([
      prisma.article.update({
        where: { id: item.articleId },
        data: { status: "PUBLISHED", publishedAt: item.publishAt, scheduledAt: null },
      }),
      prisma.scheduledPost.update({ where: { id: item.id }, data: { processed: true } }),
    ]);
    await tryPublishArticleToFacebook(item.articleId);
    published++;
  }
  return published;
}

export async function upsertTags(tagNames: string[]) {
  const tags = [];
  for (const name of tagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = trimmed.toLowerCase().replace(/\s+/g, "-").slice(0, 80);
    const tag = await prisma.tag.upsert({
      where: { slug },
      create: { slug, name: trimmed },
      update: { name: trimmed },
    });
    tags.push(tag);
  }
  return tags;
}

export function parseContentInput(content: unknown): ContentBlock[] {
  if (Array.isArray(content)) {
    return content as ContentBlock[];
  }
  if (typeof content === "string") {
    return content.split("\n\n").filter(Boolean).map((text) => ({ type: "paragraph", text }));
  }
  return [];
}

export async function syncArticleTags(articleId: string, tagIds: string[]) {
  await prisma.articleTag.deleteMany({ where: { articleId } });
  if (tagIds.length) {
    await prisma.articleTag.createMany({
      data: tagIds.map((tagId) => ({ articleId, tagId })),
    });
  }
}

export type { ArticleStatus, DbArticle };
