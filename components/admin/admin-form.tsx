"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/admin/action-result";
import type { FieldErrors } from "@/lib/validation/fields";
import { cn } from "@/lib/utils";

type FormContextValue = { errors: FieldErrors; pending: boolean };
const FormContext = createContext<FormContextValue>({ errors: {}, pending: false });
export const useAdminForm = () => useContext(FormContext);

type Props = {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel?: string;
  /** Extra buttons rendered next to the submit button (they can set name="intent"). */
  secondaryActions?: React.ReactNode;
  className?: string;
  /** Sticky action bar for long forms. */
  stickyFooter?: boolean;
  onSuccess?: (result: Extract<ActionResult, { ok: true }>) => void;
};

/**
 * Shared admin form: submits through a Server Action inside a transition
 * (so inputs are NOT reset on validation errors), shows field errors via
 * context, disables controls while pending and reports results as toasts.
 */
export function AdminForm({
  action,
  children,
  submitLabel = "Save",
  secondaryActions,
  className,
  stickyFooter = false,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) formData.set(submitter.name, submitter.value);

    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) {
        setErrors({});
        toast.success(result.message);
        onSuccess?.(result);
        if (result.redirectTo) router.push(result.redirectTo);
        else router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        const firstError = result.fieldErrors ? Object.keys(result.fieldErrors)[0] : null;
        if (firstError) {
          const el = form.querySelector<HTMLElement>(`[name="${CSS.escape(firstError)}"], [data-field="${CSS.escape(firstError)}"]`);
          el?.focus();
        }
      }
    });
  }

  return (
    <FormContext.Provider value={{ errors, pending }}>
      <form onSubmit={handleSubmit} className={cn("space-y-8", className)} noValidate>
        <fieldset disabled={pending} className="contents">
          {children}
        </fieldset>
        <div
          className={cn(
            "flex flex-wrap items-center justify-end gap-2",
            stickyFooter &&
              "sticky bottom-0 z-10 -mx-4 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6",
          )}
        >
          {secondaryActions}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </FormContext.Provider>
  );
}

/** Groups related fields with a heading — keeps long forms scannable. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-[0.95rem] font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}
