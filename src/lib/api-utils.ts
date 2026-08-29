import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { checkDbConnection } from "./db";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof Error && error.name === "StorageNotConfiguredError") {
    return jsonError(error.message, 503);
  }
  console.error("[api]", error);
  const dbOk = await checkDbConnection();
  if (!dbOk) {
    return jsonError("डेटाबेस अस्थायी रूप से अनुपलब्ध है। कृपया बाद में पुनः प्रयास करें।", 503);
  }
  return jsonError("अनुरोध संसाधित नहीं हो सका।", 500);
}

export function requireCronAuth(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new AuthError("Cron not configured", 503);
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) throw new AuthError("Unauthorized cron", 401);
}
