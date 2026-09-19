ALTER TABLE "leader_fill"
  ADD COLUMN "quoteCurrency" TEXT,
  ADD COLUMN "nativePrice" DECIMAL(30, 10),
  ADD COLUMN "priceUsd" DECIMAL(30, 10);
