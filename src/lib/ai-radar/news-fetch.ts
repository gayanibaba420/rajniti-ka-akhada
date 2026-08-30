import { prisma } from "@/lib/db";
import { getGnewsApiKey } from "./settings";
import type { FetchedNewsItem } from "./types";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseRssItems(xml: string): FetchedNewsItem[] {
  const items: FetchedNewsItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of itemBlocks) {
    const title = stripHtml(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const link = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim();
    const description = stripHtml(
      block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ?? "",
    );
    const content = stripHtml(
      block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1] ??
        block.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1] ??
        description,
    );
    const pubDateRaw = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    const sourceName =
      stripHtml(block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1] ?? "") || "RSS Feed";

    if (!title || !link) continue;

    items.push({
      title,
      description,
      content: content || description,
      url: link,
      sourceName,
      publishedAt: pubDateRaw ? new Date(pubDateRaw) : null,
    });
  }

  return items;
}

async function fetchGnewsForQuery(query: string, max: number): Promise<FetchedNewsItem[]> {
  const apiKey = getGnewsApiKey();
  if (!apiKey) throw new Error("GNews API key not configured (set GNEWS_API_KEY)");

  const params = new URLSearchParams({
    q: query,
    lang: "hi",
    country: "in",
    max: String(Math.min(max, 10)),
    apikey: apiKey,
  });

  const res = await fetch(`https://gnews.io/api/v4/search?${params.toString()}`, {
    next: { revalidate: 0 },
  });

  if (res.status === 429) throw new Error("GNews API rate limit reached");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GNews API error (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    articles?: Array<{
      title: string;
      description?: string;
      content?: string;
      url: string;
      source?: { name?: string };
      publishedAt?: string;
    }>;
  };

  return (data.articles ?? []).map((a) => ({
    title: a.title,
    description: a.description ?? "",
    content: a.content ?? a.description ?? "",
    url: a.url,
    sourceName: a.source?.name ?? "GNews",
    publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
  }));
}

async function fetchRssFeed(url: string): Promise<FetchedNewsItem[]> {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`RSS fetch failed (${res.status}): ${url}`);
  const xml = await res.text();
  return parseRssItems(xml);
}

export async function fetchNewsFromSources(maxArticles: number): Promise<FetchedNewsItem[]> {
  const sources = await prisma.aiNewsSource.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const results: FetchedNewsItem[] = [];
  const seenUrls = new Set<string>();

  if (sources.length === 0) {
    const categories = ["Haryana politics", "Delhi news", "India politics"];
    for (const query of categories) {
      if (results.length >= maxArticles) break;
      try {
        const batch = await fetchGnewsForQuery(query, maxArticles - results.length);
        for (const item of batch) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            results.push(item);
          }
        }
      } catch {
        // continue with next query
      }
    }
    return results.slice(0, maxArticles);
  }

  for (const source of sources) {
    if (results.length >= maxArticles) break;
    try {
      let batch: FetchedNewsItem[] = [];
      if (source.type === "RSS" && source.url) {
        batch = await fetchRssFeed(source.url);
      } else if (source.type === "GNEWS") {
        const query = source.query || source.category || "India news";
        batch = await fetchGnewsForQuery(query, maxArticles - results.length);
      }
      for (const item of batch) {
        if (results.length >= maxArticles) break;
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          results.push(item);
        }
      }
    } catch {
      // skip failed source
    }
  }

  return results.slice(0, maxArticles);
}
