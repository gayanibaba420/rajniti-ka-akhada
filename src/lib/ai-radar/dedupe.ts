import { prisma } from "@/lib/db";
import type { FetchedNewsItem } from "./types";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(title: string): Set<string> {
  return new Set(normalizeTitle(title).split(" ").filter((t) => t.length > 2));
}

export function titleSimilarity(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export async function filterDuplicates(
  items: FetchedNewsItem[],
  options: { enabled: boolean; titleThreshold?: number },
): Promise<{ unique: FetchedNewsItem[]; skipped: number }> {
  if (!options.enabled) return { unique: items, skipped: 0 };

  const threshold = options.titleThreshold ?? 0.72;
  const existingUrls = new Set(
    (await prisma.aiNewsDraft.findMany({ select: { sourceUrl: true } })).map((r) => r.sourceUrl),
  );
  const existingTitles = (
    await prisma.aiNewsDraft.findMany({
      where: { rawTitle: { not: "" } },
      select: { rawTitle: true, title: true },
      take: 500,
      orderBy: { createdAt: "desc" },
    })
  ).flatMap((r) => [r.rawTitle, r.title].filter(Boolean) as string[]);

  const unique: FetchedNewsItem[] = [];
  let skipped = 0;

  for (const item of items) {
    if (existingUrls.has(item.url)) {
      skipped++;
      continue;
    }

    const isDuplicateTitle = [...unique.map((u) => u.title), ...existingTitles].some(
      (title) => titleSimilarity(title, item.title) >= threshold,
    );
    if (isDuplicateTitle) {
      skipped++;
      continue;
    }

    unique.push(item);
    existingUrls.add(item.url);
  }

  return { unique, skipped };
}
