-- CreateTable
CREATE TABLE "leader_equity_point" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "equityUsd" DECIMAL(20,2) NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leader_equity_point_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leader_equity_point_leaderId_ts_idx" ON "leader_equity_point"("leaderId", "ts");

-- AddForeignKey
ALTER TABLE "leader_equity_point" ADD CONSTRAINT "leader_equity_point_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "leader"("id") ON DELETE CASCADE ON UPDATE CASCADE;
