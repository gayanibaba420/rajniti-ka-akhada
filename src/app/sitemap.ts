import type { MetadataRoute } from "next";
import { getCategories, getPublishedArticles } from "@/lib/articles";
import { getPublicSiteConfig } from "@/lib/public-data";
import { siteConfig as fallbackConfig } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = (await getPublicSiteConfig()) ?? fallbackConfig;
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];

  try {
    [articles, categories] = await Promise.all([getPublishedArticles({ limit: 5000 }), getCategories()]);
  } catch {
    // return minimal sitemap on DB failure
  }

  return [
    { url: config.url, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    ...["about", "contact", "privacy"].map((page) => ({ url: `${config.url}/${page}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 })),
    ...categories.map((category) => ({ url: `${config.url}/category/${category.slug}`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.8 })),
    ...articles.map((article) => ({ url: `${config.url}/article/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
