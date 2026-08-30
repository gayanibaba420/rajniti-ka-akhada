import { NextRequest, NextResponse } from "next/server";
import { getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limit = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 5)));
  const articles = await getPublishedArticles({ limit });
  const latest = articles[0];

  return NextResponse.json(
    {
      latestSlug: latest?.slug ?? null,
      latestPublishedAt: latest?.publishedAt ?? null,
      slugs: articles.map((a) => a.slug),
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
