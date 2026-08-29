import { revalidatePath, revalidateTag } from "next/cache";

export const ARTICLES_CACHE_TAG = "articles";

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
