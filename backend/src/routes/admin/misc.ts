import { Router } from "express";
import { requireRole } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { getAnalyticsSummary } from "../../lib/articles";
import { handleApiError, jsonError, jsonOk } from "../../lib/api-utils";
import { siteSettingSchema } from "../../lib/validators";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/meta", async (_req, res) => {
  try {
    const [categories, authors, tags] = await Promise.all([
      prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      prisma.author.findMany({ orderBy: { name: "asc" } }),
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
    ]);
    return jsonOk(res, { categories, authors, tags });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/analytics", async (_req, res) => {
  try {
    const analytics = await getAnalyticsSummary();
    return jsonOk(res, analytics);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/settings", async (_req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    return jsonOk(res, { settings: Object.fromEntries(settings.map((s) => [s.key, s.value])) });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.put("/settings", async (req, res) => {
  try {
    const { settings } = siteSettingSchema.parse(req.body);
    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } }),
      ),
    );
    return jsonOk(res, { ok: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/comments", async (req, res) => {
  try {
    requireRole(req.user!.role, ["SUPER_ADMIN", "EDITOR"]);
    const comments = await prisma.comment.findMany({
      include: { article: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonOk(res, { comments });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/comments/:id", async (req, res) => {
  try {
    requireRole(req.user!.role, ["SUPER_ADMIN", "EDITOR"]);
    const { approved } = req.body;
    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: { approved: Boolean(approved) },
    });
    return jsonOk(res, { comment });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/comments/:id", async (req, res) => {
  try {
    requireRole(req.user!.role, ["SUPER_ADMIN", "EDITOR"]);
    await prisma.comment.delete({ where: { id: req.params.id } });
    return jsonOk(res, { ok: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
