import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/activity/", "/orders/", "/portfolio/", "/settings/", "/watchlist/"]
    },
    ...(appConfig.siteUrl ? { sitemap: `${appConfig.siteUrl}/sitemap.xml` } : {})
  };
}
