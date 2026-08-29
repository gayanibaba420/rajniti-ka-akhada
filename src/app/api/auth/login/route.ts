import { NextRequest } from "next/server";
import { authenticateUser, createSession, setSessionCookie } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await authenticateUser(body.email, body.password);
    if (!user) return jsonError("ईमेल या पासवर्ड गलत है", 401);
    const token = await createSession(user);
    await setSessionCookie(token);
    return jsonOk({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    return handleApiError(error);
  }
}
