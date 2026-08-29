import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/data";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/search"] }], sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl };
}
