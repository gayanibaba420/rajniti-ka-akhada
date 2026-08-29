import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { handleApiError, jsonError, jsonOk } from "../../lib/api-utils";
import { breakingNewsSchema } from "../../lib/validators";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const items = await prisma.breakingNews.findMany({
      include: { article: { select: { slug: true, title: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return jsonOk(res, { items });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const input = breakingNewsSchema.parse(req.body);
    const item = await prisma.breakingNews.create({ data: input });
    return jsonOk(res, { item }, 201);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.put("/", async (req, res) => {
  try {
    const schema = breakingNewsSchema.extend({ id: z.string() });
    const items = z.array(schema).parse(req.body.items);
    await prisma.$transaction(
      items.map((item) =>
        prisma.breakingNews.update({
          where: { id: item.id },
          data: {
            title: item.title,
            link: item.link,
            articleId: item.articleId ?? null,
            enabled: item.enabled,
            sortOrder: item.sortOrder,
          },
        }),
      ),
    );
    return jsonOk(res, { ok: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const input = breakingNewsSchema.partial().parse(req.body);
    const item = await prisma.breakingNews.update({ where: { id: req.params.id }, data: input });
    return jsonOk(res, { item });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    requireRole(req.user!.role, ["SUPER_ADMIN", "EDITOR"]);
    await prisma.breakingNews.delete({ where: { id: req.params.id } });
    return jsonOk(res, { ok: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
