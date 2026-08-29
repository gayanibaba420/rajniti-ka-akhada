import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const LOCAL_UPLOADS_DIR = "uploads";

function getLocalFilePath(parts: string[]): string {
  const configured = process.env.STORAGE_LOCAL_PATH;
  if (!configured || configured === "./uploads" || configured === "uploads") {
    return path.join(process.cwd(), LOCAL_UPLOADS_DIR, ...parts);
  }
  return path.join(path.resolve(/* turbopackIgnore: true */ configured), ...parts);
}

export async function GET(request: NextRequest) {
  if ((process.env.STORAGE_PROVIDER ?? "local") !== "local") {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/uploads\//, "").split("/");
  if (parts.some((p) => p === ".." || !p)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = getLocalFilePath(parts);
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
