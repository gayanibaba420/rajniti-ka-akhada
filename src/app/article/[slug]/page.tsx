import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { Comments, ShareActions } from "@/components/article-actions";
import { AdSlot } from "@/components/site-shell";
import { SidebarList, StoryCard } from "@/components/story-card";
import { articles, categories, getArticle, getRelated, siteConfig } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return articles.map((article) => ({ slug: article.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticle((await params).slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt, alternates: { canonical: `/article/${article.slug}` }, openGraph: { type: "article", title: article.title, description: article.excerpt, publishedTime: article.publishedAt, authors: [article.author], images: [article.image] }, twitter: { card: "summary_large_image", title: article.title, description: article.excerpt, images: [article.image] } };
}

export default async function ArticlePage({ params }: Props) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const category = categories.find((item) => item.slug === article.category)!;
  const related = getRelated(article);
  const url = `${siteConfig.url}/article/${article.slug}`;
  const schema = { "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title, description: article.excerpt, image: [`${siteConfig.url}${article.image}`], datePublished: article.publishedAt, dateModified: article.publishedAt, author: { "@type": "Person", name: article.author }, publisher: { "@type": "NewsMediaOrganization", name: siteConfig.name }, mainEntityOfPage: url };
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "होम", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: category.name, item: `${siteConfig.url}/category/${category.slug}` }, { "@type": "ListItem", position: 3, name: article.title, item: url }] };
  return (
    <div className="container-main py-7">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumb).replace(/</g,"\\u003c")}}/>
      <nav aria-label="ब्रेडक्रंब" className="muted mb-6 line-clamp-1 text-sm"><Link href="/">होम</Link> / <Link href={`/category/${category.slug}`}>{category.name}</Link> / {article.title}</nav>
      <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_330px]">
        <article>
          <span className="rounded-md bg-[#a71d2a] px-3 py-1.5 text-sm font-black text-white">{category.name}</span>
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-5xl">{article.title}</h1>
          <p className="muted mt-4 border-l-4 border-[var(--accent)] pl-4 text-lg leading-8">{article.excerpt}</p>
          <div className="muted my-5 flex flex-wrap items-center gap-4 border-y py-4 text-sm" style={{borderColor:"var(--line)"}}><strong className="text-[var(--foreground)]">{article.author}</strong><span className="flex items-center gap-1"><Clock size={15}/>{new Intl.DateTimeFormat("hi-IN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(article.publishedAt))}</span><span className="flex items-center gap-1"><Eye size={15}/>{article.views.toLocaleString("hi-IN")}</span>{article.location&&<span className="flex items-center gap-1"><MapPin size={15}/>{article.location}</span>}</div>
          <ShareActions title={article.title}/>
          <figure className="mt-6"><div className="relative aspect-[16/9] overflow-hidden rounded-2xl"><Image src={article.image} alt={article.imageAlt} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 800px"/></div><figcaption className="muted mt-2 text-xs">{article.imageAlt} • राजनीति का अखाड़ा ग्राफ़िक</figcaption></figure>
          <div className="my-7 rounded-xl border-l-8 border-[var(--brand)] bg-[var(--surface)] p-5 shadow-sm"><strong className="brand">खबर का सार</strong><p className="mt-2 font-bold leading-7">{article.excerpt} योजना की प्रगति की सार्वजनिक समीक्षा भी की जाएगी।</p></div>
          <div className="prose-news">{article.content.map((paragraph,index)=><div key={paragraph}>{index===1&&<AdSlot label="इन-आर्टिकल विज्ञापन • 728 × 90"/>}<p>{paragraph}</p>{index===0&&<h2 className="mt-8 text-2xl font-black">जमीनी असर और आगे की राह</h2>}</div>)}</div>
          <div className="mt-7 flex flex-wrap gap-2">{article.tags.map((tag)=><Link className="rounded-full border px-3 py-1 text-sm font-bold" style={{borderColor:"var(--line)"}} href={`/search?q=${tag}`} key={tag}>#{tag}</Link>)}</div>
          <section className="surface mt-8 flex gap-4 rounded-xl p-5"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-xl font-black text-white">{article.author[0]}</div><div><span className="muted text-xs">लेखक</span><h2 className="font-black">{article.author}</h2><p className="muted mt-1 text-sm leading-6">हरियाणा के सामाजिक, राजनीतिक और स्थानीय मुद्दों पर तथ्य-आधारित रिपोर्टिंग।</p></div></section>
          <Comments/>
        </article>
        <aside className="grid content-start gap-6"><AdSlot label="साइडबार विज्ञापन • 300 × 250"/><SidebarList title="आपके लिए" items={articles.slice(4,9)}/></aside>
      </div>
      <section className="mt-12"><h2 className="section-title">संबंधित खबरें</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{(related.length?related:articles.slice(1,5)).map((item)=><StoryCard article={item} key={item.slug}/>)}</div></section>
    </div>
  );
}
