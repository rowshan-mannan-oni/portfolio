import { AdminShell } from "@/components/admin/admin-shell";
import { signOut } from "@/lib/admin/actions/auth";
import { requireAdminPage } from "@/lib/auth";

/*
 * Authorization gate for every dashboard page. This runs on the server for
 * each request; the proxy redirect is only a convenience. Data access is
 * additionally protected by RLS, and every mutation re-checks requireAdmin().
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const state = await requireAdminPage();

  if (state.status === "unconfigured") {
    return (
      <Notice title="Supabase is not configured">
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to your
        environment, then restart. See README.md.
      </Notice>
    );
  }

  if (state.status === "forbidden") {
    return (
      <Notice title="Access denied">
        You are signed in{state.email ? ` as ${state.email}` : ""}, but this account is not an administrator. Add its
        user ID to the <code>admin_users</code> table (see DEPLOYMENT.md), then sign in again.
        <form action={signOut} className="mt-6">
          <button type="submit" className="btn btn-secondary btn-sm">
            Sign out
          </button>
        </form>
      </Notice>
    );
  }

  if (state.status !== "admin") return null;

  const { count } = await state.supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "unread");

  return (
    <AdminShell email={state.email} unread={count ?? 0}>
      {children}
    </AdminShell>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-alt px-4">
      <div className="card max-w-md p-7">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="mt-2 text-sm leading-relaxed text-muted [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.8em]">
          {children}
        </div>
      </div>
    </main>
  );
}
