import Image from "next/image";
import Link from "next/link";
import type { PublicBlogPost } from "@/lib/types";
import { formatHindiDate } from "@/lib/types";

export function BlogCard({ blog, priority = false }: { blog: PublicBlogPost; priority?: boolean }) {
  return (
    <article className="story-link group">
      {blog.image ? (
        <Link href={`/blog/${blog.slug}`} className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-neutral-200">
          <Image
            className="story-image object-cover"
            fill
            src={blog.image}
            alt={blog.imageAlt ?? blog.title}
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
          />
          <div className="absolute left-3 top-3">
            <span className="rounded-md bg-[#a71d2a] px-2 py-1 text-xs font-black text-white">ब्लॉग</span>
          </div>
        </Link>
      ) : (
        <Link href={`/blog/${blog.slug}`} className="relative block overflow-hidden rounded-xl border bg-[var(--surface)] p-4" style={{ borderColor: "var(--line)" }}>
          <span className="rounded-md bg-[#a71d2a] px-2 py-1 text-xs font-black text-white">ब्लॉग</span>
        </Link>
      )}
      <div className="pt-3">
        <h3 className="text-lg font-black leading-snug group-hover:text-[var(--brand)]">
          <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
        </h3>
        <p className="muted mt-2 line-clamp-2 text-sm leading-6">{blog.excerpt}</p>
        <div className="muted mt-2 flex flex-wrap items-center gap-3 text-xs">
          <span>{blog.author}</span>
          <span>{formatHindiDate(blog.publishedAt)}</span>
          <span>{blog.readTime}</span>
        </div>
      </div>
    </article>
  );
}

export function BlogEmptyState() {
  return (
    <div className="surface col-span-full grid min-h-[40vh] place-items-center rounded-2xl p-10 text-center">
      <div>
        <p className="text-5xl font-black text-[var(--line)]">📝</p>
        <h2 className="mt-4 text-2xl font-black">अभी कोई ब्लॉग प्रकाशित नहीं</h2>
        <p className="muted mt-2 max-w-md">जल्द ही यहाँ विश्लेषण, राय और गहन लेख दिखेंगे।</p>
        <Link href="/" className="btn btn-primary mt-6">
          होम पर जाएं
        </Link>
      </div>
    </div>
  );
}
