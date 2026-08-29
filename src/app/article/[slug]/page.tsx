import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { Comments, ShareActions } from "@/components/article-actions";
import { DbAdSlot } from "@/components/db-ad-slot";
import { SidebarList, StoryCard } from "@/components/story-card";
import { ViewTracker } from "@/components/view-tracker";
import { getArticleBySlug, getCategories, getPublishedArticles, getRelatedArticles, getSiteConfig } from "@/lib/articles";
import { checkDbConnection, hasDatabaseUrl, prisma } from "@/lib/db";
import { getPublicSiteConfig, safeDbQuery } from "@/lib/public-data";
import type { ContentBlock } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = await getPublicSiteConfig();
  const article = await safeDbQuery(() => getArticleBySlug(slug), null);
  if (!article) return {};
  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt,
    alternates: { canonical: article.canonicalUrl ?? `/article/${article.slug}` },
    openGraph: { type: "article", title: article.title, description: article.excerpt, publishedTime: article.publishedAt, authors: [article.author], images: [article.image.startsWith("http") ? article.image : `${config.url}${article.image}`] },
    twitter: { card: "summary_large_image", title: article.title, description: article.excerpt, images: [article.image.startsWith("http") ? article.image : `${config.url}${article.image}`] },
  };
}

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? <h2 key={index} className="mt-8 text-2xl font-black">{block.text}</h2> : <h3 key={index} className="mt-6 text-xl font-black">{block.text}</h3>;
    case "quote":
      return <blockquote key={index} className="my-6 border-l-4 border-[var(--brand)] pl-4 italic">{block.text}{block.cite && <cite className="mt-2 block text-sm not-italic">— {block.cite}</cite>}</blockquote>;
    case "list":
      return block.ordered ? <ol key={index} className="my-4 list-decimal pl-6">{block.items.map((item, i) => <li key={i} className="mb-2">{item}</li>)}</ol> : <ul key={index} className="my-4 list-disc pl-6">{block.items.map((item, i) => <li key={i} className="mb-2">{item}</li>)}</ul>;
    case "image":
      return <figure key={index} className="my-6"><div className="relative aspect-[16/9] overflow-hidden rounded-xl"><Image src={block.url} alt={block.alt ?? ""} fill className="object-cover" sizes="800px" /></div>{block.caption && <figcaption className="muted mt-2 text-xs">{block.caption}</figcaption>}</figure>;
    case "embed":
      return <div key={index} className="my-6 aspect-video overflow-hidden rounded-xl"><iframe src={block.url} className="h-full w-full" title="embedded content" allowFullScreen /></div>;
    default:
      return <p key={index}>{block.text}</p>;
  }
}

export default async function ArticlePage({ params }: Props) {
  const dbOk = await checkDbConnection();
  if (!dbOk) {
    return <div className="container-main py-20 text-center"><h1 className="text-2xl font-black">सेवा अस्थायी रूप से अनुपलब्ध</h1></div>;
  }

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [config, categories, related, sidebarArticles] = await Promise.all([
    getSiteConfig(),
    getCategories(),
    getRelatedArticles(article),
    safeDbQuery(() => getPublishedArticles({ limit: 5, skip: 4 }), []),
  ]);

  const url = `${config.url}/article/${article.slug}`;
  const schema = { "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title, description: article.excerpt, image: [`${config.url}${article.image.startsWith("http") ? article.image : article.image}`], datePublished: article.publishedAt, dateModified: article.publishedAt, author: { "@type": "Person", name: article.author }, publisher: { "@type": "NewsMediaOrganization", name: config.name }, mainEntityOfPage: url };
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "होम", item: config.url }, { "@type": "ListItem", position: 2, name: article.categoryName, item: `${config.url}/category/${article.category}` }, { "@type": "ListItem", position: 3, name: article.title, item: url }] };
  const blocks = article.contentBlocks ?? [];

  return (
    <div className="container-main py-7">
      <ViewTracker slug={slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
      <nav aria-label="ब्रेडक्रंब" className="muted mb-6 line-clamp-1 text-sm"><Link href="/">होम</Link> / <Link href={`/category/${article.category}`}>{article.categoryName}</Link> / {article.title}</nav>
      <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_330px]">
        <article>
          <DbAdSlot position="ARTICLE_TOP" />
          <span className="mt-4 inline-block rounded-md bg-[#a71d2a] px-3 py-1.5 text-sm font-black text-white">{article.categoryName}</span>
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-5xl">{article.title}</h1>
          <p className="muted mt-4 border-l-4 border-[var(--accent)] pl-4 text-lg leading-8">{article.excerpt}</p>
          <div className="muted my-5 flex flex-wrap items-center gap-4 border-y py-4 text-sm" style={{ borderColor: "var(--line)" }}><strong className="text-[var(--foreground)]">{article.author}</strong><span className="flex items-center gap-1"><Clock size={15} />{new Intl.DateTimeFormat("hi-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(article.publishedAt))}</span><span className="flex items-center gap-1"><Eye size={15} />{article.views.toLocaleString("hi-IN")}</span>{article.location && <span className="flex items-center gap-1"><MapPin size={15} />{article.location}</span>}</div>
          <ShareActions title={article.title} />
          <figure className="mt-6"><div className="relative aspect-[16/9] overflow-hidden rounded-2xl"><Image src={article.image} alt={article.imageAlt} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" /></div><figcaption className="muted mt-2 text-xs">{article.imageAlt}</figcaption></figure>
          {article.highlight && <div className="my-7 rounded-xl border-l-8 border-[var(--brand)] bg-[var(--surface)] p-5 shadow-sm"><strong className="brand">खबर का सार</strong><p className="mt-2 font-bold leading-7">{article.highlight}</p></div>}
          <div className="prose-news">
            {(blocks.length ? blocks : article.content.map((text) => ({ type: "paragraph" as const, text }))).map((block, index) => (
              <div key={index}>
                {index === 1 && <DbAdSlot position="ARTICLE_MIDDLE" />}
                {renderBlock(block as ContentBlock, index)}
              </div>
            ))}
          </div>
          <DbAdSlot position="ARTICLE_BOTTOM" />
          <div className="mt-7 flex flex-wrap gap-2">{article.tags.map((tag) => <Link className="rounded-full border px-3 py-1 text-sm font-bold" style={{ borderColor: "var(--line)" }} href={`/search?q=${tag}`} key={tag}>#{tag}</Link>)}</div>
          <section className="surface mt-8 flex gap-4 rounded-xl p-5"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-xl font-black text-white">{article.author[0]}</div><div><span className="muted text-xs">लेखक</span><h2 className="font-black">{article.author}</h2></div></section>
          <Comments articleSlug={slug} />
        </article>
        <aside className="grid content-start gap-6"><DbAdSlot position="SIDEBAR" /><SidebarList title="आपके लिए" items={sidebarArticles} /></aside>
      </div>
      <section className="mt-12"><h2 className="section-title">संबंधित खबरें</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{(related.length ? related : sidebarArticles).map((item) => <StoryCard article={item} categories={categories} key={item.slug} />)}</div></section>
    </div>
  );
}

export async function generateStaticParams() {
  if (!hasDatabaseUrl()) return [];
  try {
    const ok = await checkDbConnection();
    if (!ok) return [];
    const rows = await prisma.article.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } });
    return rows.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}
