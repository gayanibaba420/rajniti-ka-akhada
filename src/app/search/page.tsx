import Link from "next/link";
import { Search } from "lucide-react";
import { StoryCard } from "@/components/story-card";
import { getCategories, searchArticles } from "@/lib/articles";
import { checkDbConnection } from "@/lib/db";

export const metadata = { title: "खोजें", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const dbOk = await checkDbConnection();
  const { q = "", page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const clean = q.trim().slice(0, 80);

  if (!dbOk) {
    return <div className="container-main py-20 text-center"><h1 className="text-2xl font-black">खोज सेवा अस्थायी रूप से अनुपलब्ध</h1></div>;
  }

  const { items: matches, total } = clean ? await searchArticles(clean, page, 6) : { items: [], total: 0 };
  const categories = await getCategories();
  const totalPages = Math.ceil(total / 6);

  return (
    <div className="container-main min-h-[55vh] py-9">
      <h1 className="section-title">समाचार खोजें</h1>
      <form className="surface flex max-w-3xl gap-2 rounded-xl p-3" action="/search"><label className="sr-only" htmlFor="q">खोज शब्द</label><input id="q" name="q" defaultValue={clean} className="input !border-0" placeholder="हिसार, किसान, राजनीति..." maxLength={80} /><button className="btn btn-primary"><Search size={18} /> खोजें</button></form>
      {clean && <p className="muted my-7">“<strong className="text-[var(--foreground)]">{clean}</strong>” के लिए {total.toLocaleString("hi-IN")} परिणाम</p>}
      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{matches.map((a) => <StoryCard article={a} categories={categories} key={a.slug} />)}</div>
      {clean && matches.length === 0 && <div className="surface mt-7 rounded-xl p-12 text-center"><Search className="muted mx-auto" size={42} /><h2 className="mt-4 text-xl font-black">कोई खबर नहीं मिली</h2></div>}
      {totalPages > 1 && <nav className="mt-8 flex gap-2" aria-label="खोज पेज">{Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => <Link className={`btn ${n === page ? "btn-primary" : "btn-ghost"}`} href={`/search?q=${encodeURIComponent(clean)}&page=${n}`} key={n}>{n}</Link>)}</nav>}
    </div>
  );
}
