import { getGeminiApiKey } from "./settings";
import type { FetchedNewsItem, GeminiDraftResult } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function buildPrompt(item: FetchedNewsItem, categories: string[]): string {
  return `You are a professional Hindi news editor for "राजनीति का अखाड़ा" (rajnitikaakhada.com), a Hindi news portal focused on Haryana, Delhi/NCR, and Indian politics.

SOURCE NEWS (English/original — use ONLY these facts, do NOT invent details):
Title: ${item.title}
Description: ${item.description}
Content: ${item.content.slice(0, 3000)}
Source: ${item.sourceName}
URL: ${item.url}

TASK: Write a Hindi news article based ONLY on the source above. If any fact is unclear or unverified, mark needsVerification as true.

Allowed categories: ${categories.join(", ")}

Respond with ONLY valid JSON (no markdown outside JSON):
{
  "seoTitle": "Hindi SEO title (max 60 chars)",
  "headline": "Main Hindi headline",
  "article": "Full Hindi news article in 3-6 paragraphs, journalistic tone",
  "summary": "2-3 sentence Hindi summary",
  "metaDescription": "SEO meta description in Hindi (max 160 chars)",
  "slug": "english-url-slug-lowercase-hyphens",
  "category": "one of the allowed categories",
  "tags": ["tag1", "tag2", "tag3"],
  "imagePrompt": "English prompt for featured image (no copyrighted references)",
  "confidence": 0.0 to 1.0,
  "needsVerification": true or false,
  "verificationNotes": "optional Hindi note if facts need checking"
}`;
}

export async function generateHindiDraft(
  item: FetchedNewsItem,
  categories: string[],
): Promise<GeminiDraftResult & { _durationMs?: number; _tokensUsed?: number }> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API key not configured (set GEMINI_API_KEY)");

  const start = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(item, categories) }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
  });

  if (res.status === 429) throw new Error("Gemini API rate limit reached");
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { totalTokenCount?: number };
  };

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Gemini returned empty response");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(extractJson(rawText)) as Record<string, unknown>;
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }

  const confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5));
  const needsVerification = Boolean(parsed.needsVerification) || confidence < 0.7;

  return {
    seoTitle: String(parsed.seoTitle ?? item.title).slice(0, 120),
    headline: String(parsed.headline ?? item.title),
    article: String(parsed.article ?? ""),
    summary: String(parsed.summary ?? item.description),
    metaDescription: String(parsed.metaDescription ?? "").slice(0, 200),
    slug: String(parsed.slug ?? "news-update")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180),
    category: String(parsed.category ?? categories[0] ?? "India"),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 8) : [],
    imagePrompt: String(parsed.imagePrompt ?? "Indian news editorial photo"),
    confidence,
    needsVerification,
    verificationNotes: parsed.verificationNotes ? String(parsed.verificationNotes) : undefined,
    _durationMs: Date.now() - start,
    _tokensUsed: data.usageMetadata?.totalTokenCount,
  };
}
