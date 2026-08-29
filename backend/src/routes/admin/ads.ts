import { Router } from "express";
import { prisma } from "../../lib/db";
import { handleApiError, jsonOk } from "../../lib/api-utils";
import { adSchema } from "../../lib/validators";
import type { z } from "zod";
import { requireAuth } from "../../middleware/auth";

type AdInput = z.infer<typeof adSchema>;

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    const ads = await prisma.advertisement.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
    return jsonOk(res, { ads });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/", async (req, res) => {
  try {
    const input = adSchema.parse(req.body);
    const ad = await prisma.advertisement.create({ data: input });
    return jsonOk(res, { ad }, 201);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.put("/", async (req, res) => {
  try {
    const ads = (req.body.ads as Array<{ id: string } & AdInput>) ?? [];
    await prisma.$transaction(
      ads.map((ad) =>
        prisma.advertisement.update({
          where: { id: ad.id },
          data: { name: ad.name, position: ad.position, code: ad.code, enabled: ad.enabled, sortOrder: ad.sortOrder },
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
    const input = adSchema.partial().parse(req.body);
    const ad = await prisma.advertisement.update({ where: { id: req.params.id }, data: input });
    return jsonOk(res, { ad });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.advertisement.delete({ where: { id: req.params.id } });
    return jsonOk(res, { ok: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
