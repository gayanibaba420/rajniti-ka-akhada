import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";

const newsletterSchema = z.object({
  email: z.string().trim().email("वैध ईमेल दर्ज करें"),
});

export async function POST(request: NextRequest) {
  try {
    const body = newsletterSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      return jsonError("यह ईमेल पहले से सदस्यता में है", 409);
    }

    await prisma.newsletterSubscriber.create({ data: { email } });
    return jsonOk({ message: "धन्यवाद! आपको दैनिक समाचार मिलेंगे।" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
