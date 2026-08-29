import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { StorageProvider, UploadResult } from "./storage";

const DEFAULT_LOCAL_DIR = "uploads";

function usesDefaultLocalPath(): boolean {
  const configured = process.env.STORAGE_LOCAL_PATH;
  return !configured || configured === "./uploads" || configured === "uploads";
}

function joinCustomLocalPath(...segments: string[]): string {
  const configured = process.env.STORAGE_LOCAL_PATH!;
  return path.join(/* turbopackIgnore: true */ path.resolve(/* turbopackIgnore: true */ configured), ...segments);
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
    const fullPath = usesDefaultLocalPath()
      ? path.join(process.cwd(), DEFAULT_LOCAL_DIR, storageKey)
      : joinCustomLocalPath(storageKey);
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
    const fullPath = usesDefaultLocalPath()
      ? path.join(process.cwd(), DEFAULT_LOCAL_DIR, storageKey)
      : joinCustomLocalPath(storageKey);
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
