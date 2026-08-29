import { getSiteUrl } from "./data";
import { prisma } from "./db";
import type { FacebookPublishStatus } from "@prisma/client";

const GRAPH_VERSION = "v21.0";

export type FacebookPublishResult = {
  status: FacebookPublishStatus;
  postId?: string;
  error?: string;
  skipped?: boolean;
};

function getFacebookConfig() {
  return {
    pageId: process.env.FACEBOOK_PAGE_ID?.trim(),
    accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim(),
  };
}

export function isFacebookConfigured(): boolean {
  const { pageId, accessToken } = getFacebookConfig();
  return Boolean(pageId && accessToken);
}

export async function isFacebookAutoPublishEnabled(): Promise<boolean> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "facebook_auto_publish" } });
  return setting?.value === "true";
}

function buildHashtags(tags: string[]): string {
  const unique = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
  const formatted = unique.map((t) => (t.startsWith("#") ? t : `#${t.replace(/\s+/g, "")}`));
  const defaults = ["#RajnitiKaAkhada", "#HindiNews", "#हिंदीसमाचार"];
  for (const tag of defaults) {
    if (!formatted.includes(tag)) formatted.push(tag);
  }
  return formatted.slice(0, 8).join(" ");
}

function buildPostMessage(title: string, excerpt: string, url: string, tags: string[]): string {
  const hashtags = buildHashtags(tags);
  return `${title}\n\n${excerpt}\n\n${url}\n\n${hashtags}`;
}

function absoluteImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  return `${getSiteUrl()}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

async function postToFacebookPage(options: {
  message: string;
  link: string;
  imageUrl?: string;
}): Promise<{ postId: string }> {
  const { pageId, accessToken } = getFacebookConfig();
  if (!pageId || !accessToken) {
    throw new Error("Facebook credentials not configured");
  }

  const endpoint = options.imageUrl
    ? `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`
    : `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`;

  const body = new URLSearchParams();
  body.set("access_token", accessToken);
  body.set("caption", options.message);
  if (options.imageUrl) {
    body.set("url", options.imageUrl);
  } else {
    body.set("message", options.message);
    body.set("link", options.link);
  }

  const res = await fetch(endpoint, { method: "POST", body });
  const data = (await res.json()) as { id?: string; post_id?: string; error?: { message: string } };

  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? `Facebook API error (${res.status})`);
  }

  const postId = data.post_id ?? data.id;
  if (!postId) throw new Error("Facebook did not return a post ID");
  return { postId };
}

export async function publishArticleToFacebook(articleId: string, force = false): Promise<FacebookPublishResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      featuredImage: true,
      tags: { include: { tag: true } },
      category: true,
    },
  });

  if (!article) {
    return { status: "FAILED", error: "Article not found" };
  }

  if (article.status !== "PUBLISHED") {
    return { status: "SKIPPED", skipped: true, error: "Article is not published" };
  }

  if (article.facebookPostId && article.facebookPublishStatus === "SUCCESS" && !force) {
    return { status: "SUCCESS", postId: article.facebookPostId, skipped: true };
  }

  const autoPublish = await isFacebookAutoPublishEnabled();
  if (!autoPublish && !force) {
    await prisma.article.update({
      where: { id: articleId },
      data: { facebookPublishStatus: "SKIPPED", facebookPublishError: null },
    });
    return { status: "SKIPPED", skipped: true };
  }

  if (!isFacebookConfigured()) {
    const error = "Facebook API credentials missing (FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN)";
    await prisma.article.update({
      where: { id: articleId },
      data: { facebookPublishStatus: "FAILED", facebookPublishError: error },
    });
    return { status: "FAILED", error };
  }

  const url = `${getSiteUrl()}/article/${article.slug}`;
  const tagNames = article.tags.map((t) => t.tag.name);
  const message = buildPostMessage(article.title, article.excerpt, url, tagNames);
  const imageUrl = article.featuredImage?.url ? absoluteImageUrl(article.featuredImage.url) : undefined;

  await prisma.article.update({
    where: { id: articleId },
    data: { facebookPublishStatus: "PENDING", facebookPublishError: null },
  });

  try {
    const { postId } = await postToFacebookPage({ message, link: url, imageUrl });
    await prisma.article.update({
      where: { id: articleId },
      data: {
        facebookPostId: postId,
        facebookPublishStatus: "SUCCESS",
        facebookPublishedAt: new Date(),
        facebookPublishError: null,
      },
    });
    return { status: "SUCCESS", postId };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Facebook publish failed";
    await prisma.article.update({
      where: { id: articleId },
      data: {
        facebookPublishStatus: "FAILED",
        facebookPublishError: error.slice(0, 500),
      },
    });
    return { status: "FAILED", error };
  }
}

/** Fire-and-forget Facebook publish — never throws; website publish must not fail. */
export async function tryPublishArticleToFacebook(articleId: string, force = false): Promise<FacebookPublishResult> {
  try {
    return await publishArticleToFacebook(articleId, force);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unexpected Facebook error";
    console.error("[facebook]", articleId, error);
    try {
      await prisma.article.update({
        where: { id: articleId },
        data: { facebookPublishStatus: "FAILED", facebookPublishError: error.slice(0, 500) },
      });
    } catch {
      // ignore secondary DB errors
    }
    return { status: "FAILED", error };
  }
}
