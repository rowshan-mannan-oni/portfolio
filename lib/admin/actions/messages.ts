"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/admin/action-result";
import { ADMIN_BASE } from "@/lib/admin/routes";
import { failure, isUuid } from "@/lib/admin/server-utils";
import type { ContactStatus } from "@/types/database";

const STATUSES: ContactStatus[] = ["unread", "read", "archived"];

export async function setMessageStatus(id: string, status: ContactStatus): Promise<ActionResult> {
  try {
    if (!isUuid(id) || !STATUSES.includes(status)) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("contact_messages")
      .update({ status, read_at: status === "unread" ? null : new Date().toISOString() })
      .eq("id", id);
    if (error) return failure(error, "message status");
    revalidatePath(ADMIN_BASE, "layout");
    const label = { unread: "Marked as unread.", read: "Marked as read.", archived: "Archived." }[status];
    return { ok: true, message: label };
  } catch (error) {
    return failure(error, "message status");
  }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    if (!isUuid(id)) return { ok: false, message: "Invalid request." };
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return failure(error, "delete message");
    revalidatePath(ADMIN_BASE, "layout");
    return { ok: true, message: "Message deleted." };
  } catch (error) {
    return failure(error, "delete message");
  }
}
