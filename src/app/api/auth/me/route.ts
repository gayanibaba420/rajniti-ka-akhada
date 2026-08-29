import { getSession } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return jsonError("सत्र समाप्त", 401);
    return jsonOk({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
