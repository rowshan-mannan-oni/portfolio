import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8">
      {back ? (
        <Link href={back.href} className="action-link mb-3">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div aria-hidden="true" className="mb-4 h-px w-10 bg-primary/50" />
      <p className="font-medium">{title}</p>
      {body ? <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
