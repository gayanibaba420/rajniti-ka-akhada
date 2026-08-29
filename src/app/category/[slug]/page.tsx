import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DbAdSlot } from "@/components/db-ad-slot";
import { SidebarList, StoryCard } from "@/components/story-card";
import { getCategories, getCategoryBySlug, getPublishedArticles, getTrendingArticles } from "@/lib/articles";
import { checkDbConnection, hasDatabaseUrl } from "@/lib/db";
import { getPublicSiteConfig, safeDbQuery } from "@/lib/public-data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = await getPublicSiteConfig();
  const category = await safeDbQuery(() => getCategoryBySlug(slug), null);
  if (!category) return {};
  return { title: category.name, description: category.description, alternates: { canonical: `/category/${slug}` }, openGraph: { title: `${category.name} समाचार`, description: category.description, url: `${config.url}/category/${slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const dbOk = await checkDbConnection();
  if (!dbOk) {
    return <div className="container-main py-20 text-center"><h1 className="text-2xl font-black">सेवा अस्थायी रूप से अनुपलब्ध</h1></div>;
  }

  const { slug } = await params;
  const { page: pageValue } = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const current = Math.max(1, Number(pageValue) || 1);
  const pageSize = 6;

  const [items, total, categories, trending] = await Promise.all([
    getPublishedArticles({ categorySlug: slug, skip: (current - 1) * pageSize, limit: pageSize }),
    safeDbQuery(async () => {
      const { prisma } = await import("@/lib/db");
      return prisma.article.count({ where: { status: "PUBLISHED", category: { slug }, publishedAt: { lte: new Date() } } });
    }, 0),
    getCategories(),
    getTrendingArticles(5),
  ]);

  const featured = items[0] ?? (current === 1 ? (await getPublishedArticles({ categorySlug: slug, limit: 1 }))[0] : undefined);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container-main py-8">
      <nav className="muted mb-5 text-sm" aria-label="ब्रेडक्रंब"><Link href="/">होम</Link> / {category.name}</nav>
      <header className="mb-8 border-l-8 border-[var(--brand)] pl-5"><p className="eyebrow">ताज़ा अपडेट</p><h1 className="mt-1 text-4xl font-black">{category.name} समाचार</h1><p className="muted mt-2">{category.description}</p></header>
      {featured && current === 1 && <section className="surface mb-8 grid overflow-hidden rounded-2xl md:grid-cols-2"><div className="p-5 sm:p-8"><span className="eyebrow">विशेष खबर</span><h2 className="mt-3 text-2xl font-black leading-snug sm:text-3xl"><Link href={`/article/${featured.slug}`}>{featured.title}</Link></h2><p className="muted mt-4 leading-7">{featured.excerpt}</p><Link className="btn btn-primary mt-5" href={`/article/${featured.slug}`}>पूरी खबर पढ़ें</Link></div><StoryCard article={featured} priority categories={categories} /></section>}
      <DbAdSlot position="HOMEPAGE" label="कैटेगरी बैनर • 728 × 90" />
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_330px]">
        <section><h2 className="section-title">नवीनतम खबरें</h2><div className="grid gap-7 sm:grid-cols-2">{items.map((item) => <StoryCard article={item} categories={categories} key={item.slug} />)}</div>{items.length === 0 && <div className="surface rounded-xl p-12 text-center"><h2 className="text-xl font-black">इस पेज पर अभी कोई खबर नहीं</h2></div>}<nav className="mt-9 flex justify-center gap-2" aria-label="पेजिनेशन">{Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => <Link aria-current={page === current ? "page" : undefined} className={`btn ${page === current ? "btn-primary" : "btn-ghost"}`} href={`/category/${slug}?page=${page}`} key={page}>{page}</Link>)}</nav></section>
        <div className="grid content-start gap-6"><SidebarList items={trending} /><DbAdSlot position="SIDEBAR" /></div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  if (!hasDatabaseUrl()) return [];
  try {
    const ok = await checkDbConnection();
    if (!ok) return [];
    const categories = await getCategories();
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}
