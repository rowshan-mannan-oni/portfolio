"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type GalleryImage = { id: string; url: string; alt: string; caption: string | null };

/** Thumbnail strip with an accessible <dialog> lightbox. */
export function ProjectGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;
  const current = images[index];

  const open = (i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  };
  const step = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label={`${title} screenshots`}>
        {images.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              onClick={() => open(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface-muted"
              aria-label={`Open screenshot ${i + 1} of ${images.length}${img.alt ? `: ${img.alt}` : ""}`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="(min-width: 640px) 140px, 30vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={`${title} screenshots`}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        className="m-auto w-[min(64rem,calc(100vw-2rem))] max-w-none rounded-2xl bg-surface p-0 text-fg shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="meta">
            {index + 1} / {images.length}
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close gallery"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <figure>
          <div className="relative aspect-video bg-surface-muted">
            <Image
              key={current.id}
              src={current.url}
              alt={current.alt}
              fill
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-contain"
            />
          </div>
          {current.caption ? (
            <figcaption className="px-5 py-3 text-sm text-muted">{current.caption}</figcaption>
          ) : null}
        </figure>
        {images.length > 1 ? (
          <div className="flex justify-between border-t border-border px-3 py-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => step(-1)}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => step(1)}>
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
