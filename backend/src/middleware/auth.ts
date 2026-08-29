import type { NextFunction, Request, Response } from "express";
import { getSessionFromRequest } from "../lib/auth";
import { jsonError } from "../lib/api-utils";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) return jsonError(res, "लॉगिन आवश्यक", 401);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: import("../lib/auth").SessionUser;
    }
  }
}
