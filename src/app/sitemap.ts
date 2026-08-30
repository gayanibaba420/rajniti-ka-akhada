import type { MetadataRoute } from "next";
import { getCategories, getPublishedArticles } from "@/lib/articles";
import { getPublishedBlogPosts } from "@/lib/blogs";
import { getPublicSiteConfig, safeDbQuery } from "@/lib/public-data";

export const dynamic = "force-dynamic";

function safeLastModified(value: string | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await getPublicSiteConfig();
  const [articles, categories, blogs] = await Promise.all([
    safeDbQuery(() => getPublishedArticles({ limit: 5000 }), []),
    safeDbQuery(() => getCategories(), []),
    safeDbQuery(() => getPublishedBlogPosts({ limit: 5000 }), []),
  ]);

  const staticPages = ["about", "contact", "privacy", "disclaimer", "terms", "blog"];

  return [
    { url: config.url, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    ...staticPages.map((page) => ({ url: `${config.url}/${page}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 })),
    ...categories.map((category) => ({ url: `${config.url}/category/${category.slug}`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.8 })),
    ...articles.map((article) => ({ url: `${config.url}/article/${article.slug}`, lastModified: safeLastModified(article.publishedAt), changeFrequency: "daily" as const, priority: 0.7 })),
    ...blogs.map((blog) => ({ url: `${config.url}/blog/${blog.slug}`, lastModified: safeLastModified(blog.publishedAt), changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
