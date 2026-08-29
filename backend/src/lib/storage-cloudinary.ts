import { createHash } from "crypto";
import type { StorageProvider, UploadResult } from "./storage";
import { StorageNotConfiguredError } from "./storage";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return { cloudName, apiKey, apiSecret };
}

function signParams(params: Record<string, string>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(sorted + apiSecret).digest("hex");
}

class CloudinaryStorageProvider implements StorageProvider {
  isConfigured(): boolean {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    return Boolean(cloudName && apiKey && apiSecret);
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    if (!cloudName || !apiKey || !apiSecret) {
      throw new StorageNotConfiguredError(
        "Cloudinary storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
      );
    }

    const folder = process.env.CLOUDINARY_FOLDER?.trim() || "rajniti-ka-akhada";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const params: Record<string, string> = { folder, timestamp };
    const signature = signParams(params, apiSecret);

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(file)], { type: mimeType }), filename);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("signature", signature);
    form.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Cloudinary upload failed: ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      secure_url: string;
      public_id: string;
      bytes: number;
      format: string;
    };

    return {
      url: data.secure_url,
      storageKey: data.public_id,
      filename,
      mimeType,
      size: data.bytes ?? file.length,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    if (!cloudName || !apiKey || !apiSecret) {
      throw new StorageNotConfiguredError("Cloudinary storage is not configured.");
    }

    const timestamp = String(Math.floor(Date.now() / 1000));
    const params: Record<string, string> = { public_id: storageKey, timestamp };
    const signature = signParams(params, apiSecret);

    const body = new URLSearchParams({
      public_id: storageKey,
      api_key: apiKey,
      timestamp,
      signature,
    });

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Cloudinary delete failed: ${err.slice(0, 200)}`);
    }
  }
}

export function createCloudinaryStorageProvider(): StorageProvider {
  return new CloudinaryStorageProvider();
}
