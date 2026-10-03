"use client";

import { useId, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/admin/action-result";
import { cn } from "@/lib/utils";

type ActionButtonProps = {
  action: () => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  label?: string;
  title?: string;
  disabled?: boolean;
};

/** Runs a server action on click, with pending state and a toast. */
export function ActionButton({ action, children, className, label, title, disabled }: ActionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      disabled={disabled || pending}
      className={className}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            toast.success(result.message);
            if (result.redirectTo) router.push(result.redirectTo);
            else router.refresh();
          } else {
            toast.error(result.message);
          }
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : children}
    </button>
  );
}

type ConfirmProps = ActionButtonProps & {
  confirmTitle: string;
  confirmBody?: string;
  confirmLabel?: string;
};

/** Destructive action guarded by an accessible confirmation dialog. */
export function ConfirmAction({
  action,
  children,
  className,
  label,
  title,
  confirmTitle,
  confirmBody,
  confirmLabel = "Delete",
  disabled,
}: ConfirmProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const result = await action();
      dialogRef.current?.close();
      if (result.ok) {
        toast.success(result.message);
        if (result.redirectTo) router.push(result.redirectTo);
        else router.refresh();
      } else {
        toast.error(result.message);
      }
    });

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={title ?? label}
        className={className}
        disabled={disabled || pending}
        onClick={() => dialogRef.current?.showModal()}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-0 text-fg shadow-2xl"
        onClick={(e) => {
          if (e.target === dialogRef.current && !pending) dialogRef.current?.close();
        }}
      >
        <div className="p-6">
          <h2 id={titleId} className="text-lg font-semibold">
            {confirmTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {confirmBody ?? "This cannot be undone."}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
              autoFocus
            >
              Cancel
            </button>
            <button type="button" className={cn("btn btn-danger btn-sm")} onClick={run} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
