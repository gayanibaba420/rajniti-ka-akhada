import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { findOrCreateAuthorByName, parseContentInput, resolveArticleAuthorId } from "./articles";
import type { ContentBlock, PublicBlogPost } from "./types";
import { blocksToPlainText, computeReadTimeMinutes, formatReadTime } from "./types";

const blogInclude = {
  author: true,
  featuredImage: true,
} satisfies Prisma.BlogPostInclude;

type BlogWithRelations = Prisma.BlogPostGetPayload<{ include: typeof blogInclude }>;

export function toPublicBlogPost(blog: BlogWithRelations): PublicBlogPost {
  const blocks = (Array.isArray(blog.content) ? blog.content : []) as ContentBlock[];
  const paragraphs = blocksToPlainText(blocks);
  return {
    slug: blog.slug,
    title: blog.title,
    excerpt: blog.excerpt,
    image: blog.featuredImage?.url ?? null,
    imageAlt: blog.featuredImage?.alt ?? undefined,
    author: blog.author.name,
    authorSlug: blog.author.slug,
    publishedAt: (blog.publishedAt ?? blog.createdAt).toISOString(),
    updatedAt: blog.updatedAt.toISOString(),
    readTime: formatReadTime(computeReadTimeMinutes(blocks)),
    views: blog.viewCount,
    content: paragraphs.length ? paragraphs : [blog.excerpt],
    contentBlocks: blocks,
    tags: blog.tags,
    seoTitle: blog.seoTitle ?? undefined,
    seoDescription: blog.seoDescription ?? undefined,
  };
}

const publishedWhere: Prisma.BlogPostWhereInput = {
  status: "PUBLISHED",
  publishedAt: { lte: new Date() },
};

export async function getPublishedBlogPosts(options?: {
  limit?: number;
  skip?: number;
}) {
  const rows = await prisma.blogPost.findMany({
    where: publishedWhere,
    include: blogInclude,
    orderBy: { publishedAt: "desc" },
    take: options?.limit,
    skip: options?.skip,
  });
  return rows.map(toPublicBlogPost);
}

export async function countPublishedBlogPosts() {
  return prisma.blogPost.count({ where: publishedWhere });
}

export async function getBlogPostBySlug(slug: string, includeDraft = false) {
  const row = await prisma.blogPost.findUnique({
    where: { slug },
    include: blogInclude,
  });
  if (!row) return null;
  if (!includeDraft && (row.status !== "PUBLISHED" || !row.publishedAt || row.publishedAt > new Date())) {
    return null;
  }
  return toPublicBlogPost(row);
}

export async function getRelatedBlogPosts(blog: PublicBlogPost, limit = 3) {
  const rows = await prisma.blogPost.findMany({
    where: {
      ...publishedWhere,
      slug: { not: blog.slug },
    },
    include: blogInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return rows.map(toPublicBlogPost);
}

export async function recordBlogView(blogId: string) {
  await prisma.blogPost.update({
    where: { id: blogId },
    data: { viewCount: { increment: 1 } },
  });
}

export async function getBlogPostIdBySlug(slug: string) {
  const row = await prisma.blogPost.findUnique({
    where: { slug },
    select: { id: true, status: true, publishedAt: true },
  });
  if (!row || row.status !== "PUBLISHED" || !row.publishedAt || row.publishedAt > new Date()) return null;
  return row.id;
}

export { parseContentInput, resolveArticleAuthorId, findOrCreateAuthorByName };
