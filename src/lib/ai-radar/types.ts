export const DEFAULT_AI_RADAR_CATEGORIES = [
  "Hisar",
  "Haryana",
  "Delhi/NCR",
  "India",
  "Politics",
  "Crime",
  "Sports",
  "Business",
  "Technology",
  "Trending",
] as const;

export type AiRadarNewsSource = "gnews" | "rss";

export interface AiRadarSettings {
  provider: "gemini";
  newsSource: AiRadarNewsSource;
  maxArticlesPerFetch: number;
  autoFetchIntervalMinutes: number;
  minAiConfidence: number;
  duplicateDetection: boolean;
  requireManualApproval: boolean;
  categories: string[];
  enabled: boolean;
  geminiApiKey?: string;
}

export const DEFAULT_AI_RADAR_SETTINGS: AiRadarSettings = {
  provider: "gemini",
  newsSource: "gnews",
  maxArticlesPerFetch: 10,
  autoFetchIntervalMinutes: 45,
  minAiConfidence: 0.6,
  duplicateDetection: true,
  requireManualApproval: true,
  categories: [...DEFAULT_AI_RADAR_CATEGORIES],
  enabled: true,
};

export interface FetchedNewsItem {
  title: string;
  description: string;
  content: string;
  url: string;
  sourceName: string;
  publishedAt: Date | null;
}

export interface GeminiDraftResult {
  seoTitle: string;
  headline: string;
  article: string;
  summary: string;
  metaDescription: string;
  slug: string;
  category: string;
  tags: string[];
  imagePrompt: string;
  confidence: number;
  needsVerification: boolean;
  verificationNotes?: string;
}

export interface AiRadarStats {
  fetched: number;
  draft: number;
  needsVerification: number;
  approved: number;
  published: number;
  rejected: number;
  total: number;
}

export const AI_RADAR_STATUS_LABELS: Record<string, string> = {
  FETCHED: "नई खबर",
  DRAFT: "AI ड्राफ्ट",
  NEEDS_VERIFICATION: "सत्यापन आवश्यक",
  APPROVED: "स्वीकृत",
  PUBLISHED: "प्रकाशित",
  REJECTED: "अस्वीकृत",
};

export const AI_RADAR_VERIFICATION_LABELS: Record<string, string> = {
  VERIFIED: "सत्यापित",
  NEEDS_VERIFICATION: "सत्यापन आवश्यक",
  UNCERTAIN: "अनिश्चित",
};
