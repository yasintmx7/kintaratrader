import { NextResponse } from 'next/server';
import type { KinsPrice } from '@/types';

const KINS_MINT = process.env.KINS_MINT || 'Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${KINS_MINT}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      throw new Error(`DexScreener error ${res.status}`);
    }

    const data = await res.json() as { pairs?: Record<string, unknown>[] };
    const pairs = data.pairs ?? [];

    if (pairs.length === 0) {
      return NextResponse.json(
        { error: 'No trading pairs found for KINS token on DexScreener' },
        { status: 404 }
      );
    }

    // Filter to pairs where KINS is the base token, then sort by liquidity
    const kinsPairs = pairs.filter((p: any) =>
      p?.baseToken?.address === KINS_MINT
    );
    const pool = (kinsPairs.length > 0 ? kinsPairs : pairs)
      .sort((a: any, b: any) => (b?.liquidity?.usd ?? 0) - (a?.liquidity?.usd ?? 0))[0] as any;

    const price: KinsPrice = {
      priceUsd:      parseFloat(pool.priceUsd ?? '0') || 0,
      priceNative:   String(pool.priceNative ?? '0'),
      liquidityUsd:  pool.liquidity?.usd ?? 0,
      fdv:           pool.fdv ?? 0,
      marketCap:     pool.marketCap ?? null,
      volume24h:     pool.volume?.h24 ?? 0,
      priceChange24h:pool.priceChange?.h24 ?? 0,
      dexId:         pool.dexId ?? '',
      pairAddress:   pool.pairAddress ?? '',
      pairUrl:       pool.url ?? `https://dexscreener.com/solana/${pool.pairAddress ?? ''}`,
      tokenName:     pool.baseToken?.name ?? 'Kintara',
      tokenSymbol:   pool.baseToken?.symbol ?? 'KINS',
      lastUpdated:   new Date().toISOString(),
    };

    return NextResponse.json(price);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch KINS price';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
