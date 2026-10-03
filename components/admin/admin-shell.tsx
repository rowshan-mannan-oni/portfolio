"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  Award,
  Briefcase,
  ExternalLink,
  FileUp,
  FlaskConical,
  FolderKanban,
  GraduationCap,
  Images,
  Inbox,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Newspaper,
  PanelsTopLeft,
  Share2,
  UserRound,
  Wrench,
  X,
  BookOpen,
} from "lucide-react";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { signOut } from "@/lib/admin/actions/auth";
import { ADMIN_BASE } from "@/lib/admin/routes";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number };

function navGroups(unread: number): Array<{ title: string; links: NavLink[] }> {
  const p = (s: string) => `${ADMIN_BASE}${s}`;
  return [
    { title: "", links: [{ href: ADMIN_BASE, label: "Dashboard", icon: LayoutDashboard }] },
    {
      title: "Site",
      links: [
        { href: p("/profile"), label: "Profile & SEO", icon: UserRound },
        { href: p("/sections"), label: "Sections", icon: PanelsTopLeft },
        { href: p("/cv"), label: "CV", icon: FileUp },
        { href: p("/social"), label: "Contact & social", icon: Share2 },
      ],
    },
    {
      title: "Content",
      links: [
        { href: p("/experience"), label: "Experience", icon: Briefcase },
        { href: p("/research"), label: "Research", icon: FlaskConical },
        { href: p("/publications"), label: "Publications", icon: BookOpen },
        { href: p("/projects"), label: "Projects", icon: FolderKanban },
        { href: p("/skills"), label: "Skills", icon: Wrench },
        { href: p("/education"), label: "Education", icon: GraduationCap },
        { href: p("/awards"), label: "Awards", icon: Award },
      ],
    },
    {
      title: "Publishing",
      links: [
        { href: p("/blog"), label: "Blog", icon: Newspaper },
        { href: p("/media"), label: "Media library", icon: Images },
        { href: p("/messages"), label: "Messages", icon: Inbox, badge: unread },
      ],
    },
  ];
}

function NavList({ unread, onNavigate }: { unread: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === ADMIN_BASE ? pathname === href : pathname.startsWith(href));

  return (
    <nav aria-label="Dashboard" className="space-y-6">
      {navGroups(unread).map((group, gi) => (
        <div key={gi}>
          {group.title ? <p className="meta mb-2 px-3">{group.title}</p> : null}
          <ul className="space-y-0.5">
            {group.links.map(({ href, label, icon: Icon, badge }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive(href) ? "bg-soft font-medium text-soft-fg" : "text-muted hover:bg-surface-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge ? (
                    <span className="rounded-full bg-primary px-1.5 text-[0.7rem] font-semibold text-primary-fg">
                      {badge}
                      <span className="sr-only"> unread</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href={ADMIN_BASE} className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-primary font-serif text-sm font-semibold text-primary-fg"
      >
        RO
      </span>
      <span className="text-sm font-semibold tracking-tight">Portfolio CMS</span>
    </Link>
  );
}

export function AdminShell({ email, unread, children }: { email: string | null; unread: number; children: React.ReactNode }) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const close = () => drawerRef.current?.close();

  return (
    <div className="min-h-dvh bg-bg-alt/60 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <NavList unread={unread} />
        </div>
        <div className="border-t border-border p-3">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm w-full justify-start">
            <Layers className="size-4" aria-hidden="true" />
            View site
            <ExternalLink className="ml-auto size-3.5" aria-hidden="true" />
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => drawerRef.current?.showModal()}
              aria-label="Open navigation"
              aria-controls="admin-drawer"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <Brand />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <details className="group relative">
              <summary className="btn btn-ghost btn-sm" aria-label="Account menu">
                <UserRound className="size-4" aria-hidden="true" />
                <span className="hidden max-w-[12rem] truncate sm:inline">{email ?? "Account"}</span>
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
                {email ? <p className="truncate px-3 py-2 text-xs text-subtle">{email}</p> : null}
                <form action={signOut}>
                  <button type="submit" className="btn btn-ghost btn-sm w-full justify-start">
                    <LogOut className="size-4" aria-hidden="true" />
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      <dialog
        id="admin-drawer"
        ref={drawerRef}
        aria-label="Dashboard navigation"
        onClick={(e) => {
          if (e.target === drawerRef.current) close();
        }}
        className="m-0 h-dvh max-h-dvh w-[min(18rem,85vw)] max-w-none bg-surface p-0 text-fg shadow-2xl"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Brand />
          <button type="button" className="btn btn-ghost btn-icon" onClick={close} aria-label="Close navigation">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-3 py-5">
          <NavList unread={unread} onNavigate={close} />
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mt-6 w-full justify-start">
            <Layers className="size-4" aria-hidden="true" />
            View site
          </a>
        </div>
      </dialog>
    </div>
  );
}
