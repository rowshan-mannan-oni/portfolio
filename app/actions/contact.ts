"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { isContactEmailConfigured, sendContactEmail } from "@/lib/contact-email";
import { createSecretClient } from "@/lib/supabase/admin";
import { contactSchema, type ContactFormState, type ContactInput } from "@/lib/validation/contact";

const MIN_FILL_TIME_MS = 3_000;
const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000;
const PER_IP_LIMIT = 3; // messages per IP hash per hour
const GLOBAL_LIMIT = 30; // messages per hour overall (flood protection)

function hashIp(ip: string): string {
  const salt =
    process.env.CONTACT_IP_SALT ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "portfolio-contact";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || null;
}

const SUCCESS: ContactFormState = {
  status: "success",
  message: "Thank you — your message has been sent. I'll reply as soon as I can.",
};

/**
 * Public contact form endpoint.
 * Order of checks: honeypot → timing → validation → rate limit → insert.
 * Bots tripping the honeypot or timing check get a fake success so they
 * learn nothing. Inserts use the server-only secret key; the table has no
 * public insert policy.
 */
export async function submitContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // 1. Honeypot: a field humans never see.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.length > 0) return SUCCESS;

  const raw = {
    name: String(formData.get("name") ?? "").slice(0, 6000),
    email: String(formData.get("email") ?? "").slice(0, 6000),
    organization: String(formData.get("organization") ?? "").slice(0, 6000),
    subject: String(formData.get("subject") ?? "").slice(0, 6000),
    message: String(formData.get("message") ?? "").slice(0, 6000),
  };

  // 2. Timing: set by the browser when the form mounts.
  const startedAt = Number(formData.get("started_at"));
  if (!formData.get("started_at") || !Number.isFinite(startedAt)) {
    return {
      status: "error",
      message: "Please enable JavaScript to use this form, or reach out by email.",
      values: raw,
    };
  }
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_FILL_TIME_MS) return SUCCESS;
  if (elapsed > MAX_FORM_AGE_MS) {
    return { status: "error", message: "This form has expired. Please reload the page.", values: raw };
  }

  // 3. Validation.
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: ContactFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactInput | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors, values: raw };
  }

  const supabase = createSecretClient();
  if (!supabase) {
    console.error("[contact] SUPABASE_SECRET_KEY is not configured.");
    return {
      status: "error",
      message: "The contact form is temporarily unavailable. Please reach out by email instead.",
      values: raw,
    };
  }

  if (!isContactEmailConfigured()) {
    console.error("[contact] RESEND_API_KEY or CONTACT_EMAIL_FROM is not configured.");
    return {
      status: "error",
      message: "The contact form is temporarily unavailable. Please email rowshanmannanoni@gmail.com instead.",
      values: raw,
    };
  }

  // 4. Rate limiting using a salted hash of the IP (the raw IP is never stored).
  const ip = await clientIp();
  const ipHash = ip ? hashIp(ip) : null;
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [perIp, global] = await Promise.all([
    ipHash
      ? supabase
          .from("contact_messages")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("created_at", since)
      : Promise.resolve({ count: 0, error: null }),
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  if (perIp.error || global.error) {
    console.error("[contact] rate-limit query failed", perIp.error ?? global.error);
    return { status: "error", message: "Something went wrong. Please try again later.", values: raw };
  }
  if ((perIp.count ?? 0) >= PER_IP_LIMIT || (global.count ?? 0) >= GLOBAL_LIMIT) {
    return {
      status: "error",
      message: "Too many messages were sent recently. Please try again in an hour or use email.",
      values: raw,
    };
  }

  // 5. Store.
  const { data: saved, error } = await supabase
    .from("contact_messages")
    .insert({ ...parsed.data, ip_hash: ipHash })
    .select("id")
    .single();
  if (error) {
    console.error("[contact] insert failed", error);
    return { status: "error", message: "Something went wrong. Please try again later.", values: raw };
  }

  // Keep the dashboard copy even when the email provider is unavailable.
  try {
    await sendContactEmail(parsed.data, saved.id);
  } catch {
    console.error("[contact] email delivery failed; message retained in dashboard", saved.id);
    return {
      status: "error",
      message: "Your message was saved, but the email notification could not be sent. Please email rowshanmannanoni@gmail.com directly if your message is urgent.",
      values: raw,
    };
  }

  return SUCCESS;
}
