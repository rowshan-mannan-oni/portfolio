import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

// Admin pages are always rendered per request with the visitor's session.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "!bg-surface !text-fg !border-border !rounded-xl !shadow-lg",
            description: "!text-muted",
          },
        }}
      />
    </>
  );
}
