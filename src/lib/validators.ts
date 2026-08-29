import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const articleInputSchema = z.object({
  title: z.string().trim().min(10).max(160),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(180),
  excerpt: z.string().trim().min(20).max(280),
  categoryId: z.string().min(1),
  authorId: z.string().min(1),
  content: z.array(z.record(z.string(), z.unknown())).min(1),
  highlight: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
  featured: z.boolean().optional(),
  breaking: z.boolean().optional(),
  trending: z.boolean().optional(),
  trendingOverride: z.number().nullable().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  featuredImageId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export const breakingNewsSchema = z.object({
  title: z.string().min(3).max(200),
  link: z.string().optional(),
  articleId: z.string().nullable().optional(),
  enabled: z.boolean(),
  sortOrder: z.number().int(),
});

export const adSchema = z.object({
  name: z.string().min(2),
  position: z.enum(["HEADER", "HOMEPAGE", "ARTICLE_TOP", "ARTICLE_MIDDLE", "ARTICLE_BOTTOM", "SIDEBAR"]),
  code: z.string(),
  enabled: z.boolean(),
  sortOrder: z.number().int(),
});

export const mediaUpdateSchema = z.object({
  alt: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

export const mediaUrlSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  filename: z.string().optional(),
});

export const siteSettingSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

export const commentModerationSchema = z.object({
  approved: z.boolean(),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;

const EMPTY_CONTENT_BLOCK = [{ type: "paragraph", text: "" }] as const;

/** Fill draft-safe defaults so title-only saves work before excerpt/body are written. */
export function prepareArticleInput(
  raw: unknown,
  options?: { existingStatus?: string },
): Record<string, unknown> {
  const data =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>) }
      : {};

  const status =
    typeof data.status === "string" ? data.status : options?.existingStatus ?? "DRAFT";
  const isDraft = status === "DRAFT";

  if (isDraft) {
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const excerpt = typeof data.excerpt === "string" ? data.excerpt.trim() : "";
    if (!("excerpt" in data) || excerpt.length < 20) {
      data.excerpt = (title || excerpt).slice(0, 280) || " ";
    }
    if (!("content" in data) || !Array.isArray(data.content) || data.content.length === 0) {
      data.content = [...EMPTY_CONTENT_BLOCK];
    }
  }

  return data;
}
