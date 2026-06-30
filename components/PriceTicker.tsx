'use client';

import { fmtKinsPrice, fmtPct } from '@/lib/format';
import type { KinsPrice } from '@/types';

export function PriceTicker({ kinsPrice, loading }: { kinsPrice: KinsPrice | null, loading: boolean }) {
  if (loading) {
    return <div className="ticker-loading">Loading price…</div>;
  }

  if (!kinsPrice) {
    return <div className="ticker-na">Price unavailable</div>;
  }

  const up = kinsPrice.priceChange24h >= 0;

  return (
    <div className="ticker">
      <span className="ticker-symbol">KINS</span>
      <span className="ticker-price">{fmtKinsPrice(kinsPrice.priceUsd)}</span>
      <span className={`ticker-chg ${up ? 'tc-green' : 'tc-red'}`}>
        {up ? '▲' : '▼'} {fmtPct(kinsPrice.priceChange24h)}
      </span>
    </div>
  );
}
