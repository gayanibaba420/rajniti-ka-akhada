import type { ArticleStatus, AdPosition, Role } from "@prisma/client";

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; url: string; alt?: string; caption?: string }
  | { type: "embed"; url: string; provider?: string };

export interface PublicAuthor {
  slug: string;
  name: string;
  bio?: string;
  avatar?: string;
}

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
  authorSlug: string;
  publishedAt: string;
  updatedAt?: string;
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
  videoUrl?: string;
}

export interface PublicCategory {
  slug: string;
  name: string;
  description: string;
}

export interface PublicBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  author: string;
  authorSlug: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  views: number;
  content: string[];
  contentBlocks?: ContentBlock[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export const BLOG_STATUS_LABELS: Record<"DRAFT" | "PUBLISHED", string> = {
  DRAFT: "ड्राफ्ट",
  PUBLISHED: "प्रकाशित",
};

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

const IMAGE_LINE = /^!\[([^\]|]*)(?:\|([^\]]*))?\]\(([^)]+)\)$/;

/** Serialize content blocks to the admin editor textarea format. */
export function blocksToEditorText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `${"#".repeat(block.level)} ${block.text}`;
        case "quote":
          return `> ${block.text}`;
        case "image": {
          const alt = block.alt ?? "";
          const caption = block.caption ?? "";
          return caption ? `![${alt}|${caption}](${block.url})` : `![${alt}](${block.url})`;
        }
        case "list":
          return block.items.map((item) => (block.ordered ? `1. ${item}` : `- ${item}`)).join("\n");
        case "embed":
          return `[embed](${block.url})`;
        default:
          return block.text;
      }
    })
    .join("\n\n");
}

/** Parse admin editor textarea text into content blocks (supports ## headings, > quotes, ![alt](url) images). */
export function editorTextToBlocks(text: string): ContentBlock[] {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((line) => {
      const imageMatch = line.match(IMAGE_LINE);
      if (imageMatch) {
        return {
          type: "image" as const,
          url: imageMatch[3],
          alt: imageMatch[1] || undefined,
          caption: imageMatch[2] || undefined,
        };
      }
      if (line.startsWith("### ")) return { type: "heading", level: 3 as const, text: line.slice(4) };
      if (line.startsWith("## ")) return { type: "heading", level: 2 as const, text: line.slice(3) };
      if (line.startsWith("> ")) return { type: "quote", text: line.slice(2) };
      return { type: "paragraph", text: line };
    });
}

export function computeReadTimeMinutes(blocks: ContentBlock[]): number {
  const text = blocksToPlainText(blocks).join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatReadTime(minutes: number): string {
  return `${minutes} मिनट पढ़ें`;
}

export function formatHindiDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("hi-IN", options ?? { dateStyle: "medium" }).format(new Date(iso));
}

export function formatHindiDateTime(iso: string): string {
  return new Intl.DateTimeFormat("hi-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
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
