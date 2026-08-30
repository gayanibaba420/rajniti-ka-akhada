import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { CategoryBadge } from "@/components/category-badge";
import { AuthorLink } from "@/components/article-badges";
import { BlogCard } from "@/components/blog-card";
import { renderContentBlock } from "@/components/content-blocks";
import { ShareActions } from "@/components/article-actions";
import { getBlogPostBySlug, getPublishedBlogPosts, getRelatedBlogPosts } from "@/lib/blogs";
import { getSiteConfig } from "@/lib/articles";
import { resolveOgImageUrl } from "@/lib/data";
import { checkDbConnection } from "@/lib/db";
import { getPublicSiteConfig } from "@/lib/public-data";
import type { ContentBlock } from "@/lib/types";
import { formatHindiDate, formatHindiDateTime } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = await getPublicSiteConfig();
  const blog = await getBlogPostBySlug(slug);
  if (!blog) return {};
  const ogImage = resolveOgImageUrl(blog.image, config.url);
  return {
    title: blog.seoTitle ?? blog.title,
    description: blog.seoDescription ?? blog.excerpt,
    alternates: { canonical: `/blog/${blog.slug}` },
    openGraph: {
      type: "article",
      title: blog.title,
      description: blog.excerpt,
      publishedTime: blog.publishedAt,
      authors: [blog.author],
      images: [{
        url: ogImage,
        alt: blog.imageAlt ?? blog.title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const dbOk = await checkDbConnection();
  if (!dbOk) {
    return (
      <div className="container-main py-20 text-center">
        <h1 className="text-2xl font-black">सेवा अस्थायी रूप से अनुपलब्ध</h1>
      </div>
    );
  }

  const { slug } = await params;
  const blog = await getBlogPostBySlug(slug);
  if (!blog) notFound();

  const [config, related, recentBlogs] = await Promise.all([
    getSiteConfig(),
    getRelatedBlogPosts(blog),
    getPublishedBlogPosts({ limit: 4 }),
  ]);

  const url = `${config.url}/blog/${blog.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    image: [resolveOgImageUrl(blog.image, config.url)],
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt ?? blog.publishedAt,
    author: { "@type": "Person", name: blog.author },
    publisher: { "@type": "Organization", name: config.name },
    mainEntityOfPage: url,
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "होम", item: config.url },
      { "@type": "ListItem", position: 2, name: "ब्लॉग", item: `${config.url}/blog` },
      { "@type": "ListItem", position: 3, name: blog.title, item: url },
    ],
  };

  const blocks = blog.contentBlocks ?? [];
  const showUpdated =
    blog.updatedAt &&
    new Date(blog.updatedAt).getTime() > new Date(blog.publishedAt).getTime() + 60_000;

  return (
    <div className="container-main py-7">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
      <nav aria-label="ब्रेडक्रंब" className="muted mb-6 line-clamp-1 text-sm">
        <Link href="/">होम</Link> / <Link href="/blog">ब्लॉग</Link> / {blog.title}
      </nav>
      <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_330px]">
        <article>
          <CategoryBadge label="ब्लॉग" slug="blog" className="mt-4 !px-3 !py-1.5 !text-sm" />
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-5xl">{blog.title}</h1>
          <p className="muted mt-4 border-l-4 border-[var(--accent)] pl-4 text-lg leading-8">{blog.excerpt}</p>
          <div className="muted my-5 flex flex-wrap items-center gap-4 border-y py-4 text-sm" style={{ borderColor: "var(--line)" }}>
            <AuthorLink name={blog.author} slug={blog.authorSlug} />
            <span className="flex items-center gap-1">
              <Clock size={15} />
              {formatHindiDateTime(blog.publishedAt)}
            </span>
            <span>{blog.readTime}</span>
            {showUpdated && blog.updatedAt && (
              <span>अपडेट: {formatHindiDate(blog.updatedAt)}</span>
            )}
            <span className="flex items-center gap-1">
              <Eye size={15} />
              {blog.views.toLocaleString("hi-IN")}
            </span>
          </div>
          <div className="no-print">
            <ShareActions title={blog.title} />
          </div>
          {blog.image ? (
            <figure className="mt-6">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                <Image src={blog.image} alt={blog.imageAlt ?? blog.title} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
              </div>
              {blog.imageAlt && <figcaption className="muted mt-2 text-xs">{blog.imageAlt}</figcaption>}
            </figure>
          ) : null}
          <div className="prose-news">
            {(blocks.length ? blocks : blog.content.map((text) => ({ type: "paragraph" as const, text }))).map((block, index) =>
              renderContentBlock(block as ContentBlock, index),
            )}
          </div>
          {blog.tags.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <Link
                  className="rounded-full border px-3 py-1 text-sm font-bold"
                  style={{ borderColor: "var(--line)" }}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  key={tag}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          <section className="surface mt-8 flex gap-4 rounded-xl p-5">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-xl font-black text-white">
              {blog.author[0]}
            </div>
            <div>
              <span className="muted text-xs">लेखक</span>
              <h2 className="font-black">
                <AuthorLink name={blog.author} slug={blog.authorSlug} />
              </h2>
            </div>
          </section>
        </article>
        <aside className="grid content-start gap-6">
          <div className="surface rounded-xl p-5">
            <h2 className="section-title !text-xl">हाल के ब्लॉग</h2>
            <div className="mt-4 grid gap-4">
              {recentBlogs
                .filter((item) => item.slug !== blog.slug)
                .slice(0, 4)
                .map((item) => (
                  <Link
                    key={item.slug}
                    href={`/blog/${item.slug}`}
                    className="group border-b pb-4 last:border-0 last:pb-0"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <h3 className="text-sm font-bold leading-6 group-hover:text-[var(--brand)]">{item.title}</h3>
                    <span className="muted mt-1 block text-xs">{formatHindiDate(item.publishedAt)}</span>
                  </Link>
                ))}
            </div>
          </div>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="section-title">संबंधित ब्लॉग</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <BlogCard key={item.slug} blog={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
