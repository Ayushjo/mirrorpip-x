import { exchangeRegistry } from '@mirrorpip/exchange';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: exchangeRegistry });
}
