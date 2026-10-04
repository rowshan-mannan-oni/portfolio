"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/** React Bits Spotlight Card adapted to theme tokens and article semantics.
 * Reference: https://reactbits.dev/components/spotlight-card
 */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  function moveSpotlight(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch" || !ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    ref.current.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
  }

  return (
    <article ref={ref} onPointerMove={moveSpotlight} className={cn("spotlight-card", className)}>
      <div aria-hidden="true" className="spotlight-card-glow" />
      {children}
    </article>
  );
}
