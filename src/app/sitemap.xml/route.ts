import { getCategories, getPublishedArticles } from "@/lib/articles";
import { getPublishedBlogPosts } from "@/lib/blogs";
import { getSiteUrl } from "@/lib/data";
import { getPublicSiteConfig, safeDbQuery } from "@/lib/public-data";

export const dynamic = "force-dynamic";

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char]!));

function safeLastModified(value: string | undefined): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

type SitemapEntry = {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
};

function buildUrlset(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (entry) =>
        `<url><loc>${escapeXml(entry.loc)}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const config = await getPublicSiteConfig();
  const siteUrl = config.url || getSiteUrl();
  const now = new Date().toISOString();
  const staticPages = ["about", "contact", "privacy", "disclaimer", "terms", "blog"];

  const [articles, categories, blogs] = await Promise.all([
    safeDbQuery(() => getPublishedArticles({ limit: 5000 }), []),
    safeDbQuery(() => getCategories(), []),
    safeDbQuery(() => getPublishedBlogPosts({ limit: 5000 }), []),
  ]);

  return [
    { loc: siteUrl, lastmod: now, changefreq: "hourly", priority: 1 },
    ...staticPages.map((page) => ({ loc: `${siteUrl}/${page}`, lastmod: now, changefreq: "monthly", priority: 0.4 })),
    ...categories.map((category) => ({
      loc: `${siteUrl}/category/${category.slug}`,
      lastmod: now,
      changefreq: "hourly",
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      loc: `${siteUrl}/article/${article.slug}`,
      lastmod: safeLastModified(article.publishedAt),
      changefreq: "daily",
      priority: 0.7,
    })),
    ...blogs.map((blog) => ({
      loc: `${siteUrl}/blog/${blog.slug}`,
      lastmod: safeLastModified(blog.publishedAt),
      changefreq: "weekly",
      priority: 0.6,
    })),
  ];
}

export async function GET() {
  try {
    const xml = buildUrlset(await getSitemapEntries());
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[sitemap]", error);
    const xml = buildUrlset([
      { loc: getSiteUrl(), lastmod: new Date().toISOString(), changefreq: "hourly", priority: 1 },
    ]);
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  }
}
