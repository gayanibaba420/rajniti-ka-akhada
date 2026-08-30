import { z } from "zod";

export const aiRadarSettingsSchema = z.object({
  provider: z.literal("gemini"),
  newsSource: z.enum(["gnews", "rss"]),
  maxArticlesPerFetch: z.number().int().min(1).max(25),
  autoFetchIntervalMinutes: z.number().int().min(15).max(360),
  minAiConfidence: z.number().min(0).max(1),
  duplicateDetection: z.boolean(),
  requireManualApproval: z.boolean(),
  categories: z.array(z.string().min(1).max(80)).min(1),
  enabled: z.boolean(),
});

export const aiNewsDraftUpdateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(180).optional(),
  content: z.string().min(20).optional(),
  summary: z.string().max(500).optional(),
  metaTitle: z.string().max(120).optional(),
  metaDescription: z.string().max(200).optional(),
  category: z.string().max(80).optional(),
  tags: z.array(z.string()).max(10).optional(),
  imagePrompt: z.string().max(500).optional(),
  status: z.enum(["DRAFT", "NEEDS_VERIFICATION", "APPROVED", "REJECTED"]).optional(),
  featuredImageId: z.string().nullable().optional(),
});

export const aiNewsBulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
  action: z.enum(["approve", "reject", "delete"]),
});

export const aiNewsPublishSchema = z.object({
  featuredImageId: z.string().nullable().optional(),
  authorName: z.string().min(2).max(80).optional(),
  confirmAiWarning: z.literal(true),
});
