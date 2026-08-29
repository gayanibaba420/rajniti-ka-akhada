import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Play, Radio } from "lucide-react";
import { AdSlot } from "@/components/site-shell";
import { SidebarList, StoryCard } from "@/components/story-card";
import { articles } from "@/lib/data";

export default function Home() {
  const lead = articles[0];
  const hisar = articles.filter((a) => a.category === "hisar");
  const haryana = articles.filter((a) => a.category === "haryana");
  return (
    <>
      <section className="container-main py-5"><AdSlot label="लीडरबोर्ड • 970 × 90" /></section>
      <section className="container-main grid gap-5 pb-10 lg:grid-cols-[1.65fr_.85fr]">
        <article className="story-link surface relative min-h-[420px] overflow-hidden rounded-2xl sm:min-h-[540px]">
          <Image className="story-image object-cover" fill src={lead.image} alt={lead.imageAlt} priority sizes="(max-width: 1024px) 100vw, 70vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-9">
            <div className="mb-3 flex flex-wrap gap-2"><span className="rounded bg-[#a71d2a] px-3 py-1 text-sm font-black">बड़ी खबर</span><span className="flex items-center gap-1 rounded bg-white/15 px-3 py-1 text-sm backdrop-blur"><MapPin size={14}/> {lead.location}</span></div>
            <h1 className="max-w-4xl text-2xl font-black leading-tight sm:text-4xl lg:text-5xl"><Link href={`/article/${lead.slug}`}>{lead.title}</Link></h1>
            <p className="mt-3 hidden max-w-3xl text-lg leading-8 text-neutral-200 sm:block">{lead.excerpt}</p>
          </div>
        </article>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {articles.slice(1, 3).map((article) => <StoryCard article={article} key={article.slug} />)}
        </div>
      </section>

      <section className="border-y bg-[#171717] py-8 text-white">
        <div className="container-main"><div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-black"><Radio className="text-[#ef4050]" /> लाइव अपडेट</h2><span className="animate-pulse rounded-full bg-red-600 px-3 py-1 text-xs font-bold">LIVE</span></div><div className="grid gap-4 md:grid-cols-3">{articles.slice(2,5).map((a, i) => <Link href={`/article/${a.slug}`} key={a.slug} className="flex gap-3 border-l border-neutral-700 pl-4"><span className="text-sm font-bold text-[#e8a526]">{12-i}:2{i}</span><span className="text-sm font-bold leading-6">{a.title}</span></Link>)}</div></div>
      </section>

      <section className="container-main py-12">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><span className="eyebrow">आपके शहर की हर खबर</span><h2 className="section-title mt-2 !mb-0">हिसार स्पेशल</h2></div><Link className="btn btn-ghost" href="/category/hisar">सभी खबरें <ArrowLeft size={16}/></Link></div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_.72fr]"><StoryCard article={hisar[0]} priority /><div className="grid gap-5">{hisar.slice(1).map((a) => <StoryCard key={a.slug} article={a} horizontal />)}</div><div className="surface rounded-xl p-5"><h3 className="font-black">हिसार उप-श्रेणियां</h3><div className="mt-4 grid grid-cols-2 gap-2">{["शहर", "आदमपुर", "हांसी", "नारनौंद", "मंडी भाव", "क्राइम", "शिक्षा", "मौसम"].map((name) => <Link href={`/search?q=${name}`} className="rounded-lg border p-3 text-center text-sm font-bold hover:border-[var(--brand)]" style={{borderColor:"var(--line)"}} key={name}>{name}</Link>)}</div></div></div>
      </section>

      <section className="bg-[var(--surface)] py-12"><div className="container-main grid gap-8 lg:grid-cols-[1fr_330px]"><div><h2 className="section-title">हरियाणा की हलचल</h2><div className="grid gap-6 sm:grid-cols-2">{[...haryana, ...articles.filter(a=>a.location==="हरियाणा")].slice(0,4).map((a)=><StoryCard key={a.slug} article={a}/>)}</div></div><div><AdSlot label="स्क्वायर विज्ञापन • 300 × 250"/><div className="mt-6"><SidebarList items={articles.slice().sort((a,b)=>b.views-a.views).slice(0,5)}/></div></div></div></section>

      {[
        { title: "सियासी अखाड़ा", slug: "politics" },
        { title: "देश-दुनिया", slug: "india", include: "world" },
        { title: "खेल, कारोबार और करियर", slug: "sports", include: "business" },
        { title: "मनोरंजन और टेक", slug: "entertainment", include: "technology" },
      ].map((section) => {
        const items = articles.filter((a) => a.category === section.slug || a.category === section.include);
        return <section className="container-main py-10" key={section.title}><div className="flex items-center justify-between"><h2 className="section-title">{section.title}</h2><Link href={`/category/${section.slug}`} className="text-sm font-black brand">और देखें →</Link></div><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[...items, ...articles].slice(0,3).map((a, i)=><StoryCard key={`${section.slug}-${a.slug}-${i}`} article={a}/>)}</div></section>;
      })}

      <section className="container-main pb-5"><div className="overflow-hidden rounded-2xl bg-[#a71d2a] p-7 text-white sm:flex sm:items-center sm:justify-between"><div><span className="text-sm font-bold text-[#ffd274]">वीडियो न्यूज़</span><h2 className="mt-2 text-2xl font-black">हरियाणा की बड़ी खबरें, 5 मिनट में</h2><p className="mt-2 text-white/80">हर शाम 7 बजे हमारा विशेष बुलेटिन देखें।</p></div><button className="btn mt-5 bg-white text-[#a71d2a] sm:mt-0"><Play fill="currentColor"/> अभी देखें</button></div></section>
    </>
  );
}
