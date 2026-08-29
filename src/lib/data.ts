export type { PublicArticle as Article, PublicCategory as Category } from "./types";

export const siteConfig = {
  name: "राजनीति का अखाड़ा",
  tagline: "हिंदी समाचार • निष्पक्ष विचार",
  description: "हरियाणा, हिसार, राजनीति और देश-दुनिया की विश्वसनीय हिंदी खबरें।",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:43127",
  email: "sampark@rajnitikaakhada.in",
};
