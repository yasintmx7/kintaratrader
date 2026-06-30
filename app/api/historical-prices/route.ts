import { NextRequest, NextResponse } from 'next/server';
import type { HistoricalPriceResponse, OhlcvCandle } from '@/types';

const KINS_MINT = process.env.KINS_MINT || 'Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump';

export const dynamic = 'force-dynamic';

async function getPoolAddress(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${KINS_MINT}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json() as { pairs?: any[] };
    const pairs = data.pairs ?? [];
    if (pairs.length === 0) return null;
    const best = pairs
      .sort((a, b) => (b?.liquidity?.usd ?? 0) - (a?.liquidity?.usd ?? 0))[0];
    return best?.pairAddress ?? null;
  } catch {
    return null;
  }
}

async function fetchGeckoOhlcv(poolAddress: string): Promise<OhlcvCandle[]> {
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/day?limit=366`,
      {
        cache: 'no-store',
        headers: { Accept: 'application/json', 'x-requested-with': 'kintara-ledger' },
      }
    );
    if (!res.ok) return [];

    const data = await res.json() as any;
    const raw: [number, number, number, number, number, number][] =
      data?.data?.attributes?.ohlcv_list ?? [];

    return raw.map(([ts, o, h, l, c, v]) => ({
      date:   new Date(ts * 1000).toISOString().slice(0, 10),
      open:   o, high: h, low: l, close: c, volume: v,
    }));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { dates } = (await req.json()) as { dates: string[] };

    if (!dates || dates.length === 0) {
      return NextResponse.json({ priceMap: {}, ohlcv: [] } satisfies HistoricalPriceResponse);
    }

    const poolAddress = await getPoolAddress();
    if (!poolAddress) {
      return NextResponse.json({ priceMap: {}, ohlcv: [] } satisfies HistoricalPriceResponse);
    }

    const ohlcv = await fetchGeckoOhlcv(poolAddress);

    // Build date→close map
    const candleMap: Record<string, number> = {};
    for (const c of ohlcv) {
      candleMap[c.date] = c.close;
    }

    // Match each requested date (exact first, then nearest within 3 days)
    const priceMap: Record<string, number | null> = {};
    for (const date of dates) {
      if (candleMap[date] != null) {
        priceMap[date] = candleMap[date];
        continue;
      }
      let closest: number | null = null;
      let minDiff = Infinity;
      const targetMs = new Date(date).getTime();
      for (const [d, price] of Object.entries(candleMap)) {
        const diff = Math.abs(new Date(d).getTime() - targetMs);
        if (diff < minDiff && diff <= 3 * 86_400_000) {
          minDiff = diff;
          closest = price;
        }
      }
      priceMap[date] = closest;
    }

    return NextResponse.json({ priceMap, ohlcv } satisfies HistoricalPriceResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch historical prices';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
