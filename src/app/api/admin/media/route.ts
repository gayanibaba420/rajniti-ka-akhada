import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorageProvider, getStorageStatus, validateUpload } from "@/lib/storage";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { mediaUrlSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });
    return jsonOk({ media, storage: await getStorageStatus() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const contentType = request.headers.get("content-type") ?? "";

    // Register an external image URL (works without cloud storage credentials)
    if (contentType.includes("application/json")) {
      const input = mediaUrlSchema.parse(await request.json());
      const filename = input.filename ?? input.url.split("/").pop()?.split("?")[0] ?? "external-image";
      const media = await prisma.media.create({
        data: {
          filename,
          url: input.url,
          mimeType: "image/jpeg",
          size: 0,
          alt: input.alt ?? "",
        },
      });
      return jsonOk({ media }, 201);
    }

    const storage = await getStorageProvider();
    if (!storage.isConfigured()) {
      return jsonError(
        `${(await getStorageStatus()).message ?? "Storage not configured"} — बाहरी URL से जोड़ने के लिए JSON POST { url } का उपयोग करें`,
        503
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("फ़ाइल आवश्यक है", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    validateUpload(buffer, file.type);
    const uploaded = await storage.upload(buffer, file.name, file.type);

    const media = await prisma.media.create({
      data: {
        filename: uploaded.filename,
        url: uploaded.url,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        storageKey: uploaded.storageKey,
        alt: String(form.get("alt") ?? ""),
        caption: String(form.get("caption") ?? ""),
        credit: String(form.get("credit") ?? ""),
      },
    });

    return jsonOk({ media }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
