ALTER TABLE "exchange_credential" ADD COLUMN "apiKeyFingerprint" TEXT;
CREATE UNIQUE INDEX "exchange_credential_exchange_apiKeyFingerprint_key"
  ON "exchange_credential"("exchange", "apiKeyFingerprint");
