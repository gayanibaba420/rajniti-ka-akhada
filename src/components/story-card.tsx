import Image from "next/image";
import Link from "next/link";
import type { PublicArticle } from "@/lib/types";
import { EditorsPickBadge } from "./article-badges";
import { CategoryBadge } from "./category-badge";

export function StoryCard({ article, horizontal = false, priority = false, categories }: { article: PublicArticle; horizontal?: boolean; priority?: boolean; categories?: Array<{ slug: string; name: string }> }) {
  const category = categories?.find((item) => item.slug === article.category)?.name ?? article.categoryName;
  const hasImage = Boolean(article.image);
  return (
    <article className={`story-link story-card group ${horizontal && hasImage ? "grid grid-cols-[120px_1fr] gap-3 sm:grid-cols-[180px_1fr]" : ""}`}>
      {hasImage ? (
        <Link href={`/article/${article.slug}`} className={`relative block overflow-hidden rounded-xl bg-neutral-200 transition-shadow hover:shadow-md ${horizontal ? "min-h-28" : "aspect-[16/10]"}`}>
          <Image className="story-image object-cover" fill src={article.image!} alt={article.imageAlt ?? article.title} sizes={horizontal ? "180px" : "(max-width: 768px) 100vw, 33vw"} priority={priority} />
          {!horizontal && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <CategoryBadge label={category} slug={article.category} className="!px-2 !py-1" />
              {article.featured && <EditorsPickBadge />}
            </div>
          )}
        </Link>
      ) : (
        !horizontal && (
          <Link href={`/article/${article.slug}`} className="relative block overflow-hidden rounded-xl border bg-[var(--surface)] p-4 transition-shadow hover:shadow-md" style={{ borderColor: "var(--line)" }}>
            <div className="flex flex-wrap gap-1.5">
              <CategoryBadge label={category} slug={article.category} className="!px-2 !py-1" />
              {article.featured && <EditorsPickBadge />}
            </div>
          </Link>
        )
      )}
      <div className={horizontal ? "py-1" : "pt-3"}>
        <div className="flex flex-wrap items-center gap-2">
          {horizontal && <span className="eyebrow">{category}</span>}
          {horizontal && article.featured && <EditorsPickBadge />}
        </div>
        <h3 className={`${horizontal ? "text-base sm:text-lg" : "text-lg"} mt-1 font-black leading-snug group-hover:text-[var(--brand)]`}><Link href={`/article/${article.slug}`}>{article.title}</Link></h3>
        {!horizontal && <p className="muted mt-2 line-clamp-2 text-sm leading-6">{article.excerpt}</p>}
        <div className="muted mt-2 flex flex-wrap items-center gap-3 text-xs">{article.location && <span>{article.location}</span>}<span>{article.readTime}</span></div>
      </div>
    </article>
  );
}

export function SidebarList({ title = "सबसे ज्यादा पढ़ी गई", items, variant = "default" }: { title?: string; items: PublicArticle[]; variant?: "default" | "trending" }) {
  return (
    <aside className={`surface rounded-xl p-5 ${variant === "trending" ? "border-[var(--brand)]/30 bg-gradient-to-br from-[var(--surface)] to-[var(--brand)]/5" : ""}`}>
      <h2 className="section-title !text-xl">{title}</h2>
      {variant === "trending" && <p className="muted -mt-2 mb-4 text-xs">पिछले 7 दिनों में सबसे चर्चित खबरें</p>}
      <div className="grid gap-4">
        {items.map((article, index) => (
          <Link key={article.slug} href={`/article/${article.slug}`} className="group grid grid-cols-[34px_1fr] gap-3 border-b pb-4 last:border-0 last:pb-0" style={{ borderColor: "var(--line)" }}>
            <span className={`text-3xl font-black ${variant === "trending" && index < 3 ? "text-[var(--brand)]" : "text-[var(--line)]"}`}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <span className="eyebrow">{article.categoryName}</span>
              <h3 className="mt-1 text-sm font-bold leading-6 group-hover:text-[var(--brand)]">{article.title}</h3>
              {variant === "trending" && <span className="muted mt-1 block text-xs">{article.readTime}</span>}
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
