export {
  getPublicSiteConfig,
  getPublicSiteConfig as getSiteConfig,
  getCategories,
  getCategoryBySlug,
  getPublishedArticles,
  getArticleBySlug,
  getRelatedArticles,
  getTrendingArticles,
  searchArticles,
  getBreakingNewsItems,
  getActiveAds,
  getPublishedArticleSlugs,
  getCategoryArticleCount,
  checkApiHealth,
  safeApiQuery,
  getApiBaseUrl,
  getClientApiBaseUrl,
  clientApiFetch,
} from "./api-client";

export type { PublicArticle, PublicCategory, ContentBlock } from "./types";
