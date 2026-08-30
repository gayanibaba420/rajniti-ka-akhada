/**
 * Safely resolve failed Prisma migrations when the database schema already
 * matches the migration outcome (e.g. objects created by db push before migrate).
 * Uses direct SQL to avoid Neon advisory-lock timeouts on migrate resolve.
 * Never drops data or resets the database.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REPAIR_CHECKS = {
  "20260829210000_blog_post": verifyBlogPostMigration,
};

async function getFailedMigrations() {
  return prisma.$queryRaw`
    SELECT migration_name
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL
      AND rolled_back_at IS NULL
      AND logs IS NOT NULL
  `;
}

async function verifyBlogPostMigration() {
  const enumRows = await prisma.$queryRaw`
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'BlogStatus'
    GROUP BY t.typname
    HAVING COUNT(DISTINCT e.enumlabel) = 2
  `;
  if (enumRows.length === 0) return false;

  const tableRows = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'BlogPost'
  `;
  if (tableRows.length === 0) return false;

  const requiredIndexes = [
    "BlogPost_pkey",
    "BlogPost_slug_key",
    "BlogPost_slug_idx",
    "BlogPost_status_idx",
    "BlogPost_publishedAt_idx",
  ];
  const indexRows = await prisma.$queryRaw`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'BlogPost'
  `;
  const existing = new Set(indexRows.map((r) => r.indexname));
  if (!requiredIndexes.every((name) => existing.has(name))) return false;

  const requiredFks = ["BlogPost_authorId_fkey", "BlogPost_featuredImageId_fkey"];
  const fkRows = await prisma.$queryRaw`
    SELECT tc.constraint_name AS conname
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'BlogPost'
      AND tc.constraint_type = 'FOREIGN KEY'
  `;
  const existingFks = new Set(fkRows.map((r) => r.conname));
  return requiredFks.every((name) => existingFks.has(name));
}

function migrationChecksum(migrationName) {
  const sqlPath = join(
    process.cwd(),
    "prisma",
    "migrations",
    migrationName,
    "migration.sql",
  );
  const content = readFileSync(sqlPath);
  return createHash("sha256").update(content).digest("hex");
}

async function markMigrationApplied(migrationName) {
  const checksum = migrationChecksum(migrationName);
  const updated = await prisma.$executeRaw`
    UPDATE "_prisma_migrations"
    SET finished_at = NOW(), logs = NULL, checksum = ${checksum}
    WHERE migration_name = ${migrationName}
      AND finished_at IS NULL
  `;
  return updated > 0;
}

async function main() {
  const failed = await getFailedMigrations();
  if (failed.length === 0) {
    console.log("No failed migrations to repair.");
    return;
  }

  let repaired = false;
  for (const { migration_name: name } of failed) {
    const verify = REPAIR_CHECKS[name];
    if (!verify) {
      console.warn(`No repair check defined for failed migration: ${name}`);
      continue;
    }

    const ok = await verify();
    if (!ok) {
      console.warn(
        `Migration ${name} failed and schema does not fully match — manual intervention required.`,
      );
      continue;
    }

    console.log(
      `Migration ${name}: schema verified — marking as applied (objects already exist).`,
    );
    if (await markMigrationApplied(name)) {
      repaired = true;
    }
  }

  if (!repaired && failed.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error("repair-failed-migrations failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
