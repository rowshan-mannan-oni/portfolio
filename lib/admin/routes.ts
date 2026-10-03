/** The admin area lives here. Obscurity is NOT the protection — auth + RLS are. */
export const ADMIN_BASE = "/oni_the_boss";
export const ADMIN_LOGIN = `${ADMIN_BASE}/login`;

export function adminPath(...segments: string[]): string {
  return [ADMIN_BASE, ...segments].join("/");
}
