export type { PublicArticle as Article, PublicCategory as Category } from "./types";

const PRODUCTION_SITE_URL = "https://www.rajnitikaakhada.com";
const LOCAL_SITE_URL = "http://localhost:43127";

function isVercelDeploymentHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app");
}

/** Prefer canonical production domain over Vercel preview URLs in SEO/canonical output. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    const normalized = configured.replace(/\/+$/, "");
    if (process.env.NODE_ENV === "production") {
      try {
        if (isVercelDeploymentHost(new URL(normalized).hostname)) {
          return PRODUCTION_SITE_URL;
        }
      } catch {
        return PRODUCTION_SITE_URL;
      }
    }
    return normalized;
  }
  return process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;
}

export function normalizeExternalUrl(url: string | undefined | null): string {
  const trimmed = url?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

/** Bundled brand assets — always used; not overridden by admin settings. */
export const BRAND_ASSETS = {
  logo: "/brand-logo.jpg",
  favicon: "/favicon.ico",
  appleTouchIcon: "/apple-touch-icon.png",
  logoAlt: "राजनीति का अखाड़ा",
  logoWidth: 1024,
  logoHeight: 683,
} as const;

/** Absolute URL for Open Graph / schema — uses featured image when set, otherwise site brand logo. */
export function resolveOgImageUrl(image: string | null | undefined, siteUrl: string): string {
  if (image) return image.startsWith("http") ? image : `${siteUrl}${image}`;
  return `${siteUrl.replace(/\/+$/, "")}${BRAND_ASSETS.logo}`;
}

export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  email: string;
  phone: string;
  logo: string;
  favicon: string;
  headerNotice: string;
  seoKeywords: string;
  gscVerification: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
};

const SITE_DEFAULTS: Omit<SiteConfig, "url"> = {
  name: "राजनीति का अखाड़ा",
  tagline: "हिंदी समाचार • निष्पक्ष विचार",
  description: "हरियाणा, हिसार, राजनीति और देश-दुनिया की विश्वसनीय हिंदी खबरें।",
  email: "sampark@rajnitikaakhada.in",
  phone: "",
  logo: BRAND_ASSETS.logo,
  favicon: BRAND_ASSETS.favicon,
  headerNotice: "",
  seoKeywords: "",
  gscVerification: "",
  socialFacebook: "",
  socialInstagram: "",
  socialYoutube: "",
};

/** Build public site config from DB settings with static fallbacks. */
export function buildSiteConfig(settings: Record<string, string> = {}): SiteConfig {
  return {
    name: settings.site_name?.trim() || SITE_DEFAULTS.name,
    tagline: settings.site_tagline?.trim() || SITE_DEFAULTS.tagline,
    description: settings.site_description?.trim() || SITE_DEFAULTS.description,
    url: getSiteUrl(),
    email: settings.contact_email?.trim() || SITE_DEFAULTS.email,
    phone: settings.contact_phone?.trim() || SITE_DEFAULTS.phone,
    logo: BRAND_ASSETS.logo,
    favicon: BRAND_ASSETS.favicon,
    headerNotice: settings.header_notice?.trim() || SITE_DEFAULTS.headerNotice,
    seoKeywords: settings.seo_keywords?.trim() || SITE_DEFAULTS.seoKeywords,
    gscVerification: settings.gsc_verification?.trim() || SITE_DEFAULTS.gscVerification,
    socialFacebook: normalizeExternalUrl(settings.social_facebook) || SITE_DEFAULTS.socialFacebook,
    socialInstagram: normalizeExternalUrl(settings.social_instagram) || SITE_DEFAULTS.socialInstagram,
    socialYoutube: normalizeExternalUrl(settings.social_youtube) || SITE_DEFAULTS.socialYoutube,
  };
}

export const siteConfig: SiteConfig = buildSiteConfig();
