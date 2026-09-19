-- Per-tab session identifier so one tab's end can't close another's session.
ALTER TABLE "usage_session" ADD COLUMN "clientId" TEXT;
CREATE INDEX "usage_session_userId_clientId_idx" ON "usage_session"("userId", "clientId");

-- At most one ACTIVE grant per email (case-insensitive). Prisma can't express
-- partial unique indexes, so this is hand-written.
CREATE UNIQUE INDEX "access_grant_active_email_key" ON "access_grant" (lower("email")) WHERE "revokedAt" IS NULL;
