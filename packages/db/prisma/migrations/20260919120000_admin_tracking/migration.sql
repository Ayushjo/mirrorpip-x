-- AlterTable
ALTER TABLE "user" ADD COLUMN "city" TEXT;
ALTER TABLE "user" ADD COLUMN "country" TEXT;
ALTER TABLE "user" ADD COLUMN "intendedRole" TEXT;
ALTER TABLE "user" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "user" ADD COLUMN "lng" DOUBLE PRECISION;
ALTER TABLE "user" ADD COLUMN "locationUpdatedAt" TIMESTAMP(3);
ALTER TABLE "user" ADD COLUMN "phone" TEXT;
ALTER TABLE "user" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "user" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "user" ADD COLUMN "riskDisclosureAcceptedAt" TIMESTAMP(3);
ALTER TABLE "user" ADD COLUMN "tosAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "copy_order" ADD COLUMN "commission" DECIMAL(20,8);
ALTER TABLE "copy_order" ADD COLUMN "fees" DECIMAL(20,8);

-- CreateTable
CREATE TABLE "usage_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "pagePath" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "usage_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "path" TEXT,
    "feature" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_grant" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "grantedBy" TEXT NOT NULL,
    "grantedByEmail" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_grant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_session_userId_lastSeenAt_idx" ON "usage_session"("userId", "lastSeenAt");

-- CreateIndex
CREATE INDEX "usage_event_userId_createdAt_idx" ON "usage_event"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "usage_event_feature_createdAt_idx" ON "usage_event"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_log_createdAt_idx" ON "admin_audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_log_targetType_targetId_idx" ON "admin_audit_log"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "notification_userId_createdAt_idx" ON "notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "access_grant_email_idx" ON "access_grant"("email");
