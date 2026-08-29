import { Prisma } from "@prisma/client";
import type { Response } from "express";
import { ZodError } from "zod";
import { AuthError } from "./auth";
import { checkDbConnection } from "./db";

export function jsonOk<T>(res: Response, data: T, status = 200) {
  return res.status(status).json(data);
}

export function jsonError(res: Response, message: string, status = 400) {
  return res.status(status).json({ error: message });
}

const FIELD_LABELS: Record<string, string> = {
  title: "शीर्षक",
  slug: "स्लग",
  excerpt: "सारांश",
  content: "मुख्य सामग्री",
  categoryId: "श्रेणी",
  authorId: "लेखक",
  status: "स्थिति",
  featuredImageId: "फीचर्ड चित्र",
  scheduledAt: "निर्धारित समय",
  publishedAt: "प्रकाशन समय",
  canonicalUrl: "कैनonical URL",
};

function formatZodError(error: ZodError): string {
  const messages = error.issues.map((issue) => {
    const field = issue.path[0]?.toString() ?? "फ़ील्ड";
    const label = FIELD_LABELS[field] ?? field;
    if (issue.code === "too_small" && issue.type === "string") {
      return `${label} कम से कम ${issue.minimum} अक्षर का होना चाहिए`;
    }
    if (issue.code === "too_small" && issue.type === "array") {
      return `${label} आवश्यक है`;
    }
    if (issue.code === "too_big" && issue.type === "string") {
      return `${label} अधिकतम ${issue.maximum} अक्षर का हो सकता है`;
    }
    if (issue.code === "invalid_string" && issue.validation === "regex") {
      return `${label} में केवल छोटे अक्षर (a-z), संख्या और हाइफ़न हो सकते हैं`;
    }
    return `${label}: ${issue.message}`;
  });
  return messages.join(" • ");
}

function formatPrismaError(error: Prisma.PrismaClientKnownRequestError): string | null {
  if (error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : String(error.meta?.target ?? "");
    if (target.includes("slug")) return "यह स्लग पहले से उपयोग में है। कोई अन्य स्लग चुनें।";
    return "डुप्लिकेट मान — यह रिकॉर्ड पहले से मौजूद है।";
  }
  if (error.code === "P2003") return "अमान्य श्रेणी, लेखक या फीचर्ड चित्र — कृपया मान्य विकल्प चुनें।";
  if (error.code === "P2025") return "रिकॉर्ड नहीं मिला।";
  return null;
}

export async function handleApiError(res: Response, error: unknown) {
  if (error instanceof AuthError) {
    return jsonError(res, error.message, error.status);
  }
  if (error instanceof ZodError) {
    return jsonError(res, formatZodError(error), 400);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const message = formatPrismaError(error);
    if (message) {
      return jsonError(res, message, error.code === "P2002" ? 409 : 400);
    }
  }
  if (error instanceof SyntaxError) {
    return jsonError(res, "अनुरोध डेटा अमान्य JSON है।", 400);
  }
  if (error instanceof Error && error.name === "StorageNotConfiguredError") {
    return jsonError(res, error.message, 503);
  }
  console.error("[api]", error);
  const dbOk = await checkDbConnection();
  if (!dbOk) {
    return jsonError(res, "डेटाबेस अस्थायी रूप से अनुपलब्ध है। कृपया बाद में पुनः प्रयास करें।", 503);
  }
  return jsonError(res, "अनुरोध संसाधित नहीं हो सका।", 500);
}

export function requireCronAuth(authHeader: string | undefined) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new AuthError("Cron not configured", 503);
  if (authHeader !== `Bearer ${secret}`) throw new AuthError("Unauthorized cron", 401);
}
