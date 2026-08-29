import type { Metadata } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { siteConfig } from "@/lib/data";
import "./globals.css";

const noto = Noto_Sans_Devanagari({ subsets: ["devanagari", "latin"], display: "swap", variable: "--font-noto", weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "hi_IN", siteName: siteConfig.name, title: siteConfig.name, description: siteConfig.description, images: ["/news-assembly.svg"] },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description, images: ["/news-assembly.svg"] },
  robots: { index: true, follow: true },
  icons: { icon: "/news-assembly.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organization = { "@context": "https://schema.org", "@type": "NewsMediaOrganization", name: siteConfig.name, url: siteConfig.url, logo: `${siteConfig.url}/news-assembly.svg` };
  return (
    <html lang="hi" suppressHydrationWarning>
      <body className={noto.variable}>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
