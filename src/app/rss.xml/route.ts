import { articles, siteConfig } from "@/lib/data";

const escapeXml = (value: string) => value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char]!));

export async function GET() {
  const items = articles.slice(0, 20).map((article) => `<item><title>${escapeXml(article.title)}</title><link>${siteConfig.url}/article/${article.slug}</link><guid>${siteConfig.url}/article/${article.slug}</guid><description>${escapeXml(article.excerpt)}</description><pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${siteConfig.name}</title><link>${siteConfig.url}</link><description>${siteConfig.description}</description><language>hi-IN</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" } });
}
