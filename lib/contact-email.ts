import "server-only";
import type { ContactInput } from "@/lib/validation/contact";

export const CONTACT_RECIPIENT = "rowshanmannanoni@gmail.com";

export function isContactEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.CONTACT_EMAIL_FROM?.trim());
}

export async function sendContactEmail(contact: ContactInput, messageId: string): Promise<void> {
  if (!isContactEmailConfigured()) throw new Error("Contact email is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `contact/${messageId}`,
    },
    body: JSON.stringify({
      from: process.env.CONTACT_EMAIL_FROM!.trim(),
      to: [CONTACT_RECIPIENT],
      reply_to: contact.email,
      subject: `Website contact: ${contact.subject.replace(/[\r\n]+/g, " ")}`,
      text: [
        `Name: ${contact.name}`,
        `Email: ${contact.email}`,
        `Organization: ${contact.organization ?? "Not provided"}`,
        `Subject: ${contact.subject}`,
        "",
        contact.message,
      ].join("\n"),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new Error(`Contact email provider returned HTTP ${response.status}.`);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") {
    throw new Error("Contact email provider did not confirm acceptance.");
  }
}
