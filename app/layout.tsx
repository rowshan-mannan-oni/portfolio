import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbfa" },
    { media: "(prefers-color-scheme: dark)", color: "#071716" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // The theme script adds classes before hydration.
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${newsreader.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
