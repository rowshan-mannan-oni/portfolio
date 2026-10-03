import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

/*
 * The admin path is not listed here on purpose: robots.txt is public, and
 * listing it would advertise the URL. Admin pages instead send
 * `noindex` via both a meta tag and the X-Robots-Tag header.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
