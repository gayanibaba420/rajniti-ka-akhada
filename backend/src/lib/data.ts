const PRODUCTION_SITE_URL = "https://www.rajnitikaakhada.com";
const LOCAL_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const configured = process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;
}

export const siteConfig = {
  name: "राजनीति का अखाड़ा",
  tagline: "हिंदी समाचार • निष्पक्ष विचार",
  description: "हरियाणा, हिसार, राजनीति और देश-दुनिया की विश्वसनीय हिंदी खबरें।",
  get url() {
    return getSiteUrl();
  },
  email: "sampark@rajnitikaakhada.in",
};
