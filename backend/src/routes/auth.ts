import { Router } from "express";
import {
  authenticateUser,
  clearSessionCookie,
  createSession,
  getSessionFromRequest,
  setSessionCookie,
} from "../lib/auth";
import { handleApiError, jsonError, jsonOk } from "../lib/api-utils";
import { loginSchema } from "../lib/validators";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await authenticateUser(body.email, body.password);
    if (!user) return jsonError(res, "ईमेल या पासवर्ड गलत है", 401);
    const token = await createSession(user);
    setSessionCookie(res, token);
    return jsonOk(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/me", async (req, res) => {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) return jsonError(res, "सत्र समाप्त", 401);
    return jsonOk(res, { user });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  return jsonOk(res, { ok: true });
});

export default router;
