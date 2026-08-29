import { NextRequest } from "next/server";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { changePasswordSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const body = changePasswordSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { id: session.id, active: true } });
    if (!user) return jsonError("उपयोगकर्ता नहीं मिला", 404);

    const valid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) return jsonError("वर्तमान पासवर्ड गलत है", 400);
    if (body.currentPassword === body.newPassword) {
      return jsonError("नया पासवर्ड पुराने से अलग होना चाहिए", 400);
    }

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return jsonOk({ ok: true, message: "पासवर्ड बदल दिया गया" });
  } catch (error) {
    return handleApiError(error);
  }
}
