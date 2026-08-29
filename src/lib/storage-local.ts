import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { StorageProvider, UploadResult } from "./storage";

const DEFAULT_LOCAL_DIR = "uploads";

function getDefaultUploadDir(): string {
  return path.join(process.cwd(), DEFAULT_LOCAL_DIR);
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

class LocalStorageProvider implements StorageProvider {
  private publicPrefix = "/uploads";

  isConfigured(): boolean {
    return true;
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    const ext = path.extname(filename) || mimeToExt(mimeType);
    const storageKey = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${randomUUID()}${ext}`;
    const fullPath = path.join(getDefaultUploadDir(), storageKey);
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
    const fullPath = path.join(getDefaultUploadDir(), storageKey);
    try {
      await unlink(fullPath);
    } catch {
      // file may already be removed
    }
  }
}

export function createLocalStorageProvider(): StorageProvider {
  return new LocalStorageProvider();
}

export function getLocalUploadFilePath(parts: string[]): string {
  return path.join(getDefaultUploadDir(), ...parts);
}
