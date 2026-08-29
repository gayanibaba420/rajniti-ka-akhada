import { unstable_noStore as noStore } from "next/cache";
import { getSiteConfig } from "./articles";
import { siteConfig as fallbackConfig } from "./data";

export async function getPublicSiteConfig() {
  noStore();
  try {
    return await getSiteConfig();
  } catch (error) {
    console.error("[site-config]", error);
    return fallbackConfig;
  }
}

export async function safeDbQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[db-query]", error);
    return fallback;
  }
}
