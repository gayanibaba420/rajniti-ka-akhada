-- CreateEnum
CREATE TYPE "AiNewsDraftStatus" AS ENUM ('FETCHED', 'DRAFT', 'NEEDS_VERIFICATION', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AiNewsVerificationStatus" AS ENUM ('VERIFIED', 'NEEDS_VERIFICATION', 'UNCERTAIN');

-- CreateEnum
CREATE TYPE "AiNewsSourceType" AS ENUM ('GNEWS', 'RSS');

-- CreateEnum
CREATE TYPE "AiGenerationStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "AiNewsSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AiNewsSourceType" NOT NULL,
    "url" TEXT,
    "category" TEXT,
    "query" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiNewsSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiNewsCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiNewsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiNewsDraft" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "content" TEXT,
    "summary" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imagePrompt" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourcePublishedAt" TIMESTAMP(3),
    "rawTitle" TEXT NOT NULL,
    "rawContent" TEXT,
    "rawDescription" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "verificationStatus" "AiNewsVerificationStatus" NOT NULL DEFAULT 'NEEDS_VERIFICATION',
    "status" "AiNewsDraftStatus" NOT NULL DEFAULT 'FETCHED',
    "featuredImageId" TEXT,
    "publishedArticleId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiNewsDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGenerationLog" (
    "id" TEXT NOT NULL,
    "draftId" TEXT,
    "action" TEXT NOT NULL,
    "status" "AiGenerationStatus" NOT NULL,
    "message" TEXT,
    "provider" TEXT,
    "tokensUsed" INTEGER,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiNewsCategory_slug_key" ON "AiNewsCategory"("slug");

-- CreateIndex
CREATE INDEX "AiNewsCategory_enabled_sortOrder_idx" ON "AiNewsCategory"("enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AiNewsDraft_sourceUrl_key" ON "AiNewsDraft"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "AiNewsDraft_publishedArticleId_key" ON "AiNewsDraft"("publishedArticleId");

-- CreateIndex
CREATE INDEX "AiNewsDraft_status_idx" ON "AiNewsDraft"("status");

-- CreateIndex
CREATE INDEX "AiNewsDraft_category_idx" ON "AiNewsDraft"("category");

-- CreateIndex
CREATE INDEX "AiNewsDraft_createdAt_idx" ON "AiNewsDraft"("createdAt");

-- CreateIndex
CREATE INDEX "AiNewsDraft_aiConfidence_idx" ON "AiNewsDraft"("aiConfidence");

-- CreateIndex
CREATE INDEX "AiNewsSource_enabled_sortOrder_idx" ON "AiNewsSource"("enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "AiGenerationLog_createdAt_idx" ON "AiGenerationLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiGenerationLog_status_idx" ON "AiGenerationLog"("status");

-- CreateIndex
CREATE INDEX "AiGenerationLog_draftId_idx" ON "AiGenerationLog"("draftId");

-- AddForeignKey
ALTER TABLE "AiNewsDraft" ADD CONSTRAINT "AiNewsDraft_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiNewsDraft" ADD CONSTRAINT "AiNewsDraft_publishedArticleId_fkey" FOREIGN KEY ("publishedArticleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGenerationLog" ADD CONSTRAINT "AiGenerationLog_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "AiNewsDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
