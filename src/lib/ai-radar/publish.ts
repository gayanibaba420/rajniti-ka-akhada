import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseContentInput,
  resolveArticleAuthorId,
  syncArticleTags,
  upsertTags,
} from "@/lib/articles";
import { revalidatePublicPages } from "@/lib/revalidate";
import type { ContentBlock } from "@/lib/types";
import { computeReadTimeMinutes, slugify } from "@/lib/types";
import { tryPublishArticleToFacebook } from "@/lib/facebook";
import { logAiGeneration } from "./logging";

function articleToContentBlocks(text: string): ContentBlock[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text) => ({ type: "paragraph" as const, text }));
}

async function resolveCategoryId(categoryName: string | null | undefined): Promise<string> {
  const fallback = await prisma.category.findFirst({ orderBy: { sortOrder: "asc" } });
  if (!fallback) throw new Error("कोई श्रेणी उपलब्ध नहीं — पहले श्रेणी बनाएं");

  if (!categoryName?.trim()) return fallback.id;

  const slug = slugify(categoryName) || categoryName.toLowerCase().replace(/\s+/g, "-");
  const bySlug = await prisma.category.findUnique({ where: { slug } });
  if (bySlug) return bySlug.id;

  const byName = await prisma.category.findFirst({
    where: { name: { equals: categoryName, mode: "insensitive" } },
  });
  if (byName) return byName.id;

  return fallback.id;
}

async function uniqueArticleSlug(base: string): Promise<string> {
  let slug = slugify(base) || `news-${Date.now().toString(36)}`;
  let suffix = 2;
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${suffix}`;
    suffix++;
  }
  return slug;
}

export async function publishAiNewsDraft(
  draftId: string,
  session: SessionUser,
  options?: { featuredImageId?: string | null; authorName?: string },
): Promise<{ articleId: string; slug: string }> {
  const draft = await prisma.aiNewsDraft.findUnique({ where: { id: draftId } });
  if (!draft) throw new Error("AI समाचार ड्राफ्ट नहीं मिला");
  if (draft.status === "PUBLISHED" && draft.publishedArticleId) {
    throw new Error("पहले से प्रकाशित");
  }
  if (!draft.title?.trim() || !draft.content?.trim()) {
    throw new Error("शीर्षक और सामग्री आवश्यक — पहले AI ड्राफ्ट जनरेट करें");
  }

  const contentBlocks = articleToContentBlocks(draft.content);
  const content = parseContentInput(contentBlocks);
  const readTimeMinutes = computeReadTimeMinutes(content);
  const categoryId = await resolveCategoryId(draft.category);
  const slug = await uniqueArticleSlug(draft.slug ?? draft.title);
  const excerpt = (draft.summary ?? draft.content.slice(0, 280)).slice(0, 280);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rajnitikaakhada.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/article/${slug}`;

  const authorId = await resolveArticleAuthorId(
    { authorName: options?.authorName ?? "AI News Desk" },
    session.id,
  );

  const tags = await upsertTags(draft.tags ?? []);
  const featuredImageId = options?.featuredImageId ?? draft.featuredImageId ?? null;

  const article = await prisma.article.create({
    data: {
      title: draft.title,
      slug,
      excerpt,
      content: content as never,
      status: "PUBLISHED",
      publishedAt: new Date(),
      readTimeMinutes,
      seoTitle: draft.metaTitle ?? draft.title,
      seoDescription: draft.metaDescription ?? excerpt,
      canonicalUrl,
      categoryId,
      authorId,
      createdById: session.id,
      featuredImageId,
    },
  });

  await syncArticleTags(article.id, tags.map((t) => t.id));

  await prisma.aiNewsDraft.update({
    where: { id: draftId },
    data: {
      status: "PUBLISHED",
      publishedArticleId: article.id,
      slug,
      featuredImageId,
    },
  });

  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
  revalidatePublicPages({ slug: article.slug, categorySlug: category?.slug });

  await tryPublishArticleToFacebook(article.id);

  await logAiGeneration({
    draftId,
    action: "publish",
    status: "SUCCESS",
    message: `Published as article ${article.slug}`,
  });

  return { articleId: article.id, slug: article.slug };
}
