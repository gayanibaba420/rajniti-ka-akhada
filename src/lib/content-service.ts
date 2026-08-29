import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().trim().min(10).max(160),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(180),
  excerpt: z.string().trim().min(20).max(280),
  categoryId: z.string().min(1),
  authorId: z.string().min(1),
  content: z.array(z.record(z.string(), z.unknown())).min(1),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
});

export type PostInput = z.infer<typeof postInputSchema>;

export { stripUnsafeMarkup } from "./types";
