import { checkDbConnection } from "./db";
import { getSiteConfig } from "./articles";

export async function getPublicSiteConfig() {
  try {
    const ok = await checkDbConnection();
    if (!ok) return null;
    return await getSiteConfig();
  } catch {
    return null;
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
