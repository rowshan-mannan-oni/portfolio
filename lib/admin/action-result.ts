import type { FieldErrors } from "@/lib/validation/fields";

export type ActionResult =
  | { ok: true; message: string; redirectTo?: string; id?: string }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export const idleResult: ActionResult | null = null;
