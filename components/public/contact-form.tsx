"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitContact } from "@/app/actions/contact";
import type { ContactFormState } from "@/lib/validation/contact";
import { cn } from "@/lib/utils";

const initial: ContactFormState = { status: "idle" };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  const startedRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Timestamp used by the server's minimum-fill-time check. Set once, so a
    // failed submission does not reset the clock.
    if (startedRef.current && !startedRef.current.value) {
      startedRef.current.value = String(Date.now());
    }
  });

  if (state.status === "success") {
    return (
      <div className="card flex flex-col items-start gap-3 p-7" role="status">
        <CheckCircle2 className="size-6 text-primary" aria-hidden="true" />
        <p className="text-lg font-medium">Message sent</p>
        <p className="text-muted">{state.message}</p>
      </div>
    );
  }

  const err = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} className="card relative space-y-5 p-6 sm:p-8" noValidate>
      <input ref={startedRef} type="hidden" name="started_at" defaultValue="" />
      {/* Honeypot — hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Name" error={err.name}>
          <input id="contact-name" name="name" defaultValue={v.name} autoComplete="name" required maxLength={120} className="input" aria-invalid={Boolean(err.name)} aria-describedby={err.name ? "contact-name-error" : undefined} />
        </Field>
        <Field id="contact-email" label="Email" error={err.email}>
          <input id="contact-email" name="email" defaultValue={v.email} type="email" autoComplete="email" required maxLength={254} className="input" aria-invalid={Boolean(err.email)} aria-describedby={err.email ? "contact-email-error" : undefined} />
        </Field>
      </div>
      <Field id="contact-organization" label="Organization" optional error={err.organization}>
        <input id="contact-organization" name="organization" defaultValue={v.organization} autoComplete="organization" maxLength={160} className="input" aria-invalid={Boolean(err.organization)} />
      </Field>
      <Field id="contact-subject" label="Subject" error={err.subject}>
        <input id="contact-subject" name="subject" defaultValue={v.subject} required maxLength={200} className="input" aria-invalid={Boolean(err.subject)} aria-describedby={err.subject ? "contact-subject-error" : undefined} />
      </Field>
      <Field id="contact-message" label="Message" error={err.message}>
        <textarea id="contact-message" name="message" defaultValue={v.message} required rows={6} maxLength={5000} className="input" aria-invalid={Boolean(err.message)} aria-describedby={err.message ? "contact-message-error" : undefined} />
      </Field>

      {state.status === "error" && state.message ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-subtle">Your details are used only to reply to you.</p>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          <Send className={cn("size-4", pending && "animate-pulse")} aria-hidden="true" />
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-subtle">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
