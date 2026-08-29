import type { PublicArticle, PublicCategory, ContentBlock } from "./types";
import { siteConfig as fallbackConfig } from "./data";

const DEFAULT_API = "http://localhost:4000";

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API).replace(/\/+$/, "");
}

export function getClientApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API).replace(/\/+$/, "");
  }
  return getApiBaseUrl();
}

type FetchOptions = RequestInit & { revalidate?: number | false };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T | null> {
  const { revalidate, ...init } = options;
  const url = `${getApiBaseUrl()}${path}`;

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      ...(revalidate !== undefined ? { next: { revalidate } } : { cache: "no-store" }),
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`API ${res.status}: ${path}`);
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error("[api-client]", path, error);
    return null;
  }
}

/** Client-side fetch with credentials for admin */
export async function clientApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getClientApiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `API error ${res.status}`);
  return data as T;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/health`, { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string; database?: string };
    return data.status === "ok" && data.database === "connected";
  } catch {
    return false;
  }
}

export async function getPublicSiteConfig() {
  const config = await apiFetch<{
    name: string;
    tagline: string;
    description: string;
    url: string;
    email: string;
  }>("/api/public/site-config");
  return config ?? fallbackConfig;
}

export async function getCategories(): Promise<PublicCategory[]> {
  const data = await apiFetch<{ categories: PublicCategory[] }>("/api/public/categories");
  return data?.categories ?? [];
}

export async function getCategoryBySlug(slug: string) {
  const data = await apiFetch<{ category: PublicCategory & { id?: string } }>(`/api/public/categories/${slug}`);
  return data?.category ?? null;
}

export async function getPublishedArticles(options?: {
  categorySlug?: string;
  featured?: boolean;
  breaking?: boolean;
  limit?: number;
  skip?: number;
}): Promise<PublicArticle[]> {
  const params = new URLSearchParams();
  if (options?.categorySlug) params.set("categorySlug", options.categorySlug);
  if (options?.featured) params.set("featured", "true");
  if (options?.breaking) params.set("breaking", "true");
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.skip) params.set("skip", String(options.skip));
  const qs = params.toString();
  const data = await apiFetch<{ articles: PublicArticle[] }>(`/api/public/articles${qs ? `?${qs}` : ""}`);
  return data?.articles ?? [];
}

export async function getArticleBySlug(slug: string): Promise<PublicArticle | null> {
  const data = await apiFetch<{ article: PublicArticle }>(`/api/public/articles/${slug}`);
  return data?.article ?? null;
}

export async function getRelatedArticles(article: PublicArticle, limit = 4): Promise<PublicArticle[]> {
  const data = await apiFetch<{ articles: PublicArticle[] }>(
    `/api/public/articles/${article.slug}/related?limit=${limit}`,
  );
  return data?.articles ?? [];
}

export async function getTrendingArticles(limit = 10): Promise<PublicArticle[]> {
  const data = await apiFetch<{ articles: PublicArticle[] }>(`/api/public/trending?limit=${limit}`);
  return data?.articles ?? [];
}

export async function searchArticles(query: string, page = 1, pageSize = 6) {
  const params = new URLSearchParams({ q: query, page: String(page), pageSize: String(pageSize) });
  const data = await apiFetch<{ items: PublicArticle[]; total: number; page: number; pageSize: number }>(
    `/api/public/search?${params}`,
  );
  return data ?? { items: [] as PublicArticle[], total: 0, page, pageSize };
}

export async function getBreakingNewsItems() {
  const data = await apiFetch<{ items: Array<{ title: string; slug: string | null; link: string }> }>(
    "/api/public/breaking",
  );
  return data?.items ?? [];
}

export async function getActiveAds(position?: string) {
  const qs = position ? `?position=${position}` : "";
  const data = await apiFetch<{ ads: Array<{ id: string; name: string; position: string; code: string; enabled: boolean }> }>(
    `/api/public/ads${qs}`,
  );
  return data?.ads ?? [];
}

export async function getPublishedArticleSlugs(limit = 5000): Promise<string[]> {
  const data = await apiFetch<{ slugs: string[] }>(`/api/public/articles?limit=${limit}`);
  return data?.slugs ?? [];
}

export async function getCategoryArticleCount(categorySlug: string): Promise<number> {
  const data = await apiFetch<{ total: number }>(`/api/public/articles/count?categorySlug=${categorySlug}`);
  return data?.total ?? 0;
}

export async function safeApiQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const ok = await checkApiHealth();
    if (!ok) return fallback;
    return await fn();
  } catch (error) {
    console.error("[api-query]", error);
    return fallback;
  }
}

export function apiPath(path: string): string {
  const base = getClientApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
