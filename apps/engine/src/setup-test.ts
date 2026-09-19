import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../../.env') });

import { prisma } from '@mirrorpip/db';
import { deltaIndia, encryptSecret, fingerprintApiKey, last4 } from '@mirrorpip/exchange';

/**
 * Dev helper: wire a full leader→follower copy scenario from two testnet keys.
 * Keys are read from env (never committed):
 *
 *   OWNER_EMAIL=you@example.com \
 *   DELTA_LEADER_KEY=... DELTA_LEADER_SECRET=... \
 *   DELTA_FOLLOWER_KEY=... DELTA_FOLLOWER_SECRET=... \
 *   pnpm --filter @mirrorpip/engine setup-test
 *
 * Creates two encrypted credentials, a VERIFIED leader, and an ACTIVE proportional
 * follow, all owned by OWNER_EMAIL. Idempotent-ish (skips if already present).
 */
async function main(): Promise<void> {
  const email = (process.env.OWNER_EMAIL ?? '').toLowerCase();
  const lKey = process.env.DELTA_LEADER_KEY ?? '';
  const lSec = process.env.DELTA_LEADER_SECRET ?? '';
  const fKey = process.env.DELTA_FOLLOWER_KEY ?? '';
  const fSec = process.env.DELTA_FOLLOWER_SECRET ?? '';
  if (!email || !lKey || !lSec || !fKey || !fSec) {
    console.error('Set OWNER_EMAIL, DELTA_LEADER_KEY/SECRET, DELTA_FOLLOWER_KEY/SECRET');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user with email ${email} — register in the app first.`);

  // Verify both keys against the exchange before storing.
  const [lInfo, fInfo] = await Promise.all([
    deltaIndia.verify({ apiKey: lKey, apiSecret: lSec }),
    deltaIndia.verify({ apiKey: fKey, apiSecret: fSec }),
  ]);
  console.log('leader equity', lInfo.equityUsd, '| follower equity', fInfo.equityUsd);

  const leaderCred = await prisma.exchangeCredential.create({
    data: {
      userId: user.id, exchange: 'DELTA_INDIA', label: 'Test Leader',
      apiKeyEnc: encryptSecret(lKey), apiSecretEnc: encryptSecret(lSec), keyLast4: last4(lKey),
      apiKeyFingerprint: fingerprintApiKey('DELTA_INDIA', lKey),
      baseCurrency: lInfo.baseCurrency, status: 'ACTIVE', verifiedAt: new Date(),
    },
  });
  const followerCred = await prisma.exchangeCredential.create({
    data: {
      userId: user.id, exchange: 'DELTA_INDIA', label: 'Test Follower',
      apiKeyEnc: encryptSecret(fKey), apiSecretEnc: encryptSecret(fSec), keyLast4: last4(fKey),
      apiKeyFingerprint: fingerprintApiKey('DELTA_INDIA', fKey),
      baseCurrency: fInfo.baseCurrency, status: 'ACTIVE', verifiedAt: new Date(),
    },
  });

  const leader = await prisma.leader.create({
    data: {
      userId: user.id, credentialId: leaderCred.id, exchange: 'DELTA_INDIA',
      displayName: 'Test Leader', status: 'VERIFIED',
    },
  });

  const follow = await prisma.follow.create({
    data: {
      followerUserId: user.id, leaderId: leader.id, credentialId: followerCred.id,
      sizingMode: 'PROPORTIONAL', sizingValue: 1, status: 'ACTIVE',
    },
  });

  console.log('✅ scenario ready:', { leaderId: leader.id, followId: follow.id });
  console.log('Now run the engine and place a trade on the LEADER account.');
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
