import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublishedPosts, getSections, getSiteSettings } from "@/lib/data/public";
import { PostCard } from "@/components/public/post-card";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, sections] = await Promise.all([getSiteSettings(), getSections()]);
  const blog = sections.find((s) => s.key === "blog");
  const title = blog?.heading ?? "Writing";
  const description =
    blog?.subheading ?? `Articles by ${settings.full_name} on software engineering and research.`;
  return {
    title,
    description,
    alternates: { canonical: "/blog" },
    openGraph: { title, description, url: "/blog" },
  };
}

export default async function BlogIndexPage() {
  const [posts, sections] = await Promise.all([getPublishedPosts(), getSections()]);
  const blog = sections.find((s) => s.key === "blog");
  const featured = posts.filter((p) => p.featured).slice(0, 1);
  const rest = posts.filter((p) => !featured.includes(p));

  return (
    <div className="container-page section-y">
      <Link href="/" className="action-link mb-10">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Home
      </Link>
      <header className="mb-12 max-w-2xl" data-reveal>
        <p className="eyebrow">Blog</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{blog?.heading ?? "Writing"}</h1>
        {blog?.subheading ? <p className="mt-4 text-lg text-muted">{blog.subheading}</p> : null}
      </header>

      {posts.length === 0 ? (
        <div className="card max-w-xl p-8" data-reveal>
          <p className="font-medium">No articles yet.</p>
          <p className="mt-1.5 text-muted">New writing will appear here once it is published.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {featured.length > 0 ? (
            <div data-reveal className="max-w-3xl">
              <PostCard post={featured[0]} />
            </div>
          ) : null}
          {rest.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <li key={post.id} data-reveal>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
