-- CreateEnum
CREATE TYPE "Exchange" AS ENUM ('DELTA_INDIA', 'BYBIT');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('ACTIVE', 'INVALID', 'REVOKED');

-- CreateEnum
CREATE TYPE "LeaderStatus" AS ENUM ('PENDING', 'VERIFIED', 'PAUSED', 'DELISTED');

-- CreateEnum
CREATE TYPE "FollowStatus" AS ENUM ('ACTIVE', 'PAUSED', 'STOPPED');

-- CreateEnum
CREATE TYPE "SizingMode" AS ENUM ('PROPORTIONAL', 'FIXED_MARGIN', 'MULTIPLIER');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "CopyOrderStatus" AS ENUM ('PENDING', 'SUBMITTED', 'FILLED', 'PARTIAL', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PositionSide" AS ENUM ('LONG', 'SHORT');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_credential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exchange" "Exchange" NOT NULL DEFAULT 'DELTA_INDIA',
    "label" TEXT NOT NULL DEFAULT 'My account',
    "apiKeyEnc" TEXT NOT NULL,
    "apiSecretEnc" TEXT NOT NULL,
    "keyLast4" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "status" "CredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "verifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leader" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "exchange" "Exchange" NOT NULL DEFAULT 'DELTA_INDIA',
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "status" "LeaderStatus" NOT NULL DEFAULT 'PENDING',
    "maxFollowers" INTEGER,
    "feeBps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leader_stat" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "window" TEXT NOT NULL,
    "roiPct" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "winRatePct" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "maxDrawdownPct" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "totalCopiedUsd" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "tradeCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leader_stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow" (
    "id" TEXT NOT NULL,
    "followerUserId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "sizingMode" "SizingMode" NOT NULL DEFAULT 'PROPORTIONAL',
    "sizingValue" DECIMAL(20,8) NOT NULL DEFAULT 1,
    "maxPositionUsd" DECIMAL(20,2),
    "dailyLossLimitUsd" DECIMAL(20,2),
    "copyReverse" BOOLEAN NOT NULL DEFAULT false,
    "status" "FollowStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leader_fill" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "exchange" "Exchange" NOT NULL DEFAULT 'DELTA_INDIA',
    "externalId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "qty" DECIMAL(30,10) NOT NULL,
    "price" DECIMAL(30,10) NOT NULL,
    "reduceOnly" BOOLEAN NOT NULL DEFAULT false,
    "leaderPositionKey" TEXT,
    "exchTs" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leader_fill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copy_order" (
    "id" TEXT NOT NULL,
    "followId" TEXT NOT NULL,
    "leaderFillId" TEXT NOT NULL,
    "exchange" "Exchange" NOT NULL DEFAULT 'DELTA_INDIA',
    "clientOrderId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "qty" DECIMAL(30,10) NOT NULL,
    "status" "CopyOrderStatus" NOT NULL DEFAULT 'PENDING',
    "filledQty" DECIMAL(30,10) NOT NULL DEFAULT 0,
    "avgPrice" DECIMAL(30,10),
    "exchOrderId" TEXT,
    "slippageBps" DECIMAL(12,4),
    "error" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" TIMESTAMP(3),

    CONSTRAINT "copy_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copy_position" (
    "id" TEXT NOT NULL,
    "followId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "PositionSide" NOT NULL,
    "qty" DECIMAL(30,10) NOT NULL,
    "avgEntry" DECIMAL(30,10) NOT NULL,
    "markPrice" DECIMAL(30,10),
    "unrealizedPnl" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "realizedPnl" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copy_position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "exchange_credential_userId_idx" ON "exchange_credential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "leader_credentialId_key" ON "leader"("credentialId");

-- CreateIndex
CREATE INDEX "leader_status_idx" ON "leader"("status");

-- CreateIndex
CREATE UNIQUE INDEX "leader_stat_leaderId_window_key" ON "leader_stat"("leaderId", "window");

-- CreateIndex
CREATE INDEX "follow_leaderId_status_idx" ON "follow"("leaderId", "status");

-- CreateIndex
CREATE INDEX "follow_followerUserId_idx" ON "follow"("followerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "follow_followerUserId_leaderId_key" ON "follow"("followerUserId", "leaderId");

-- CreateIndex
CREATE INDEX "leader_fill_leaderId_exchTs_idx" ON "leader_fill"("leaderId", "exchTs");

-- CreateIndex
CREATE UNIQUE INDEX "leader_fill_leaderId_externalId_key" ON "leader_fill"("leaderId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "copy_order_clientOrderId_key" ON "copy_order"("clientOrderId");

-- CreateIndex
CREATE INDEX "copy_order_followId_requestedAt_idx" ON "copy_order"("followId", "requestedAt");

-- CreateIndex
CREATE INDEX "copy_order_leaderFillId_idx" ON "copy_order"("leaderFillId");

-- CreateIndex
CREATE INDEX "copy_position_followId_idx" ON "copy_position"("followId");

-- CreateIndex
CREATE UNIQUE INDEX "copy_position_followId_symbol_key" ON "copy_position"("followId", "symbol");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leader" ADD CONSTRAINT "leader_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "exchange_credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leader_stat" ADD CONSTRAINT "leader_stat_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "leader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "leader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "exchange_credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leader_fill" ADD CONSTRAINT "leader_fill_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "leader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_order" ADD CONSTRAINT "copy_order_followId_fkey" FOREIGN KEY ("followId") REFERENCES "follow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_order" ADD CONSTRAINT "copy_order_leaderFillId_fkey" FOREIGN KEY ("leaderFillId") REFERENCES "leader_fill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_position" ADD CONSTRAINT "copy_position_followId_fkey" FOREIGN KEY ("followId") REFERENCES "follow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
