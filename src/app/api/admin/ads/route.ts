import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { adSchema } from "@/lib/validators";
import type { z } from "zod";

type AdInput = z.infer<typeof adSchema>;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const ads = await prisma.advertisement.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
    return jsonOk({ ads });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const input = adSchema.parse(await request.json());
    const ad = await prisma.advertisement.create({ data: input });
    return jsonOk({ ad }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const body = await request.json();
    const ads = (body.ads as Array<{ id: string } & AdInput>) ?? [];
    await prisma.$transaction(
      ads.map((ad) =>
        prisma.advertisement.update({
          where: { id: ad.id },
          data: {
            name: ad.name,
            position: ad.position,
            code: ad.code,
            enabled: ad.enabled,
            sortOrder: ad.sortOrder,
          },
        })
      )
    );
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
