import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { S3Client } from "@aws-sdk/client-s3";

/**
 * Storage abstraction with two interchangeable drivers, chosen at runtime:
 *
 *   • Cloudflare R2 (production)  — when the R2_* env vars are set. Files are
 *     uploaded to an S3-compatible bucket and served from its public URL. This
 *     is required on Vercel, whose filesystem is read-only and ephemeral.
 *   • Local filesystem (dev)      — the fallback. Writes optimized WebP to
 *     /public/uploads so the app is fully functional with zero infrastructure.
 *
 * Call sites (upload routes, vehicle/media actions) never change — they only see
 * `url` strings, which are root-relative (`/uploads/...`) locally or absolute
 * (`https://<public>/...`) on R2.
 */

// ── Driver selection ─────────────────────────────────────────────────────────
const R2 = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET,
  // Public base URL of the bucket (r2.dev URL or a custom domain), no trailing slash.
  publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/+$/, ""),
};

const useR2 = Boolean(
  R2.accountId && R2.accessKeyId && R2.secretAccessKey && R2.bucket && R2.publicUrl,
);

const PUBLIC_DIR = path.join(process.cwd(), "public");

// Lazily construct the S3 client so the SDK is only loaded when R2 is used.
let s3Client: S3Client | null = null;
async function s3(): Promise<S3Client> {
  if (s3Client) return s3Client;
  const { S3Client: Client } = await import("@aws-sdk/client-s3");
  s3Client = new Client({
    region: "auto",
    endpoint: `https://${R2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2.accessKeyId!,
      secretAccessKey: R2.secretAccessKey!,
    },
  });
  return s3Client;
}

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

/** Upload bytes under `key` (e.g. "vehicles/123.webp") and return the public URL. */
async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  const client = await s3();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  await client.send(
    new PutObjectCommand({
      Bucket: R2.bucket!,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: IMMUTABLE_CACHE,
    }),
  );
  return `${R2.publicUrl}/${key}`;
}

/** Write bytes to /public/<relDir>/<name> and return the root-relative URL. */
async function putLocal(relDir: string, name: string, body: Buffer): Promise<string> {
  const absDir = path.join(PUBLIC_DIR, relDir);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, name), body);
  return `/${relDir.split(path.sep).join("/")}/${name}`;
}

/** Persist bytes via the active driver. `prefix` is the folder ("vehicles", "media", "audio"). */
async function put(prefix: string, name: string, body: Buffer, contentType: string): Promise<string> {
  return useR2
    ? putObject(`${prefix}/${name}`, body, contentType)
    : putLocal(path.join("uploads", prefix), name, body);
}

/** Delete a file we own, handling both absolute R2 URLs and local /uploads paths. */
async function remove(url: string): Promise<void> {
  if (/^https?:\/\//i.test(url)) {
    // Only delete objects from our own R2 bucket.
    if (!useR2 || !R2.publicUrl || !url.startsWith(`${R2.publicUrl}/`)) return;
    const key = url.slice(R2.publicUrl.length + 1);
    try {
      const client = await s3();
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      await client.send(new DeleteObjectCommand({ Bucket: R2.bucket!, Key: key }));
    } catch {
      // already gone — ignore
    }
    return;
  }
  // Local file under /uploads.
  if (!url.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(PUBLIC_DIR, url));
  } catch {
    // already gone — ignore
  }
}

// ── Images ───────────────────────────────────────────────────────────────────
export type StoredImage = {
  url: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
};

export async function saveImage(file: File, subdir = "vehicles"): Promise<StoredImage> {
  const input = Buffer.from(await file.arrayBuffer());
  const id = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(input, { failOn: "none" }).metadata();
    const out = await sharp(input, { failOn: "none" })
      .rotate() // honor EXIF orientation
      .resize({ width: 2560, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const srcW = meta.width ?? null;
    const srcH = meta.height ?? null;
    const width = srcW ? Math.min(srcW, 2560) : null;
    const height = srcW && srcH && width ? Math.round((srcH * width) / srcW) : srcH;

    const url = await put(subdir, `${id}.webp`, out, "image/webp");
    return { url, width, height, sizeBytes: out.length };
  } catch {
    // sharp unavailable / non-image → store the original bytes untouched.
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const url = await put(subdir, `${id}.${ext}`, input, file.type || "application/octet-stream");
    return { url, width: null, height: null, sizeBytes: input.length };
  }
}

/** Delete a stored vehicle/media image. */
export async function deleteImage(url: string): Promise<void> {
  await remove(url);
}

// ── Audio (engine sound) ─────────────────────────────────────────────────────
const AUDIO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "m4a",
};

const AUDIO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
};

export type StoredAudio = { url: string; sizeBytes: number; format: string };

export function audioFormatFor(mime: string, name: string): string | null {
  if (AUDIO_EXT[mime]) return AUDIO_EXT[mime];
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "mp3" || ext === "wav" || ext === "m4a") return ext;
  return null;
}

export async function saveAudio(file: File, format: string): Promise<StoredAudio> {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${format}`;
  const contentType = AUDIO_MIME[format] ?? "application/octet-stream";
  const url = await put("audio", name, buf, contentType);
  return { url, sizeBytes: buf.length, format };
}

/** Delete any file we own (images or audio). */
export async function deleteUpload(url: string): Promise<void> {
  await remove(url);
}
