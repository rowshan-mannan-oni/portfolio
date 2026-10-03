"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  label: string;
  copiedLabel?: string;
  className?: string;
  icon?: "copy" | "share";
};

/** Copies text to the clipboard with an accessible status update. */
export function CopyButton({ text, label, copiedLabel = "Copied", className, icon = "copy" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context); fall back to a prompt.
      window.prompt("Copy to clipboard:", text);
    }
  }

  const Icon = copied ? Check : icon === "share" ? Share2 : Copy;
  return (
    <button type="button" onClick={copy} className={cn("action-link", className)}>
      <Icon className="size-4" aria-hidden="true" />
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}

/** Uses the native share sheet when available, otherwise copies the link. */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button type="button" onClick={share} className="btn btn-secondary btn-sm">
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Share2 className="size-3.5" aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
