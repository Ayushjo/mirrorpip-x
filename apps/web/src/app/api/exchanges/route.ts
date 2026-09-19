import { exchangeRegistry } from '@belivemeguys/exchange';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: exchangeRegistry });
}
