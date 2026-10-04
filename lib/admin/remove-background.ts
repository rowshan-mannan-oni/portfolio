"use client";

/*
 * In-browser background removal for the hero cutout.
 *
 * Uses transformers.js (Apache-2.0) with the MODNet portrait-matting model
 * (Apache-2.0), downloaded from the Hugging Face Hub on first use (~25 MB) and
 * cached by the browser afterwards. Nothing is sent to any server: the photo is
 * processed locally and only the finished PNG is uploaded to Supabase Storage.
 *
 * The library is imported dynamically, so it is never part of normal page
 * bundles — only the admin who clicks the button downloads it.
 */

const MODEL_ID = "Xenova/modnet";
/** Longest side of the image fed to the model; keeps output under the 5 MB limit. */
const MAX_SIDE = 1600;

export type RemovalStage =
  | { stage: "loading-model"; percent: number | null }
  | { stage: "processing" }
  | { stage: "encoding" };

type RgbaImage = { data: Uint8ClampedArray; width: number; height: number; channels: number };
type Segmenter = (input: unknown) => Promise<RgbaImage>;

let segmenterPromise: Promise<Segmenter> | null = null;

async function getSegmenter(onProgress: (s: RemovalStage) => void): Promise<Segmenter> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      const files = new Map<string, { loaded: number; total: number }>();
      const segmenter = await pipeline("background-removal", MODEL_ID, {
        progress_callback: (event: { status: string; file?: string; loaded?: number; total?: number }) => {
          if (event.status === "progress" && event.file && event.total) {
            files.set(event.file, { loaded: event.loaded ?? 0, total: event.total });
            let loaded = 0;
            let total = 0;
            files.forEach((f) => {
              loaded += f.loaded;
              total += f.total;
            });
            onProgress({ stage: "loading-model", percent: total > 0 ? Math.round((loaded / total) * 100) : null });
          }
        },
      });
      return segmenter as unknown as Segmenter;
    })().catch((error) => {
      segmenterPromise = null; // allow a retry after a network failure
      throw error;
    });
  }
  onProgress({ stage: "loading-model", percent: null });
  return segmenterPromise;
}

/** Downscales very large photos before processing. */
async function prepare(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) {
    bitmap.close();
    return blob;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not prepare the image."))), "image/png"),
  );
}

/**
 * Crops away fully transparent margins so the person fills the frame
 * consistently. A little headroom is kept on top and at the sides; the bottom
 * is cut exactly where the person ends, so they "stand" on the frame edge.
 */
async function trimToPng(img: RgbaImage): Promise<Blob> {
  const { data, width, height, channels } = img;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("No person was detected in this photo. Try a clearer portrait.");

  const padX = Math.round((maxX - minX) * 0.04);
  const padTop = Math.round((maxY - minY) * 0.04);
  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padTop);
  const right = Math.min(width - 1, maxX + padX);
  const w = right - left + 1;
  const h = maxY - top + 1;

  const full = document.createElement("canvas");
  full.width = width;
  full.height = height;
  const fullCtx = full.getContext("2d");
  if (!fullCtx) throw new Error("Canvas is not available in this browser.");
  const rgba = channels === 4 ? data : expandToRgba(data, width, height, channels);
  fullCtx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")!.drawImage(full, left, top, w, h, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode the cutout."))), "image/png"),
  );
}

function expandToRgba(data: Uint8ClampedArray, width: number, height: number, channels: number) {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    for (let c = 0; c < 3; c++) out[i * 4 + c] = data[i * channels + Math.min(c, channels - 1)];
    out[i * 4 + 3] = 255;
  }
  return out;
}

/** Returns a transparent, trimmed PNG of the person in the photo. */
export async function removeBackground(image: Blob, onProgress: (s: RemovalStage) => void): Promise<File> {
  const [segmenter, input] = await Promise.all([getSegmenter(onProgress), prepare(image)]);
  onProgress({ stage: "processing" });
  const { RawImage } = await import("@huggingface/transformers");
  const raw = await RawImage.fromBlob(input);
  const output = await segmenter(raw);
  onProgress({ stage: "encoding" });
  const png = await trimToPng(output);
  return new File([png], "cutout.png", { type: "image/png" });
}
