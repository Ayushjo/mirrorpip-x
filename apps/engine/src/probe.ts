import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import WebSocket from 'ws';
import { createHmac } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../../.env') });

import { deltaIndia } from '@belivemeguys/exchange';

/**
 * Delta testnet connectivity probe. Run once you have a TESTNET api key:
 *
 *   DELTA_TEST_KEY=xxx DELTA_TEST_SECRET=yyy pnpm --filter @belivemeguys/engine probe
 *
 * It (1) reads your balances + positions via the signed REST adapter, (2) fetches
 * a public mark price, and (3) opens the private WebSocket and DUMPS RAW messages
 * for ~30s so we can confirm the exact `user_trades` fill payload shape. Place a
 * small trade on the account while it runs to see a fill arrive.
 */
const REST = process.env.DELTA_REST_URL ?? 'https://cdn-ind.testnet.deltaex.org';
const WS = process.env.DELTA_WS_URL ?? 'wss://socket-ind.testnet.deltaex.org';
const apiKey = process.env.DELTA_TEST_KEY ?? '';
const apiSecret = process.env.DELTA_TEST_SECRET ?? '';
const sampleSymbol = process.env.DELTA_TEST_SYMBOL ?? 'BTCUSD';

function line(s: string) {
  console.log(`\n=== ${s} ===`);
}

async function main() {
  if (!apiKey || !apiSecret) {
    console.error('Set DELTA_TEST_KEY and DELTA_TEST_SECRET (testnet keys) in env first.');
    process.exit(1);
  }
  console.log(`REST=${REST}\nWS=${WS}`);

  line('1. verify + balances (signed REST)');
  try {
    console.log(await deltaIndia.verify({ apiKey, apiSecret }));
  } catch (err) {
    console.error('verify failed:', String(err));
  }

  line('2. open positions');
  try {
    console.log(await deltaIndia.getPositions({ apiKey, apiSecret }));
  } catch (err) {
    console.error('positions failed:', String(err));
  }

  line(`3. public mark price for ${sampleSymbol}`);
  try {
    console.log(await deltaIndia.getMarkPrice(sampleSymbol));
  } catch (err) {
    console.error('mark price failed:', String(err));
  }

  line('4. RAW WebSocket dump (30s) — place a small trade to see a fill');
  const ws = new WebSocket(WS, { headers: { 'User-Agent': 'belivemeguys-probe/0.1' } });
  ws.on('open', () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac('sha256', apiSecret).update('GET' + ts + '/live').digest('hex');
    ws.send(JSON.stringify({ type: 'auth', payload: { 'api-key': apiKey, signature, timestamp: ts } }));
    console.log('WS open — sent auth, waiting for Authenticated before subscribing…');
  });
  ws.on('message', (raw: WebSocket.RawData) => {
    const text = raw.toString();
    console.log('WS <<', text);
    // Subscribe to private channels only AFTER auth is confirmed.
    if (text.includes('"Authenticated"')) {
      ws.send(JSON.stringify({ type: 'subscribe', payload: { channels: [{ name: 'v2/user_trades', symbols: ['all'] }] } }));
      ws.send(JSON.stringify({ type: 'subscribe', payload: { channels: [{ name: 'user_trades', symbols: ['all'] }] } }));
      console.log('>> subscribed to v2/user_trades + user_trades');
    }
  });
  ws.on('error', (err) => console.error('WS error:', err.message));
  ws.on('close', () => console.log('WS closed'));

  const seconds = Number(process.env.PROBE_SECONDS ?? 30);
  setTimeout(() => {
    ws.close();
    console.log('\nProbe done.');
    process.exit(0);
  }, seconds * 1000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
