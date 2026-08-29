import { mkdir, writeFile, unlink, stat } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface UploadResult {
  url: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface StorageProvider {
  upload(file: Buffer, filename: string, mimeType: string): Promise<UploadResult>;
  delete(storageKey: string): Promise<void>;
  isConfigured(): boolean;
}

class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private publicPrefix = "/uploads";

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  isConfigured(): boolean {
    return Boolean(this.basePath);
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    const ext = path.extname(filename) || mimeToExt(mimeType);
    const storageKey = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${randomUUID()}${ext}`;
    const fullPath = path.join(this.basePath, storageKey);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file);
    return {
      url: `${this.publicPrefix}/${storageKey}`,
      storageKey,
      filename,
      mimeType,
      size: file.length,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const fullPath = path.join(this.basePath, storageKey);
    try {
      await unlink(fullPath);
    } catch {
      // file may already be removed
    }
  }
}

class S3StorageProvider implements StorageProvider {
  isConfigured(): boolean {
    return Boolean(
      process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_S3_BUCKET &&
        process.env.AWS_S3_REGION
    );
  }

  async upload(_file: Buffer, _filename: string, _mimeType: string): Promise<UploadResult> {
    throw new StorageNotConfiguredError(
      "S3 storage is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_S3_REGION."
    );
  }

  async delete(_storageKey: string): Promise<void> {
    throw new StorageNotConfiguredError("S3 storage is not configured.");
  }
}

class CloudinaryStorageProvider implements StorageProvider {
  isConfigured(): boolean {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
  }

  async upload(_file: Buffer, _filename: string, _mimeType: string): Promise<UploadResult> {
    throw new StorageNotConfiguredError(
      "Cloudinary storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
    );
  }

  async delete(_storageKey: string): Promise<void> {
    throw new StorageNotConfiguredError("Cloudinary storage is not configured.");
  }
}

export class StorageNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageNotConfiguredError";
  }
}

export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  switch (provider) {
    case "s3":
      return new S3StorageProvider();
    case "cloudinary":
      return new CloudinaryStorageProvider();
    default:
      return new LocalStorageProvider(process.env.STORAGE_LOCAL_PATH ?? "./uploads");
  }
}

export function getStorageStatus(): { provider: string; configured: boolean; message?: string } {
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  const storage = getStorageProvider();
  const configured = storage.isConfigured();
  if (provider === "local") {
    return { provider: "local", configured: true, message: "Local filesystem storage active" };
  }
  if (!configured) {
    return {
      provider,
      configured: false,
      message: `${provider} credentials missing — uploads will return 503 until configured`,
    };
  }
  return { provider, configured: true };
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  };
  return map[mime] ?? "";
}

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_SIZE = 5 * 1024 * 1024;

export function validateUpload(file: Buffer, mimeType: string): void {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("केवल JPEG, PNG, WebP, GIF, SVG चित्र स्वीकार्य हैं");
  }
  if (file.length > MAX_SIZE) {
    throw new Error("फ़ाइल 5MB से छोटी होनी चाहिए");
  }
}

export async function getLocalUploadPath(): Promise<string> {
  const base = process.env.STORAGE_LOCAL_PATH ?? "./uploads";
  await mkdir(path.resolve(base), { recursive: true });
  return path.resolve(base);
}

export async function localFileExists(storageKey: string): Promise<boolean> {
  const base = process.env.STORAGE_LOCAL_PATH ?? "./uploads";
  try {
    await stat(path.join(path.resolve(base), storageKey));
    return true;
  } catch {
    return false;
  }
}
