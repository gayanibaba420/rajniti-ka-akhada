import { revalidatePath, revalidateTag } from "next/cache";

export const ARTICLES_CACHE_TAG = "articles";
export const BLOGS_CACHE_TAG = "blogs";

/** Bust public page caches after CMS article mutations. */
export function revalidatePublicPages(options?: { slug?: string; categorySlug?: string }) {
  revalidateTag(ARTICLES_CACHE_TAG, "max");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");

  if (options?.slug) {
    revalidatePath(`/article/${options.slug}`);
  }
  if (options?.categorySlug) {
    revalidatePath(`/category/${options.categorySlug}`);
  }
}

/** Bust public page caches after CMS blog mutations. */
export function revalidateBlogPages(options?: { slug?: string }) {
  revalidateTag(BLOGS_CACHE_TAG, "max");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (options?.slug) {
    revalidatePath(`/blog/${options.slug}`);
  }
}
