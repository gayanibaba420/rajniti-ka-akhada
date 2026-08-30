import type { Metadata } from "next";
import { Mukta, Noto_Sans_Devanagari } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { BackToTopButton } from "@/components/back-to-top";
import { getBreakingNewsItems, getCategories } from "@/lib/articles";
import { BRAND_ASSETS, getSiteUrl, type SiteConfig } from "@/lib/data";
import { getPublicSiteConfig, safeDbQuery } from "@/lib/public-data";
import "./globals.css";

const noto = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], display: "swap", variable: "--font-noto", weight: ["400", "500", "600", "700", "800", "900"] });
const mukta = Mukta({ subsets: ["devanagari", "latin"], display: "swap", variable: "--font-mukta", weight: ["700", "800"] });

function absoluteAssetUrl(baseUrl: string, path: string): string {
  if (!path) return `${baseUrl}${BRAND_ASSETS.logo}`;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig();
  const ogImage = absoluteAssetUrl(config.url, BRAND_ASSETS.logo);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: `${config.name} | ${config.tagline}`, template: `%s | ${config.name}` },
    description: config.description,
    keywords: config.seoKeywords ? config.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "hi_IN",
      siteName: config.name,
      title: config.name,
      description: config.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: config.name,
      description: config.description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
    icons: {
      icon: [{ url: BRAND_ASSETS.favicon }, { url: BRAND_ASSETS.logo, type: "image/jpeg", sizes: "1024x683" }],
      apple: BRAND_ASSETS.appleTouchIcon,
    },
    ...(config.gscVerification ? { verification: { google: config.gscVerification } } : {}),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [config, categories, breaking] = await Promise.all([
    getPublicSiteConfig(),
    safeDbQuery(() => getCategories(), []),
    safeDbQuery(() => getBreakingNewsItems(), []),
  ]);
  const site: SiteConfig = config;
  const organization = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: site.name,
    url: site.url,
    logo: absoluteAssetUrl(site.url, BRAND_ASSETS.logo),
  };

  return (
    <html lang="hi" suppressHydrationWarning>
      <body className={`${noto.variable} ${mukta.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
        <SiteHeader site={site} categories={categories} breakingItems={breaking} />
        <main id="main-content">{children}</main>
        <SiteFooter site={site} />
        <BackToTopButton />
      </body>
    </html>
  );
}
