export type { PublicArticle as Article, PublicCategory as Category } from "./types";

const PRODUCTION_SITE_URL = "https://www.rajnitikaakhada.com";
const LOCAL_SITE_URL = "http://localhost:43127";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;
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
};

const SITE_DEFAULTS: Omit<SiteConfig, "url"> = {
  name: "राजनीति का अखाड़ा",
  tagline: "हिंदी समाचार • निष्पक्ष विचार",
  description: "हरियाणा, हिसार, राजनीति और देश-दुनिया की विश्वसनीय हिंदी खबरें।",
  email: "sampark@rajnitikaakhada.in",
  phone: "",
  logo: "",
  favicon: "/news-assembly.svg",
  headerNotice: "",
  seoKeywords: "",
  gscVerification: "",
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
    logo: settings.site_logo?.trim() || SITE_DEFAULTS.logo,
    favicon: settings.site_favicon?.trim() || SITE_DEFAULTS.favicon,
    headerNotice: settings.header_notice?.trim() || SITE_DEFAULTS.headerNotice,
    seoKeywords: settings.seo_keywords?.trim() || SITE_DEFAULTS.seoKeywords,
    gscVerification: settings.gsc_verification?.trim() || SITE_DEFAULTS.gscVerification,
  };
}

export const siteConfig: SiteConfig = buildSiteConfig();
