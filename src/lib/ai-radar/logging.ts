import { prisma } from "@/lib/db";
import type { AiGenerationStatus } from "@prisma/client";

export async function logAiGeneration(input: {
  draftId?: string;
  action: string;
  status: AiGenerationStatus;
  message?: string;
  provider?: string;
  tokensUsed?: number;
  durationMs?: number;
}) {
  return prisma.aiGenerationLog.create({
    data: {
      draftId: input.draftId,
      action: input.action,
      status: input.status,
      message: input.message,
      provider: input.provider ?? "gemini",
      tokensUsed: input.tokensUsed,
      durationMs: input.durationMs,
    },
  });
}

export async function getRecentLogs(limit = 20) {
  return prisma.aiGenerationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { draft: { select: { id: true, title: true, rawTitle: true, status: true } } },
  });
}

export async function getAiRadarStats() {
  const [fetched, draft, needsVerification, approved, published, rejected] = await Promise.all([
    prisma.aiNewsDraft.count({ where: { status: "FETCHED" } }),
    prisma.aiNewsDraft.count({ where: { status: "DRAFT" } }),
    prisma.aiNewsDraft.count({ where: { status: "NEEDS_VERIFICATION" } }),
    prisma.aiNewsDraft.count({ where: { status: "APPROVED" } }),
    prisma.aiNewsDraft.count({ where: { status: "PUBLISHED" } }),
    prisma.aiNewsDraft.count({ where: { status: "REJECTED" } }),
  ]);

  return {
    fetched,
    draft,
    needsVerification,
    approved,
    published,
    rejected,
    total: fetched + draft + needsVerification + approved + published + rejected,
  };
}
