import type { Metadata } from "next";
import { VisitorMetrics } from "@/components/admin/visitor-metrics";
import Link from "next/link";
import { ArrowRight, BookOpen, FileUp, FolderKanban, Newspaper, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/row-actions";
import { adminDb } from "@/lib/admin/page-data";
import { adminPath } from "@/lib/admin/routes";
import { formatDateTime } from "@/lib/format/date";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const db = await adminDb();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  const [projects, publishedProjects, publications, posts, drafts, unread, settings, recent] = await Promise.all([
    count(db.from("projects").select("id", { count: "exact", head: true })),
    count(db.from("projects").select("id", { count: "exact", head: true }).eq("visible", true)),
    count(db.from("publications").select("id", { count: "exact", head: true })),
    count(db.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published")),
    count(db.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft")),
    count(db.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "unread")),
    db.from("site_settings").select("cv_path, cv_visible, profile_image_path, full_name").eq("id", true).maybeSingle(),
    db
      .from("contact_messages")
      .select("id, name, subject, status, created_at")
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const metrics = [
    { label: "Projects", value: projects, href: adminPath("projects") },
    { label: "Visible projects", value: publishedProjects, href: adminPath("projects") },
    { label: "Publications", value: publications, href: adminPath("publications") },
    { label: "Published posts", value: posts, href: adminPath("blog") },
    { label: "Draft posts", value: drafts, href: `${adminPath("blog")}?status=draft` },
    { label: "Unread messages", value: unread, href: adminPath("messages"), highlight: unread > 0 },
  ];

  const site = settings.data;
  const checklist = [
    { done: Boolean(site?.profile_image_path), label: "Upload a profile photo", href: adminPath("profile") },
    { done: Boolean(site?.cv_path), label: "Upload your CV", href: adminPath("cv") },
    { done: posts > 0, label: "Publish a first blog post", href: adminPath("blog", "new") },
  ].filter((c) => !c.done);

  const shortcuts = [
    { href: adminPath("projects", "new"), label: "New project", icon: FolderKanban },
    { href: adminPath("blog", "new"), label: "New blog post", icon: Newspaper },
    { href: adminPath("publications", "new"), label: "Add publication", icon: BookOpen },
    { href: adminPath("cv"), label: "Upload CV", icon: FileUp },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back${site?.full_name ? `, ${site.full_name.split(" ")[0]}` : ""}`}
        description="Everything on the public site is managed from here. Changes go live immediately."
      />

      <section aria-label="Metrics" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => (
          <Link key={m.label} href={m.href} className="card p-4 transition-colors hover:border-border-strong">
            <p className={`font-mono text-2xl font-medium ${m.highlight ? "text-primary" : ""}`}>{m.value}</p>
            <p className="mt-1 text-xs text-muted">{m.label}</p>
          </Link>
        ))}
      </section>

      <VisitorMetrics />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card p-5">
          <h2 className="text-sm font-semibold">Quick actions</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {shortcuts.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:text-primary">
                  <Icon className="size-4 text-primary" />
                  {label}
                  <Plus className="ml-auto size-3.5 text-subtle" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {checklist.length > 0 ? (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="meta">Suggested next steps</h3>
              <ul className="mt-2 space-y-1.5">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <Link href={c.href} className="link text-sm">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent messages</h2>
            <Link href={adminPath("messages")} className="action-link text-primary">
              All messages <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          {recent.data && recent.data.length > 0 ? (
            <ul className="mt-3 divide-y divide-border">
              {recent.data.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.subject}</p>
                    <p className="truncate text-xs text-muted">
                      {m.name} · {formatDateTime(m.created_at)}
                    </p>
                  </div>
                  {m.status === "unread" ? <StatusPill tone="primary">Unread</StatusPill> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No messages yet. Submissions from the contact form appear here.</p>
          )}
        </section>
      </div>
    </>
  );
}
