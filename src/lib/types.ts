import type { ArticleStatus, AdPosition, Role } from "@prisma/client";

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; url: string; alt?: string; caption?: string }
  | { type: "embed"; url: string; provider?: string };

export interface PublicArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryName: string;
  location?: string;
  image: string;
  imageAlt: string;
  author: string;
  publishedAt: string;
  readTime: string;
  breaking?: boolean;
  featured?: boolean;
  trending?: boolean;
  views: number;
  content: string[];
  contentBlocks?: ContentBlock[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  highlight?: string;
}

export interface PublicCategory {
  slug: string;
  name: string;
  description: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "सुपर एडमिन",
  EDITOR: "संपादक",
  AUTHOR: "लेखक",
};

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "ड्राफ्ट",
  REVIEW: "समीक्षा",
  PUBLISHED: "प्रकाशित",
  SCHEDULED: "निर्धारित",
  ARCHIVED: "संग्रहीत",
};

export const AD_POSITION_LABELS: Record<AdPosition, string> = {
  HEADER: "हेडर",
  HOMEPAGE: "होमपेज",
  ARTICLE_TOP: "लेख शीर्ष",
  ARTICLE_MIDDLE: "लेख मध्य",
  ARTICLE_BOTTOM: "लेख नीचे",
  SIDEBAR: "साइडबार",
};

export function blocksToPlainText(blocks: ContentBlock[]): string[] {
  return blocks.map((block) => {
    switch (block.type) {
      case "paragraph":
      case "heading":
      case "quote":
        return block.text;
      case "list":
        return block.items.join(" ");
      case "image":
        return block.alt ?? block.caption ?? "";
      case "embed":
        return block.url;
      default:
        return "";
    }
  }).filter(Boolean);
}

export function plainTextToBlocks(paragraphs: string[]): ContentBlock[] {
  return paragraphs.map((text) => ({ type: "paragraph" as const, text }));
}

export function computeReadTimeMinutes(blocks: ContentBlock[]): number {
  const text = blocksToPlainText(blocks).join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatReadTime(minutes: number): string {
  return `${minutes} मिनट`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || `post-${Date.now()}`;
}

export function stripUnsafeMarkup(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/<[^>]+>/g, "");
}

export function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}
