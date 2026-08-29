import type { MetadataRoute } from "next";
import { articles, categories, siteConfig } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    ...["about", "contact", "privacy"].map((page) => ({ url: `${siteConfig.url}/${page}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 })),
    ...categories.map((category) => ({ url: `${siteConfig.url}/category/${category.slug}`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: .8 })),
    ...articles.map((article) => ({ url: `${siteConfig.url}/article/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: "daily" as const, priority: .7 })),
  ];
}
