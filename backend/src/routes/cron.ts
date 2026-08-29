import { Router } from "express";
import { processScheduledPosts } from "../lib/articles";
import { handleApiError, jsonOk, requireCronAuth } from "../lib/api-utils";

const router = Router();

router.get("/publish", async (req, res) => {
  try {
    requireCronAuth(req.headers.authorization);
    const published = await processScheduledPosts();
    return jsonOk(res, { published, at: new Date().toISOString() });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/publish", async (req, res) => {
  try {
    requireCronAuth(req.headers.authorization);
    const published = await processScheduledPosts();
    return jsonOk(res, { published, at: new Date().toISOString() });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
