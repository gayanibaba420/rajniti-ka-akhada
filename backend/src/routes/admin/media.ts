import { Router } from "express";
import multer from "multer";
import { requireRole } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { getStorageProvider, getStorageStatus, validateUpload } from "../../lib/storage";
import { handleApiError, jsonError, jsonOk } from "../../lib/api-utils";
import { mediaUpdateSchema, mediaUrlSchema } from "../../lib/validators";
import { requireAuth } from "../../middleware/auth";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });
    return jsonOk(res, { media, storage: await getStorageStatus() });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const contentType = req.headers["content-type"] ?? "";

    if (contentType.includes("application/json")) {
      const input = mediaUrlSchema.parse(req.body);
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
      return jsonOk(res, { media }, 201);
    }

    const storage = await getStorageProvider();
    if (!storage.isConfigured()) {
      return jsonError(
        res,
        `${(await getStorageStatus()).message ?? "Storage not configured"} — बाहरी URL से जोड़ने के लिए JSON POST { url } का उपयोग करें`,
        503,
      );
    }

    const file = req.file;
    if (!file) return jsonError(res, "फ़ाइल आवश्यक है", 400);

    validateUpload(file.buffer, file.mimetype);
    const uploaded = await storage.upload(file.buffer, file.originalname, file.mimetype);

    const media = await prisma.media.create({
      data: {
        filename: uploaded.filename,
        url: uploaded.url,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        storageKey: uploaded.storageKey,
        alt: String(req.body.alt ?? ""),
        caption: String(req.body.caption ?? ""),
        credit: String(req.body.credit ?? ""),
      },
    });

    return jsonOk(res, { media }, 201);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const input = mediaUpdateSchema.parse(req.body);
    const media = await prisma.media.update({ where: { id: req.params.id }, data: input });
    return jsonOk(res, { media });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    requireRole(req.user!.role, ["SUPER_ADMIN", "EDITOR"]);
    const media = await prisma.media.findUnique({ where: { id: req.params.id } });
    if (!media) return jsonError(res, "मीडिया नहीं मिला", 404);

    if (media.storageKey) {
      try {
        const storage = await getStorageProvider();
        if (storage.isConfigured()) await storage.delete(media.storageKey);
      } catch {
        // ignore storage delete failure
      }
    }

    await prisma.media.delete({ where: { id: req.params.id } });
    return jsonOk(res, { ok: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
