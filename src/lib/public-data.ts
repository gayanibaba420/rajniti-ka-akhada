import { getSiteConfig } from "./articles";
import { siteConfig as fallbackConfig } from "./data";
import { checkDbConnection } from "./db";

export async function getPublicSiteConfig() {
  try {
    const ok = await checkDbConnection();
    if (!ok) return fallbackConfig;
    return await getSiteConfig();
  } catch {
    return fallbackConfig;
  }
}

export async function safeDbQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const ok = await checkDbConnection();
    if (!ok) return fallback;
    return await fn();
  } catch (error) {
    console.error("[db-query]", error);
    return fallback;
  }
}
