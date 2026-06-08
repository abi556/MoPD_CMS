import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  // Private/authenticated areas must never be indexed by search engines or
  // crawled by AI bots. Public informational and complaint-intake pages are open.
  const disallow = [
    "/api/",
    "/en/dashboard",
    "/am/dashboard",
    "/en/auth",
    "/am/auth",
    "/en/forbidden",
    "/am/forbidden",
    "/*?*token=",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
