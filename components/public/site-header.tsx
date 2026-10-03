"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Download, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/site";

type Props = {
  name: string;
  monogram: string;
  items: NavItem[];
  cvUrl: string | null;
};

export function SiteHeader({ name, monogram, items, cvUrl }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently in view (homepage only).
  useEffect(() => {
    if (!isHome) return;
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [isHome, items]);

  const currentId = isHome ? active : pathname.startsWith("/blog") ? "blog" : null;

  const openMenu = () => {
    dialogRef.current?.showModal();
    setMenuOpen(true);
  };
  const closeMenu = () => dialogRef.current?.close();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-border bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75"
          : "border-transparent bg-bg",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5"
          aria-label={`${name} — home`}
        >
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-serif text-[0.95rem] font-semibold text-primary-fg"
          >
            {monogram}
          </span>
          <span className="hidden truncate text-[0.95rem] font-medium tracking-tight sm:inline">
            {name}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={currentId === item.id ? "true" : undefined}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm transition-colors",
                    currentId === item.id ? "text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-3 -bottom-px h-px bg-primary transition-opacity duration-300",
                      currentId === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {cvUrl ? (
            <a href={cvUrl} className="btn btn-secondary btn-sm hidden sm:inline-flex" download>
              <Download className="size-3.5" aria-hidden="true" />
              CV
            </a>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost btn-icon lg:hidden"
            onClick={openMenu}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <dialog
        id="mobile-menu"
        ref={dialogRef}
        aria-label="Site menu"
        onClose={() => setMenuOpen(false)}
        onClick={(e) => {
          // Clicking the backdrop closes the menu.
          if (e.target === dialogRef.current) closeMenu();
        }}
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(22rem,100vw)] max-w-none bg-surface p-0 text-fg shadow-2xl open:animate-[slide-in_220ms_ease-out]"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <span className="text-sm font-medium">{name}</span>
            <button type="button" className="btn btn-ghost btn-icon" onClick={closeMenu} aria-label="Close menu">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={currentId === item.id ? "true" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-3 text-[1.05rem] transition-colors",
                      currentId === item.id ? "bg-soft text-soft-fg" : "hover:bg-surface-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-2 border-t border-border p-4">
            {cvUrl ? (
              <a href={cvUrl} className="btn btn-primary w-full" download>
                <Download className="size-4" aria-hidden="true" />
                Download CV
              </a>
            ) : null}
            <ThemeToggle withLabel className="w-full" />
          </div>
        </div>
      </dialog>
    </header>
  );
}
