"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, Moon, Search, Sun, X, Facebook, Instagram, Youtube } from "lucide-react";
import { articles, categories } from "@/lib/data";

export function ThemeButton() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const enabled = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  return <button className="btn btn-ghost !p-2.5" onClick={toggle} aria-label={dark ? "लाइट मोड" : "डार्क मोड"}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>;
}

export function SearchOverlay({ open, close }: { open: boolean; close: () => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => query.trim().length < 2 ? [] : articles.filter((a) => `${a.title} ${a.excerpt} ${a.location}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6), [query]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="खबर खोजें" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="surface mx-auto mt-[8vh] max-h-[80vh] max-w-2xl overflow-auto rounded-2xl p-4 shadow-2xl sm:p-6">
        <div className="flex items-center gap-2"><Search className="brand" /><input autoFocus className="input !border-0 !bg-transparent text-lg" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="खबर, शहर या विषय खोजें..." aria-label="खोज शब्द" /><button className="btn btn-ghost !p-2" onClick={close} aria-label="खोज बंद करें"><X /></button></div>
        <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--line)" }}>
          {!query && <p className="muted py-5 text-center">उदाहरण: हिसार, किसान, खेल</p>}
          {query.length > 1 && results.length === 0 && <p className="muted py-8 text-center">“{query}” के लिए कोई खबर नहीं मिली।</p>}
          {results.map((a) => <Link onClick={close} key={a.slug} href={`/article/${a.slug}`} className="block rounded-xl border-b p-3 hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: "var(--line)" }}><span className="eyebrow">{categories.find((c) => c.slug === a.category)?.name}</span><h3 className="mt-1 font-bold">{a.title}</h3></Link>)}
          {query.length > 1 && results.length > 0 && <Link onClick={close} className="btn btn-primary mt-4 w-full" href={`/search?q=${encodeURIComponent(query)}`}>सभी परिणाम देखें</Link>}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  if (pathname.startsWith("/admin")) return null;
  return (
    <>
      <a href="#main-content" className="fixed left-3 top-[-100px] z-[200] bg-white p-3 text-black focus:top-3">मुख्य सामग्री पर जाएं</a>
      <div className="bg-[#181818] py-2 text-xs text-white"><div className="container-main flex justify-between"><span>शनिवार, 29 अगस्त 2026</span><span className="hidden sm:inline">ई-पेपर &nbsp; | &nbsp; लाइव टीवी</span></div></div>
      <header className="surface sticky top-0 z-50 border-x-0 shadow-sm">
        <div className="container-main flex min-h-20 items-center justify-between gap-3 py-3">
          <button onClick={() => setMenu(!menu)} className="btn btn-ghost !p-2.5 lg:hidden" aria-label="मेन्यू खोलें"><Menu size={20} /></button>
          <Link href="/" className="group leading-none" aria-label="राजनीति का अखाड़ा होम">
            <div className="flex items-center gap-2"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#a71d2a] text-2xl font-black text-white ring-2 ring-[#e8a526] ring-offset-2">रा</span><div><div className="text-xl font-black tracking-tight sm:text-3xl">राजनीति का <span className="brand">अखाड़ा</span></div><div className="muted mt-1 text-[10px] font-bold tracking-[.15em] sm:text-xs">हिंदी समाचार • निष्पक्ष विचार</div></div></div>
          </Link>
          <div className="flex items-center gap-2"><button className="btn btn-ghost !p-2.5" onClick={() => setSearch(true)} aria-label="खोजें"><Search size={19} /></button><ThemeButton /></div>
        </div>
        <nav aria-label="मुख्य नेविगेशन" className="hidden border-t lg:block" style={{ borderColor: "var(--line)" }}><div className="container-main flex items-center justify-between gap-5 overflow-auto py-3 text-sm font-extrabold"><Link href="/">होम</Link>{categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="whitespace-nowrap hover:text-[var(--brand)]">{c.name}</Link>)}<Link href="/admin" className="brand">CMS</Link></div></nav>
        {menu && <nav aria-label="मोबाइल नेविगेशन" className="absolute inset-x-0 top-full surface border-x-0 p-4 shadow-xl lg:hidden"><div className="grid grid-cols-2 gap-2">{categories.map((c) => <Link onClick={() => setMenu(false)} key={c.slug} href={`/category/${c.slug}`} className="rounded-lg p-3 font-bold hover:bg-black/5">{c.name}</Link>)}<Link onClick={() => setMenu(false)} href="/admin" className="rounded-lg p-3 font-bold brand">एडमिन CMS</Link></div></nav>}
      </header>
      <BreakingTicker />
      <SearchOverlay open={search} close={() => setSearch(false)} />
    </>
  );
}

export function BreakingTicker() {
  const headlines = articles.filter((a) => a.breaking).map((a) => ({ title: a.title, slug: a.slug }));
  const items = [...headlines, ...headlines];
  return <div className="ticker flex overflow-hidden bg-[#a71d2a] text-white"><div className="z-10 shrink-0 bg-[#74111b] px-4 py-2.5 text-sm font-black">ब्रेकिंग</div><div className="overflow-hidden"><div className="ticker-track">{items.map((item, index) => <Link className="whitespace-nowrap px-8 py-2.5 text-sm font-bold" href={`/article/${item.slug}`} key={`${item.slug}-${index}`}>● &nbsp; {item.title}</Link>)}</div></div></div>;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <footer className="mt-16 bg-[#151515] text-white"><div className="container-main grid gap-10 py-12 md:grid-cols-4"><div className="md:col-span-2"><h2 className="text-2xl font-black">राजनीति का <span className="text-[#ef4050]">अखाड़ा</span></h2><p className="mt-3 max-w-lg leading-7 text-neutral-400">हिंदी समाचार • निष्पक्ष विचार। हरियाणा और हिसार की स्थानीय आवाज़ से लेकर देश-दुनिया तक, तथ्य पहले।</p><div className="mt-5 flex gap-3"><a href="https://facebook.com" aria-label="Facebook"><Facebook /></a><a href="https://instagram.com" aria-label="Instagram"><Instagram /></a><a href="https://youtube.com" aria-label="YouTube"><Youtube /></a></div></div><div><h3 className="font-bold text-[#e8a526]">उपयोगी लिंक</h3><div className="mt-4 grid gap-2 text-sm text-neutral-300"><Link href="/about">हमारे बारे में</Link><Link href="/contact">संपर्क</Link><Link href="/privacy">गोपनीयता नीति</Link><Link href="/rss.xml">RSS फ़ीड</Link></div></div><div><h3 className="font-bold text-[#e8a526]">स्थानीय कवरेज</h3><div className="mt-4 grid gap-2 text-sm text-neutral-300"><Link href="/category/hisar">हिसार शहर</Link><Link href="/category/haryana">हरियाणा</Link><Link href="/category/business">मंडी भाव</Link><Link href="/category/education">शिक्षा व रोजगार</Link></div></div></div><div className="border-t border-neutral-800 py-5 text-center text-xs text-neutral-500">© 2026 राजनीति का अखाड़ा • डेमो समाचार सामग्री • सर्वाधिकार सुरक्षित</div></footer>;
}

export function AdSlot({ label = "विज्ञापन" }: { label?: string }) {
  return <div className="surface grid min-h-24 place-items-center rounded-xl border-dashed p-5 text-center"><div><span className="muted text-[10px] tracking-[.25em]">ADVERTISEMENT</span><p className="mt-1 text-sm font-bold">{label}</p></div></div>;
}
