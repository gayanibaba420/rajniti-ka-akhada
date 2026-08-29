import { getPublicSiteConfig as fetchSiteConfig, checkApiHealth } from "./api-client";
import { siteConfig as fallbackConfig } from "./data";

export async function getPublicSiteConfig() {
  try {
    const ok = await checkApiHealth();
    if (!ok) return fallbackConfig;
    return await fetchSiteConfig();
  } catch {
    return fallbackConfig;
  }
}

export async function safeDbQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  const { safeApiQuery } = await import("./api-client");
  return safeApiQuery(fn, fallback);
}
