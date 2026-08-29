import { z } from "zod";
import { articles, type Article } from "./data";

export const postInputSchema = z.object({
  title: z.string().trim().min(10).max(160),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(180),
  excerpt: z.string().trim().min(20).max(280),
  category: z.string().min(1),
  content: z.array(z.string().trim().min(1)).min(1),
  status: z.enum(["draft", "review", "published"]),
});
export type PostInput = z.infer<typeof postInputSchema>;
export type CmsRole = "admin" | "editor" | "reporter" | "moderator";

export interface ContentRepository {
  list(): Promise<Article[]>;
  findBySlug(slug: string): Promise<Article | null>;
  save(input: PostInput, actorId: string): Promise<{ id: string }>;
}

/**
 * Read-only demo adapter. Replace through dependency injection with a server-only
 * database adapter; never trust client values or authorization roles.
 */
export class DemoContentRepository implements ContentRepository {
  async list() { return articles; }
  async findBySlug(slug: string) { return articles.find((item) => item.slug === slug) ?? null; }
  async save(input: PostInput, actorId: string) {
    const validated = postInputSchema.parse(input);
    if (!actorId) throw new Error("Authenticated actor required");
    return { id: `demo-${validated.slug}` };
  }
}

export function stripUnsafeMarkup(value: string) {
  return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "").replace(/\son\w+="[^"]*"/gi, "");
}
