import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

/*
 * Safe Markdown renderer shared by the blog, long descriptions and the admin
 * preview. Raw HTML in Markdown is NOT rendered (no rehype-raw), the HAST is
 * sanitized, and react-markdown's URL transform drops javascript:/data: links.
 */

const components: Components = {
  a: ({ href, children, ...props }) => {
    const external = typeof href === "string" && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        {...props}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  table: ({ children, ...props }) => (
    <div className="table-wrap">
      <table {...props}>{children}</table>
    </div>
  ),
  img: ({ src, alt, title }) =>
    typeof src === "string" && src ? (
      // Markdown images have unknown dimensions, so next/image is not used here.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt ?? ""} title={title} loading="lazy" decoding="async" />
    ) : null,
  // Demote h1 so an article keeps a single page-level heading.
  h1: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
};

export function Markdown({
  children,
  className,
  size = "base",
}: {
  children: string;
  className?: string;
  size?: "base" | "sm";
}) {
  return (
    <div className={cn("prose", size === "sm" && "prose-sm", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeSlug, [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
