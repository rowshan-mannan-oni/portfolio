import type { Metadata } from "next";
import Link from "next/link";
import { Archive, Inbox, Mail, MailOpen, Reply, Search, Trash2 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/row-actions";
import { ActionButton, ConfirmAction } from "@/components/admin/confirm-action";
import { deleteMessage, setMessageStatus } from "@/lib/admin/actions/messages";
import { adminDb } from "@/lib/admin/page-data";
import { formatDateTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/types/database";

export const metadata: Metadata = { title: "Messages" };

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

export default async function MessagesPage({ searchParams }: Props) {
  const { status = "inbox", q = "" } = await searchParams;
  const db = await adminDb();

  let query = db.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  if (status === "inbox") query = query.neq("status", "archived");
  else if (status === "unread" || status === "read" || status === "archived") query = query.eq("status", status as ContactStatus);
  const search = q.trim().slice(0, 100).replace(/[%_,()]/g, " ");
  if (search) query = query.or(`subject.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data: messages, error } = await query;
  if (error) throw error;

  const tabs = [
    { key: "inbox", label: "Inbox" },
    { key: "unread", label: "Unread" },
    { key: "read", label: "Read" },
    { key: "archived", label: "Archived" },
  ];
  const iconBtn = "btn btn-ghost btn-icon size-8 min-h-8";

  return (
    <>
      <PageHeader title="Messages" description="Submissions from the contact form. Only administrators can read them." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter" className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`?status=${t.key}`}
              aria-current={status === t.key ? "page" : undefined}
              className={cn("rounded-lg px-3 py-1.5 text-sm", status === t.key ? "bg-soft font-medium text-soft-fg" : "text-muted hover:bg-surface")}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form role="search" className="relative sm:w-64">
          <input type="hidden" name="status" value={status} />
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <label htmlFor="msg-search" className="sr-only">
            Search messages
          </label>
          <input id="msg-search" name="q" defaultValue={q} placeholder="Search…" className="input pl-9" />
        </form>
      </div>

      {messages.length === 0 ? (
        <EmptyState title="No messages here." body="New contact-form submissions will appear in the inbox." />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id}>
              <details className={cn("card group overflow-hidden", m.status === "unread" && "border-primary/40")}>
                <summary className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 text-primary">
                    {m.status === "unread" ? <Mail className="size-4" aria-hidden="true" /> : m.status === "archived" ? <Archive className="size-4 text-subtle" aria-hidden="true" /> : <MailOpen className="size-4 text-subtle" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cn("truncate", m.status === "unread" ? "font-semibold" : "font-medium")}>{m.subject}</span>
                      {m.status === "unread" ? <StatusPill tone="primary">Unread</StatusPill> : null}
                      {m.status === "archived" ? <StatusPill tone="muted">Archived</StatusPill> : null}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {m.name}
                      {m.organization ? ` · ${m.organization}` : ""} · {formatDateTime(m.created_at)}
                    </span>
                  </span>
                </summary>
                <div className="border-t border-border p-4">
                  <p className="mb-3 text-sm">
                    <span className="text-muted">From </span>
                    {m.name} &lt;
                    <a className="link" href={`mailto:${m.email}`}>
                      {m.email}
                    </a>
                    &gt;
                  </p>
                  <p className="whitespace-pre-wrap break-words rounded-lg bg-surface-muted p-4 text-[0.95rem] leading-relaxed">{m.message}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-1">
                    <a
                      href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Reply className="size-3.5" aria-hidden="true" />
                      Reply by email
                    </a>
                    <span className="flex-1" />
                    {m.status === "unread" ? (
                      <ActionButton action={setMessageStatus.bind(null, m.id, "read")} label="Mark as read" className={iconBtn}>
                        <MailOpen className="size-4" aria-hidden="true" />
                      </ActionButton>
                    ) : (
                      <ActionButton action={setMessageStatus.bind(null, m.id, "unread")} label="Mark as unread" className={iconBtn}>
                        <Mail className="size-4" aria-hidden="true" />
                      </ActionButton>
                    )}
                    {m.status === "archived" ? (
                      <ActionButton action={setMessageStatus.bind(null, m.id, "read")} label="Move to inbox" className={iconBtn}>
                        <Inbox className="size-4" aria-hidden="true" />
                      </ActionButton>
                    ) : (
                      <ActionButton action={setMessageStatus.bind(null, m.id, "archived")} label="Archive" className={iconBtn}>
                        <Archive className="size-4" aria-hidden="true" />
                      </ActionButton>
                    )}
                    <ConfirmAction
                      action={deleteMessage.bind(null, m.id)}
                      label="Delete message"
                      className={cn(iconBtn, "hover:text-danger")}
                      confirmTitle="Delete this message?"
                      confirmBody="The message is permanently removed."
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </ConfirmAction>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
