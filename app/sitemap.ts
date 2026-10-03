import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data/public";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

// The admin area is deliberately absent.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    ...(posts.length > 0
      ? [{ url: `${SITE_URL}/blog`, changeFrequency: "weekly" as const, priority: 0.7 }]
      : []),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.published_at ?? undefined,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
