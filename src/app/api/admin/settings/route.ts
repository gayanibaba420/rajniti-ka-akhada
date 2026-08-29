import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { siteSettingSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const settings = await prisma.siteSetting.findMany();
    return jsonOk({ settings: Object.fromEntries(settings.map((s) => [s.key, s.value])) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const { settings } = siteSettingSchema.parse(await request.json());
    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } })
      )
    );
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
