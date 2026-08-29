import type { Metadata } from "next";
import Link from "next/link";
import { countPublishedBlogPosts, getPublishedBlogPosts } from "@/lib/blogs";
import { checkDbConnection } from "@/lib/db";
import { getPublicSiteConfig } from "@/lib/public-data";
import { BlogCard, BlogEmptyState } from "@/components/blog-card";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig();
  return {
    title: "ब्लॉग",
    description: `${config.name} — विश्लेषण, राय और गहन लेख`,
    alternates: { canonical: "/blog" },
    openGraph: {
      type: "website",
      title: `ब्लॉग | ${config.name}`,
      description: "राजनीति, समाज और देश-दुनिया पर विशेष ब्लॉग",
    },
  };
}

export default async function BlogListingPage({ searchParams }: Props) {
  const dbOk = await checkDbConnection();
  if (!dbOk) {
    return (
      <div className="container-main py-20 text-center">
        <h1 className="text-2xl font-black">सेवा अस्थायी रूप से अनुपलब्ध</h1>
      </div>
    );
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const skip = (page - 1) * PAGE_SIZE;

  const [blogs, total] = await Promise.all([
    getPublishedBlogPosts({ limit: PAGE_SIZE, skip }),
    countPublishedBlogPosts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container-main py-8">
      <nav aria-label="ब्रेडक्रंब" className="muted mb-6 text-sm">
        <Link href="/">होम</Link> / ब्लॉग
      </nav>
      <header className="mb-8 border-b pb-6" style={{ borderColor: "var(--line)" }}>
        <span className="eyebrow">विशेष लेख</span>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">ब्लॉग</h1>
        <p className="muted mt-3 max-w-2xl text-lg leading-8">
          राजनीति, समाज और देश-दुनिया पर विश्लेषण, राय और गहन लेख।
        </p>
      </header>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.length === 0 ? (
          <BlogEmptyState />
        ) : (
          blogs.map((blog, index) => <BlogCard key={blog.slug} blog={blog} priority={index < 3} />)
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="पेजिनेशन" className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {page > 1 && (
            <Link href={page === 2 ? "/blog" : `/blog?page=${page - 1}`} className="btn btn-ghost">
              ← पिछला
            </Link>
          )}
          <span className="muted px-3 text-sm font-bold">
            पृष्ठ {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/blog?page=${page + 1}`} className="btn btn-ghost">
              अगला →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
