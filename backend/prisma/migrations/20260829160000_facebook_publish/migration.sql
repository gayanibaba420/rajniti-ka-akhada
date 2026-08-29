-- CreateEnum
CREATE TYPE "FacebookPublishStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "facebookPostId" TEXT,
ADD COLUMN     "facebookPublishStatus" "FacebookPublishStatus",
ADD COLUMN     "facebookPublishedAt" TIMESTAMP(3),
ADD COLUMN     "facebookPublishError" TEXT;
