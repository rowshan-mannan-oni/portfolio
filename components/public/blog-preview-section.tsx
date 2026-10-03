import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogPostSummary } from "@/lib/data/public";
import { PostCard } from "@/components/public/post-card";
import { Section } from "@/components/public/section";

type Props = {
  index: number;
  heading: string;
  subheading: string | null;
  posts: BlogPostSummary[];
};

export function BlogPreviewSection({ index, heading, subheading, posts }: Props) {
  return (
    <Section
      id="blog"
      index={index}
      heading={heading}
      subheading={subheading}
      aside={
        <Link href="/blog" className="action-link text-primary">
          All writing
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      }
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id} data-reveal>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
