import Image from "next/image";
import Link from "next/link";
import type { BlogPostSummary } from "@/lib/data/public";
import { MetaList } from "@/components/public/section";
import { formatLongDate } from "@/lib/format/date";
import { storageUrl } from "@/lib/storage";

export function PostCard({ post, showCover = true }: { post: BlogPostSummary; showCover?: boolean }) {
  const cover = showCover ? storageUrl(post.cover_image) : null;
  return (
    <article className="group card relative flex h-full flex-col overflow-hidden transition-colors hover:border-border-strong">
      {cover ? (
        <div className="relative aspect-[16/9] border-b border-border bg-surface-muted">
          <Image
            src={cover}
            alt={post.cover_image_alt ?? ""}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <MetaList
          className="meta"
          items={[
            post.published_at ? (
              <time dateTime={post.published_at}>{formatLongDate(post.published_at)}</time>
            ) : null,
            `${post.reading_minutes} min read`,
          ]}
        />
        <h3 className="mt-2.5 text-[1.1rem] font-semibold leading-snug tracking-tight">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-primary">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? (
          <p className="mt-2.5 line-clamp-3 text-[0.93rem] leading-relaxed text-muted">{post.excerpt}</p>
        ) : null}
        {post.tags.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-4" aria-label="Tags">
            {post.tags.slice(0, 4).map((tag) => (
              <li key={tag} className="meta">
                #{tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
