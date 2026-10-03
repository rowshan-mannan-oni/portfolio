import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/forms/settings-form";
import { saveSiteSettings } from "@/lib/admin/actions/settings";
import { adminDb } from "@/lib/admin/page-data";
import { DEFAULT_SETTINGS } from "@/lib/data/public";

export const metadata: Metadata = { title: "Profile & SEO" };

export default async function ProfilePage() {
  const db = await adminDb();
  const { data, error } = await db.from("site_settings").select("*").eq("id", true).maybeSingle();
  if (error) throw error;

  return (
    <>
      <PageHeader
        title="Profile & SEO"
        description="Your identity, biography, research profile and search metadata. Empty fields are simply omitted on the site."
      />
      <SettingsForm key={data?.updated_at ?? "new"} settings={data ?? DEFAULT_SETTINGS} action={saveSiteSettings} />
    </>
  );
}
