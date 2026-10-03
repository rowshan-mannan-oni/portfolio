"use client";

import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/env";
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  type Bucket,
} from "@/lib/storage";

/*
 * Direct browser → Supabase Storage uploads, authenticated with the admin's
 * session. Storage RLS only lets admins write; bucket settings enforce MIME
 * type and size again server-side. Uploading directly avoids Vercel's request
 * body limits and gives real progress events.
 */

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export function validateImage(file: File): string | null {
  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Use a JPEG, PNG, WebP, AVIF or GIF image.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Images must be 5 MB or smaller.";
  if (file.size === 0) return "This file is empty.";
  return null;
}

export async function validatePdf(file: File): Promise<string | null> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "The CV must be a PDF file.";
  }
  if (file.size > MAX_PDF_BYTES) return "The PDF must be 10 MB or smaller.";
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...head) !== "%PDF-") return "This file does not look like a valid PDF.";
  return null;
}

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

/** Builds a safe, unique object path such as "projects/<id>/a1b2c3d4e5f6.webp". */
export function buildPath(folder: string, file: File, baseName?: string): string {
  const ext = EXTENSIONS[file.type] ?? "bin";
  const stem = baseName
    ? `${baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file"}-${randomId()}`
    : randomId();
  return `${folder.replace(/\/+$/, "")}/${stem}.${ext}`;
}

export async function uploadFile(
  bucket: Bucket,
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ path: string }> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const { url, publishableKey } = getSupabasePublicEnv();
  const endpoint = `${url.replace(/\/+$/, "")}/storage/v1/object/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", publishableKey);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve({ path });
        return;
      }
      let message = "Upload failed.";
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        const detail = body.message ?? body.error ?? "";
        if (/row-level security|unauthorized|403/i.test(detail)) {
          message = "Upload refused: your account is not authorized to upload files.";
        } else if (/mime|type/i.test(detail)) {
          message = "This file type is not allowed.";
        } else if (/size|large/i.test(detail)) {
          message = "This file is too large.";
        } else if (detail) {
          message = `Upload failed: ${detail}`;
        }
      } catch {
        // Keep the generic message.
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
}
