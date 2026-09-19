-- Remove SHARK/PI42/MUDREX from the Exchange enum (Postgres can't drop enum
-- values, so recreate the type). Only DELTA_INDIA rows exist today.
CREATE TYPE "Exchange_new" AS ENUM ('DELTA_INDIA', 'BYBIT');

ALTER TABLE "exchange_credential" ALTER COLUMN "exchange" DROP DEFAULT;
ALTER TABLE "exchange_credential" ALTER COLUMN "exchange" TYPE "Exchange_new" USING "exchange"::text::"Exchange_new";
ALTER TABLE "exchange_credential" ALTER COLUMN "exchange" SET DEFAULT 'DELTA_INDIA';

ALTER TABLE "leader" ALTER COLUMN "exchange" DROP DEFAULT;
ALTER TABLE "leader" ALTER COLUMN "exchange" TYPE "Exchange_new" USING "exchange"::text::"Exchange_new";
ALTER TABLE "leader" ALTER COLUMN "exchange" SET DEFAULT 'DELTA_INDIA';

ALTER TABLE "leader_fill" ALTER COLUMN "exchange" DROP DEFAULT;
ALTER TABLE "leader_fill" ALTER COLUMN "exchange" TYPE "Exchange_new" USING "exchange"::text::"Exchange_new";
ALTER TABLE "leader_fill" ALTER COLUMN "exchange" SET DEFAULT 'DELTA_INDIA';

ALTER TABLE "copy_order" ALTER COLUMN "exchange" DROP DEFAULT;
ALTER TABLE "copy_order" ALTER COLUMN "exchange" TYPE "Exchange_new" USING "exchange"::text::"Exchange_new";
ALTER TABLE "copy_order" ALTER COLUMN "exchange" SET DEFAULT 'DELTA_INDIA';

DROP TYPE "Exchange";
ALTER TYPE "Exchange_new" RENAME TO "Exchange";
