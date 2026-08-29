import type { ContentBlock } from "@/lib/types";

export type User = { id: string; email: string; name: string; role: string };

export type Meta = {
  categories: Array<{ id: string; slug: string; name: string }>;
  authors: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
};

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  viewCount: number;
  content: ContentBlock[];
  highlight?: string | null;
  location?: string | null;
  featured: boolean;
  breaking: boolean;
  trending: boolean;
  trendingOverride?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  videoUrl?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  category: { id: string; name: string };
  author: { id: string; name: string };
  featuredImage?: { id: string; url: string; alt?: string | null } | null;
  tags: Array<{ tag: { name: string } }>;
};

export type MediaItem = { id: string; url: string; filename: string; alt?: string | null };

export type StorageStatus = { provider: string; configured: boolean; message?: string };

export type AnalyticsSummary = {
  views?: { today: number; week: number; month: number; total: number };
  postCounts?: { total: number; published: number; draft: number; review: number; scheduled?: number };
  newsletterSubscribers?: number;
};

export type AdminSection =
  | "dashboard"
  | "posts"
  | "media"
  | "categories"
  | "breaking"
  | "comments"
  | "ads"
  | "settings";
