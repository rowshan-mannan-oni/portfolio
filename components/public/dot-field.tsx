"use client";

import { useEffect, useRef } from "react";

/** Adapted from React Bits Dot Field (DavidHDev/react-bits).
 * https://reactbits.dev/backgrounds/dot-field
 * Canvas waves and cursor bulges, scoped to a project placeholder.
 */
export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return;
    const ctx = context;
    const surface = canvas;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: -9999, y: -9999 };
    let dots: { ax: number; ay: number; x: number; y: number }[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = false;
    let color = "";
    let phase = 0;
    let lastTime = 0;

    function paint(animated: boolean) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      for (const dot of dots) {
        const dx = dot.ax - pointer.x;
        const dy = dot.ay - pointer.y;
        const distance = Math.hypot(dx, dy);
        const push = animated && distance < 130 ? Math.pow(1 - distance / 130, 2) * 22 : 0;
        const targetX = dot.ax + (distance > 0 ? dx / distance * push : 0);
        const targetY = dot.ay + (distance > 0 ? dy / distance * push : 0);
        dot.x += (targetX - dot.x) * 0.15;
        dot.y += (targetY - dot.y) * 0.15;
        const x = animated ? dot.x + Math.cos(dot.ay * 0.03 + phase * 0.7) * 1.5 : dot.ax;
        const y = animated ? dot.y + Math.sin(dot.ax * 0.03 + phase) * 3 : dot.ay;
        ctx.moveTo(x + 1, y);
        ctx.arc(x, y, 1, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    function tick(time: number) {
      frame = 0;
      if (!visible || document.hidden || motion.matches) return;
      phase += Math.min(lastTime ? time - lastTime : 16, 50) * 0.0007;
      lastTime = time;
      paint(true);
      frame = requestAnimationFrame(tick);
    }

    function syncAnimation() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
      else paint(false);
    }

    function resize() {
      const bounds = host!.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * scale);
      surface.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      color = getComputedStyle(host!).getPropertyValue("--primary").trim();
      dots = [];
      for (let y = 10; y < height; y += 18) {
        for (let x = 10; x < width; x += 18) dots.push({ ax: x, ay: y, x, y });
      }
      paint(false);
      surface.style.opacity = "1";
      host!.classList.remove("texture-dots");
    }

    function move(event: PointerEvent) {
      if (event.pointerType === "touch" || motion.matches) return;
      const bounds = host!.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
    }
    function leave() { pointer.x = -9999; pointer.y = -9999; }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    const themeObserver = new MutationObserver(resize);
    resize();
    resizeObserver.observe(host);
    intersectionObserver.observe(host);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    motion.addEventListener("change", syncAnimation);
    document.addEventListener("visibilitychange", syncAnimation);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      motion.removeEventListener("change", syncAnimation);
      document.removeEventListener("visibilitychange", syncAnimation);
      host.classList.add("texture-dots");
      surface.style.opacity = "0";
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full opacity-0" />;
}
