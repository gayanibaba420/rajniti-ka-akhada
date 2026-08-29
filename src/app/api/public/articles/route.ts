import { getPublishedArticles } from "@/lib/articles";
import { jsonOk } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await getPublishedArticles({ limit: 5 });
  return jsonOk({ slugs: articles.map((a) => a.slug) });
}
