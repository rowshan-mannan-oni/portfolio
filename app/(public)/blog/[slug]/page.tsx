import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug, getPublishedPosts, getSiteSettings } from "@/lib/data/public";
import { Markdown } from "@/components/markdown";
import { MetaList } from "@/components/public/section";
import { ShareButton } from "@/components/public/copy-button";
import { JsonLd } from "@/components/public/json-ld";
import { formatLongDate } from "@/lib/format/date";
import { storageUrl } from "@/lib/storage";
import { SITE_URL } from "@/lib/env";
import { readingTime } from "@/lib/utils";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found", robots: { index: false } };

  const title = post.seo_title ?? post.title;
  const description = post.seo_description ?? post.excerpt ?? undefined;
  const cover = storageUrl(post.cover_image);
  const images = cover ? [{ url: cover, alt: post.cover_image_alt ?? post.title }] : undefined;

  return {
    title,
    description,
    keywords: post.tags.length > 0 ? post.tags : undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      tags: post.tags,
      ...(images ? { images } : {}),
    },
    twitter: { card: cover ? "summary_large_image" : "summary", title, description },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()]);
  if (!post) notFound();

  const cover = storageUrl(post.cover_image);
  const minutes = readingTime(post.content);
  const url = `${SITE_URL}/blog/${post.slug}`;

  return (
    <article className="container-page section-y">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt ?? undefined,
          datePublished: post.published_at ?? undefined,
          dateModified: post.updated_at,
          image: cover ?? undefined,
          keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
          author: { "@type": "Person", name: settings.full_name, url: SITE_URL },
          mainEntityOfPage: url,
        }}
      />
      <div className="mx-auto max-w-[var(--container-prose)]">
        <Link href="/blog" className="action-link mb-10">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All writing
        </Link>

        <header>
          {post.tags.length > 0 ? (
            <ul className="mb-4 flex flex-wrap gap-x-3 gap-y-1" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag} className="eyebrow">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          <h1 className="text-[2.1rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl">{post.title}</h1>
          {post.excerpt ? <p className="mt-5 text-lg leading-relaxed text-muted">{post.excerpt}</p> : null}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-border py-3.5">
            <MetaList
              className="meta"
              items={[
                settings.full_name,
                post.published_at ? (
                  <time dateTime={post.published_at}>{formatLongDate(post.published_at)}</time>
                ) : null,
                `${minutes} min read`,
              ]}
            />
            <ShareButton url={url} title={post.title} />
          </div>
        </header>
      </div>

      {cover ? (
        <figure className="mx-auto mt-10 max-w-4xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-surface-muted">
            <Image
              src={cover}
              alt={post.cover_image_alt ?? ""}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 960px) 896px, 100vw"
              className="object-cover"
            />
          </div>
        </figure>
      ) : null}

      <div className="mx-auto mt-10 max-w-[var(--container-prose)]">
        <Markdown>{post.content}</Markdown>
        <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <Link href="/blog" className="action-link">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All writing
          </Link>
          <ShareButton url={url} title={post.title} />
        </footer>
      </div>
    </article>
  );
}
