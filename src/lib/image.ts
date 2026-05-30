/**
 * Browser-side image compression for product/shop uploads. Files that already
 * fit under the limit pass through untouched; oversized files get re-encoded
 * as JPEG at a sensible quality, downscaled so the longest edge fits 2000px.
 *
 * Why this exists: NG sellers shoot product photos on their phone, which often
 * produces 8–15 MB raw images. Re-encoding shrinks those to 1–2 MB with no
 * visible quality loss at the sizes we actually render, and uploads from
 * patchy mobile data finish much faster.
 *
 * Backend is still the source of truth — it enforces its own size cap. This is
 * purely UX: fewer rejected uploads, no scary toasts on phone photos.
 */

/** Compress when input exceeds this. Matches backend's reject threshold. */
const TARGET_MAX_BYTES = 5 * 1024 * 1024;
/** Longest edge in pixels after resize. 2000px covers full-screen retina view. */
const MAX_EDGE_PX = 2000;
const PRIMARY_QUALITY = 0.82;
/** If the primary pass is still oversized (rare — multi-megapixel originals),
 *  retry at this quality before giving up. */
const FALLBACK_QUALITY = 0.7;

export interface CompressResult {
  /** The file to upload. Either the original (when small enough) or a fresh
   *  JPEG re-encode at reduced size. */
  file: File;
  /** True when we actually re-encoded. False when we passed through. */
  compressed: boolean;
  originalBytes: number;
  outputBytes: number;
}

export async function compressImageIfNeeded(input: File): Promise<CompressResult> {
  if (input.size <= TARGET_MAX_BYTES) {
    return {
      file: input,
      compressed: false,
      originalBytes: input.size,
      outputBytes: input.size,
    };
  }

  // `imageOrientation: "from-image"` auto-applies EXIF rotation so sideways
  // phone photos come out the right way up. Falls back if the option isn't
  // supported by the browser (older Android).
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(input, { imageOrientation: "from-image" });
  } catch {
    bitmap = await createImageBitmap(input);
  }

  try {
    const ratio = Math.min(
      1,
      MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.round(bitmap.width * ratio);
    const height = Math.round(bitmap.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);

    let blob = await canvasToBlob(canvas, PRIMARY_QUALITY);
    if (blob.size > TARGET_MAX_BYTES) {
      blob = await canvasToBlob(canvas, FALLBACK_QUALITY);
    }

    const baseName = input.name.replace(/\.[^.]+$/, "") || "image";
    const outFile = new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
    });

    return {
      file: outFile,
      compressed: true,
      originalBytes: input.size,
      outputBytes: outFile.size,
    };
  } finally {
    bitmap.close();
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas encoding produced no blob"));
      },
      "image/jpeg",
      quality
    );
  });
}

/** Human-friendly size label for toasts. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
