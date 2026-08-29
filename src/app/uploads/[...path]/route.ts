import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getLocalUploadFilePath } from "@/lib/storage-local";

export const dynamic = "force-dynamic";

function isLocalStorageEnabled(): boolean {
  return (process.env.STORAGE_PROVIDER ?? (process.env.VERCEL ? "" : "local")) === "local";
}

export async function GET(request: NextRequest) {
  if (!isLocalStorageEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/uploads\//, "").split("/");
  if (parts.some((p) => p === ".." || !p)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = getLocalUploadFilePath(parts);
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const types: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    };
    return new NextResponse(data, {
      headers: {
        "Content-Type": types[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
