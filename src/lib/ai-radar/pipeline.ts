import { prisma } from "@/lib/db";
import { slugify } from "@/lib/types";
import { filterDuplicates } from "./dedupe";
import { generateHindiDraft } from "./gemini";
import { logAiGeneration } from "./logging";
import { fetchNewsFromSources } from "./news-fetch";
import { ensureDefaultCategories, getAiRadarSettings } from "./settings";
import type { AiRadarStats } from "./types";

export interface PipelineResult {
  fetched: number;
  stored: number;
  generated: number;
  skipped: number;
  errors: string[];
  stats: AiRadarStats;
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || `news-${Date.now().toString(36)}`;
  let suffix = 2;
  while (await prisma.aiNewsDraft.findFirst({ where: { slug } })) {
    slug = `${slugify(base)}-${suffix}`;
    suffix++;
  }
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${suffix}`;
    suffix++;
  }
  return slug;
}

export async function runAiNewsFetchOnly(): Promise<PipelineResult> {
  await ensureDefaultCategories();
  const settings = await getAiRadarSettings();
  const errors: string[] = [];

  let rawItems: Awaited<ReturnType<typeof fetchNewsFromSources>> = [];
  try {
    rawItems = await fetchNewsFromSources(settings.maxArticlesPerFetch);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : "News fetch failed");
    await logAiGeneration({
      action: "fetch_news",
      status: "FAILED",
      message: errors[0],
      provider: settings.newsSource,
    });
    return { fetched: 0, stored: 0, generated: 0, skipped: 0, errors, stats: await getStats() };
  }

  const { unique, skipped: dedupeSkipped } = await filterDuplicates(rawItems, {
    enabled: settings.duplicateDetection,
  });

  let stored = 0;
  let skipped = dedupeSkipped;
  for (const item of unique) {
    try {
      await prisma.aiNewsDraft.create({
        data: {
          rawTitle: item.title,
          rawContent: item.content,
          rawDescription: item.description,
          sourceName: item.sourceName,
          sourceUrl: item.url,
          sourcePublishedAt: item.publishedAt,
          status: "FETCHED",
        },
      });
      stored++;
    } catch {
      skipped++;
    }
  }

  await logAiGeneration({
    action: "fetch_news",
    status: "SUCCESS",
    message: `Fetched ${rawItems.length}, stored ${stored}, skipped ${skipped}`,
    provider: settings.newsSource,
  });

  return {
    fetched: rawItems.length,
    stored,
    generated: 0,
    skipped,
    errors,
    stats: await getStats(),
  };
}

export async function generateDraftForRecord(draftId: string): Promise<{ ok: boolean; error?: string }> {
  const settings = await getAiRadarSettings();
  const draft = await prisma.aiNewsDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, error: "Draft not found" };
  if (draft.status === "PUBLISHED") return { ok: false, error: "Already published" };

  const item = {
    title: draft.rawTitle,
    description: draft.rawDescription ?? "",
    content: draft.rawContent ?? draft.rawDescription ?? "",
    url: draft.sourceUrl,
    sourceName: draft.sourceName,
    publishedAt: draft.sourcePublishedAt,
  };

  try {
    const result = await generateHindiDraft(item, settings.categories);
    const ext = result as typeof result & { _durationMs?: number; _tokensUsed?: number };

    const status =
      result.needsVerification || result.confidence < settings.minAiConfidence
        ? "NEEDS_VERIFICATION"
        : "DRAFT";

    const slug = await uniqueSlug(result.slug || result.headline);

    await prisma.aiNewsDraft.update({
      where: { id: draftId },
      data: {
        title: result.headline,
        slug,
        content: result.article,
        summary: result.summary,
        metaTitle: result.seoTitle,
        metaDescription: result.metaDescription,
        category: result.category,
        tags: result.tags,
        imagePrompt: result.imagePrompt,
        aiConfidence: result.confidence,
        verificationStatus: result.needsVerification ? "NEEDS_VERIFICATION" : "VERIFIED",
        status,
        errorMessage: result.verificationNotes ?? null,
      },
    });

    await logAiGeneration({
      draftId,
      action: "generate_draft",
      status: "SUCCESS",
      message: `Generated Hindi draft (confidence: ${result.confidence.toFixed(2)})`,
      tokensUsed: ext._tokensUsed,
      durationMs: ext._durationMs,
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await prisma.aiNewsDraft.update({
      where: { id: draftId },
      data: { errorMessage: message },
    });
    await logAiGeneration({
      draftId,
      action: "generate_draft",
      status: "FAILED",
      message,
    });
    return { ok: false, error: message };
  }
}

export async function runAiNewsPipeline(): Promise<PipelineResult> {
  const fetchResult = await runAiNewsFetchOnly();
  const settings = await getAiRadarSettings();
  let generated = 0;
  const errors = [...fetchResult.errors];

  const pending = await prisma.aiNewsDraft.findMany({
    where: { status: "FETCHED" },
    orderBy: { createdAt: "asc" },
    take: settings.maxArticlesPerFetch,
  });

  for (const draft of pending) {
    const result = await generateDraftForRecord(draft.id);
    if (result.ok) generated++;
    else if (result.error?.includes("rate limit")) {
      errors.push(result.error);
      break;
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return {
    ...fetchResult,
    generated,
    stats: await getStats(),
  };
}

async function getStats(): Promise<AiRadarStats> {
  const { getAiRadarStats } = await import("./logging");
  return getAiRadarStats();
}

export async function generateDraftsForFetched(limit?: number): Promise<{ generated: number; errors: string[] }> {
  const settings = await getAiRadarSettings();
  const pending = await prisma.aiNewsDraft.findMany({
    where: { status: "FETCHED" },
    orderBy: { createdAt: "asc" },
    take: limit ?? settings.maxArticlesPerFetch,
  });

  let generated = 0;
  const errors: string[] = [];

  for (const draft of pending) {
    const result = await generateDraftForRecord(draft.id);
    if (result.ok) generated++;
    else if (result.error) {
      errors.push(result.error);
      if (result.error.includes("rate limit")) break;
    }
  }

  return { generated, errors };
}
