import type { Metadata } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { getBreakingNewsItems, getCategories } from "@/lib/articles";
import { getSiteUrl } from "@/lib/data";
import { getPublicSiteConfig, safeDbQuery } from "@/lib/public-data";
import "./globals.css";

const noto = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], display: "swap", variable: "--font-noto", weight: ["400", "500", "600", "700", "800", "900"] });

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig();
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: `${config.name} | ${config.tagline}`, template: `%s | ${config.name}` },
    description: config.description,
    alternates: { canonical: "/" },
    openGraph: { type: "website", locale: "hi_IN", siteName: config.name, title: config.name, description: config.description, images: ["/news-assembly.svg"] },
    twitter: { card: "summary_large_image", title: config.name, description: config.description, images: ["/news-assembly.svg"] },
    robots: { index: true, follow: true },
    icons: { icon: "/news-assembly.svg" },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [config, categories, breaking] = await Promise.all([
    getPublicSiteConfig(),
    safeDbQuery(() => getCategories(), []),
    safeDbQuery(() => getBreakingNewsItems(), []),
  ]);
  const site = config;
  const organization = { "@context": "https://schema.org", "@type": "NewsMediaOrganization", name: site.name, url: site.url, logo: `${site.url}/news-assembly.svg` };

  return (
    <html lang="hi" suppressHydrationWarning>
      <body className={noto.variable}>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
        <SiteHeader categories={categories} breakingItems={breaking} />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
