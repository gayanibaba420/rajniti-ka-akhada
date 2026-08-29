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

export async function getStorageProvider(): Promise<StorageProvider> {
  const provider = process.env.STORAGE_PROVIDER ?? (process.env.VERCEL ? "s3" : "local");
  switch (provider) {
    case "s3":
      return new S3StorageProvider();
    case "cloudinary":
      return new CloudinaryStorageProvider();
    case "local": {
      const { createLocalStorageProvider } = await import("./storage-local");
      return createLocalStorageProvider();
    }
    default:
      return new S3StorageProvider();
  }
}

export async function getStorageStatus(): Promise<{ provider: string; configured: boolean; message?: string }> {
  const provider = process.env.STORAGE_PROVIDER ?? (process.env.VERCEL ? "s3" : "local");
  if (provider === "local") {
    if (process.env.VERCEL) {
      return {
        provider: "local",
        configured: false,
        message: "Local filesystem storage is unavailable on Vercel — set STORAGE_PROVIDER to s3 or cloudinary",
      };
    }
    return { provider: "local", configured: true, message: "Local filesystem storage active" };
  }
  const storage = await getStorageProvider();
  const configured = storage.isConfigured();
  if (!configured) {
    return {
      provider,
      configured: false,
      message: `${provider} credentials missing — uploads will return 503 until configured`,
    };
  }
  return { provider, configured: true };
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
