import { z } from "zod";

/** Removes control characters (except newlines/tabs) and trims. */
export function stripControl(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

const text = (max: number, label: string) =>
  z
    .string()
    .transform(stripControl)
    .pipe(z.string().min(1, `${label} is required.`).max(max, `${label} must be at most ${max} characters.`));

export const contactSchema = z.object({
  name: text(120, "Name"),
  email: z
    .string()
    .transform(stripControl)
    .pipe(z.email("Please enter a valid email address.").max(254)),
  organization: z
    .string()
    .transform(stripControl)
    .pipe(z.string().max(160, "Organization must be at most 160 characters."))
    .transform((v) => (v.length > 0 ? v : null)),
  subject: text(200, "Subject"),
  message: text(5000, "Message").pipe(
    z.string().min(10, "Please write a slightly longer message."),
  ),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof ContactInput, string>>;
  /** Submitted values, echoed back so the form keeps them after an error. */
  values?: Partial<Record<keyof ContactInput, string>>;
};
