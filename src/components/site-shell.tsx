"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Camera as Instagram, Menu, Moon, Search, Share2 as Facebook, Sun, Video as Youtube, X } from "lucide-react";
import { BRAND_ASSETS, type SiteConfig } from "@/lib/data";
import type { PublicCategory } from "@/lib/types";
import { BreakingTickerClient } from "./breaking-ticker";
import { NewsletterSignup } from "./newsletter-signup";

function SiteBrandLogo() {
  return (
    <Image
      src={BRAND_ASSETS.logo}
      alt={BRAND_ASSETS.logoAlt}
      width={BRAND_ASSETS.logoWidth}
      height={BRAND_ASSETS.logoHeight}
      className="h-9 w-auto shrink-0 object-contain object-left sm:h-12 md:h-14"
      priority
      unoptimized
    />
  );
}

function SiteBrandTitle({ name }: { name: string }) {
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    const last = parts.pop()!;
    const lead = parts.join(" ");
    return (
      <div className="text-xl font-black tracking-tight sm:text-3xl">
        {lead} <span className="brand">{last}</span>
      </div>
    );
  }
  return <div className="text-xl font-black tracking-tight sm:text-3xl">{name}</div>;
}

export function ThemeButton() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const enabled = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
    requestAnimationFrame(() => setDark(enabled));
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
  const [results, setResults] = useState<Array<{ slug: string; title: string; categoryName: string }>>([]);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      fetch(`/api/public/search?q=${encodeURIComponent(query.trim())}&limit=6`)
        .then((r) => r.json())
        .then((data) => setResults(data.items ?? []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

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
          {results.map((a) => <Link onClick={close} key={a.slug} href={`/article/${a.slug}`} className="block rounded-xl border-b p-3 hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: "var(--line)" }}><span className="eyebrow">{a.categoryName}</span><h3 className="mt-1 font-bold">{a.title}</h3></Link>)}
          {query.length > 1 && results.length > 0 && <Link onClick={close} className="btn btn-primary mt-4 w-full" href={`/search?q=${encodeURIComponent(query)}`}>सभी परिणाम देखें</Link>}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader({
  site,
  categories,
  breakingItems,
}: {
  site: SiteConfig;
  categories: PublicCategory[];
  breakingItems: Array<{ title: string; slug: string | null; link: string }>;
}) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const dateStr = useMemo(
    () => new Intl.DateTimeFormat("hi-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()),
    []
  );
  if (pathname.startsWith("/admin")) return null;

  const topBarRight = site.headerNotice || "ई-पेपर   |   लाइव टीवी";

  return (
    <>
      <a href="#main-content" className="fixed left-3 top-[-100px] z-[200] bg-white p-3 text-black focus:top-3">मुख्य सामग्री पर जाएं</a>
      <div className="bg-[#181818] py-2 text-xs text-white"><div className="container-main flex justify-between gap-4"><span>{dateStr}</span><span className="hidden truncate sm:inline">{topBarRight}</span></div></div>
      <header className="surface sticky top-0 z-50 border-x-0 shadow-sm">
        <div className="container-main flex min-h-20 items-center justify-between gap-3 py-3">
          <button onClick={() => setMenu(!menu)} className="btn btn-ghost !p-2.5 lg:hidden" aria-label="मेन्यू खोलें"><Menu size={20} /></button>
          <Link href="/" className="group min-w-0 leading-none" aria-label={`${site.name} होम`}>
            <SiteBrandLogo />
          </Link>
          <div className="flex items-center gap-2"><button className="btn btn-ghost !p-2.5" onClick={() => setSearch(true)} aria-label="खोजें"><Search size={19} /></button><ThemeButton /></div>
        </div>
        <nav aria-label="मुख्य नेविगेशन" className="hidden border-t lg:block" style={{ borderColor: "var(--line)" }}><div className="container-main flex items-center justify-between gap-5 overflow-auto py-3 text-sm font-extrabold"><Link href="/">होम</Link>{categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="whitespace-nowrap hover:text-[var(--brand)]">{c.name}</Link>)}<Link href="/blog" className="whitespace-nowrap hover:text-[var(--brand)]">ब्लॉग</Link><Link href="/admin" className="brand">CMS</Link></div></nav>
        {menu && <nav aria-label="मोबाइल नेविगेशन" className="absolute inset-x-0 top-full surface border-x-0 p-4 shadow-xl lg:hidden"><div className="grid grid-cols-2 gap-2">{categories.map((c) => <Link onClick={() => setMenu(false)} key={c.slug} href={`/category/${c.slug}`} className="rounded-lg p-3 font-bold hover:bg-black/5">{c.name}</Link>)}<Link onClick={() => setMenu(false)} href="/blog" className="rounded-lg p-3 font-bold hover:bg-black/5">ब्लॉग</Link><Link onClick={() => setMenu(false)} href="/admin" className="rounded-lg p-3 font-bold brand">एडमिन CMS</Link></div></nav>}
      </header>
      <BreakingTickerClient initialItems={breakingItems} />
      <SearchOverlay open={search} close={() => setSearch(false)} />
    </>
  );
}

export function SiteFooter({ site }: { site: SiteConfig }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const contactBits = [site.email, site.phone].filter(Boolean);

  return (
    <footer className="mt-16 bg-[#151515] text-white">
      <div className="container-main grid gap-10 py-12 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <h2 className="text-2xl font-black"><SiteBrandTitle name={site.name} /></h2>
          <p className="mt-3 max-w-lg leading-7 text-neutral-400">{site.tagline}। {site.description}</p>
          {contactBits.length > 0 && (
            <p className="mt-3 text-sm text-neutral-400">
              {site.email && <>ईमेल: <a href={`mailto:${site.email}`} className="text-[#e8a526] hover:underline">{site.email}</a></>}
              {site.email && site.phone && " • "}
              {site.phone && <>फ़ोन: <a href={`tel:${site.phone.replace(/\s+/g, "")}`} className="text-[#e8a526] hover:underline">{site.phone}</a></>}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            {site.socialFacebook && (
              <a href={site.socialFacebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook />
              </a>
            )}
            {site.socialInstagram && (
              <a href={site.socialInstagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram />
              </a>
            )}
            {site.socialYoutube && (
              <a href={site.socialYoutube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube />
              </a>
            )}
          </div>
        </div>
        <div><h3 className="font-bold text-[#e8a526]">उपयोगी लिंक</h3><div className="mt-4 grid gap-2 text-sm text-neutral-300"><Link href="/about">हमारे बारे में</Link><Link href="/blog">ब्लॉग</Link><Link href="/contact">संपर्क</Link><Link href="/privacy">गोपनीयता नीति</Link><Link href="/rss.xml">RSS फ़ीड</Link></div></div>
        <NewsletterSignup />
      </div>
      <div className="border-t border-neutral-800 py-5 text-center text-xs text-neutral-500">© {new Date().getFullYear()} {site.name} • सर्वाधिकार सुरक्षित</div>
    </footer>
  );
}

export function AdSlot({ label = "विज्ञापन" }: { label?: string }) {
  return <div className="surface grid min-h-24 place-items-center rounded-xl border-dashed p-5 text-center"><div><span className="muted text-[10px] tracking-[.25em]">ADVERTISEMENT</span><p className="mt-1 text-sm font-bold">{label}</p></div></div>;
}
