export type { PublicArticle as Article, PublicCategory as Category } from "./types";

const PRODUCTION_SITE_URL = "https://www.rajnitikaakhada.com";
const LOCAL_SITE_URL = "http://localhost:43127";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;
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
    socialFacebook: settings.social_facebook?.trim() || SITE_DEFAULTS.socialFacebook,
    socialInstagram: settings.social_instagram?.trim() || SITE_DEFAULTS.socialInstagram,
    socialYoutube: settings.social_youtube?.trim() || SITE_DEFAULTS.socialYoutube,
  };
}

export const siteConfig: SiteConfig = buildSiteConfig();
