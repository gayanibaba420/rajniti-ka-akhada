import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/site-shell";
import { SidebarList, StoryCard } from "@/components/story-card";
import { articles, categories, getByCategory, getCategory, siteConfig } from "@/lib/data";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export function generateStaticParams() { return categories.map((category) => ({ slug: category.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return { title: category.name, description: category.description, alternates: { canonical: `/category/${slug}` }, openGraph: { title: `${category.name} समाचार`, description: category.description, url: `${siteConfig.url}/category/${slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageValue } = await searchParams;
  const category = getCategory(slug);
  if (!category) notFound();
  const own = getByCategory(slug);
  const pool = own.length >= 5 ? own : [...own, ...articles.filter((item) => !own.includes(item))];
  const current = Math.max(1, Number(pageValue) || 1);
  const items = pool.slice((current - 1) * 6, current * 6);
  const featured = own[0] ?? items[0];
  return (
    <div className="container-main py-8">
      <nav className="muted mb-5 text-sm" aria-label="ब्रेडक्रंब"><Link href="/">होम</Link> / {category.name}</nav>
      <header className="mb-8 border-l-8 border-[var(--brand)] pl-5"><p className="eyebrow">ताज़ा अपडेट</p><h1 className="mt-1 text-4xl font-black">{category.name} समाचार</h1><p className="muted mt-2">{category.description}</p></header>
      {featured && <section className="surface mb-8 grid overflow-hidden rounded-2xl md:grid-cols-2"><div className="p-5 sm:p-8"><span className="eyebrow">विशेष खबर</span><h2 className="mt-3 text-2xl font-black leading-snug sm:text-3xl"><Link href={`/article/${featured.slug}`}>{featured.title}</Link></h2><p className="muted mt-4 leading-7">{featured.excerpt}</p><Link className="btn btn-primary mt-5" href={`/article/${featured.slug}`}>पूरी खबर पढ़ें</Link></div><StoryCard article={featured} priority /></section>}
      <AdSlot label="कैटेगरी बैनर • 728 × 90" />
      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_330px]">
        <section><h2 className="section-title">नवीनतम खबरें</h2><div className="grid gap-7 sm:grid-cols-2">{items.map((item)=><StoryCard article={item} key={item.slug}/>)}</div>{items.length === 0 && <div className="surface rounded-xl p-12 text-center"><h2 className="text-xl font-black">इस पेज पर अभी कोई खबर नहीं</h2><p className="muted mt-2">पिछले पेज पर लौटकर दूसरी खबरें देखें।</p></div>}<nav className="mt-9 flex justify-center gap-2" aria-label="पेजिनेशन">{[1,2,3].map((page)=><Link aria-current={page===current?"page":undefined} className={`btn ${page===current?"btn-primary":"btn-ghost"}`} href={`/category/${slug}?page=${page}`} key={page}>{page}</Link>)}</nav></section>
        <div className="grid content-start gap-6"><SidebarList items={articles.slice(3,8)} /><AdSlot label="साइडबार विज्ञापन • 300 × 250" /></div>
      </div>
    </div>
  );
}
