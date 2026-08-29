import { getPublishedArticles, getSiteConfig } from "@/lib/articles";

const escapeXml = (value: string) => value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char]!));

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [articles, config] = await Promise.all([getPublishedArticles({ limit: 20 }), getSiteConfig()]);
    const items = articles
      .map(
        (article) =>
          `<item><title>${escapeXml(article.title)}</title><link>${config.url}/article/${article.slug}</link><guid>${config.url}/article/${article.slug}</guid><description>${escapeXml(article.excerpt)}</description><pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate></item>`
      )
      .join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(config.name)}</title><link>${config.url}</link><description>${escapeXml(config.description)}</description><language>hi-IN</language>${items}</channel></rss>`;
    return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" } });
  } catch {
    return new Response("<?xml version=\"1.0\"?><rss version=\"2.0\"><channel><title>Unavailable</title></channel></rss>", { status: 503, headers: { "Content-Type": "application/rss+xml" } });
  }
}
