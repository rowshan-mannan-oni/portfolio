import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { CvManager } from "@/components/admin/cv-manager";
import { adminDb } from "@/lib/admin/page-data";

export const metadata: Metadata = { title: "CV" };

export default async function CvPage() {
  const db = await adminDb();
  const { data, error } = await db
    .from("site_settings")
    .select("cv_path, cv_file_name, cv_updated_at, cv_visible")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;

  return (
    <>
      <PageHeader title="CV" description="Upload, replace or remove the PDF behind every “Download CV” button." />
      <CvManager
        path={data?.cv_path ?? null}
        fileName={data?.cv_file_name ?? null}
        updatedAt={data?.cv_updated_at ?? null}
        visible={data?.cv_visible ?? true}
      />
    </>
  );
}
