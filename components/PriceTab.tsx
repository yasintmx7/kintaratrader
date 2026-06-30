'use client';

import type { KinsPrice, OhlcvCandle } from '@/types';
import { PriceChart } from './Charts';
import { fmtKinsPrice, fmtUsdCompact, fmtPct, fmtDate } from '@/lib/format';

const KINS_MINT = 'Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump';

export function PriceTab({
  kinsPrice, ohlcv, priceLoading,
}: {
  kinsPrice: KinsPrice | null;
  ohlcv: OhlcvCandle[];
  priceLoading: boolean;
}) {
  if (priceLoading) {
    return (
      <div className="panel">
        <div className="panel-head"><span className="panel-title">KINS Price</span></div>
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--t2)' }}>
          Loading price data…
        </div>
      </div>
    );
  }

  if (!kinsPrice) {
    return (
      <div className="panel">
        <div className="panel-head"><span className="panel-title">KINS Price</span></div>
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--t2)' }}>
          Price data unavailable. DexScreener may not have data for this token.
        </div>
      </div>
    );
  }

  const up = kinsPrice.priceChange24h >= 0;

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">$KINS Price</span>
        <span className={`badge-sm ${up ? 'badge-green' : 'badge-red'}`}>
          {fmtPct(kinsPrice.priceChange24h)} 24h
        </span>
      </div>

      {/* Price hero */}
      <div className="price-hero">
        <div className="price-hero-main">
          <span className="price-big">{fmtKinsPrice(kinsPrice.priceUsd)}</span>
          <span className={`price-chg ${up ? 'td-green' : 'td-red'}`}>
            {up ? '▲' : '▼'} {fmtPct(kinsPrice.priceChange24h)}
          </span>
        </div>
        <div className="price-meta">
          <div>
            <span className="pm-label">Volume 24h</span>
            <span className="pm-val">{fmtUsdCompact(kinsPrice.volume24h)}</span>
          </div>
          <div>
            <span className="pm-label">Liquidity</span>
            <span className="pm-val">{fmtUsdCompact(kinsPrice.liquidityUsd)}</span>
          </div>
          <div>
            <span className="pm-label">FDV</span>
            <span className="pm-val">{fmtUsdCompact(kinsPrice.fdv)}</span>
          </div>
          {kinsPrice.marketCap != null && (
            <div>
              <span className="pm-label">Market Cap</span>
              <span className="pm-val">{fmtUsdCompact(kinsPrice.marketCap)}</span>
            </div>
          )}
          <div>
            <span className="pm-label">DEX</span>
            <span className="pm-val" style={{ textTransform: 'capitalize' }}>{kinsPrice.dexId}</span>
          </div>
          <div>
            <span className="pm-label">Last Updated</span>
            <span className="pm-val">{fmtDate(kinsPrice.lastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* Price chart */}
      <div style={{ padding: '4px 16px 16px' }}>
        <div className="chart-label">90-Day Price History (daily close)</div>
        <PriceChart ohlcv={ohlcv} />
      </div>

      {/* Links */}
      <div className="price-links">
        <a className="price-link" href={kinsPrice.pairUrl} target="_blank" rel="noreferrer">
          DexScreener ↗
        </a>
        <a
          className="price-link"
          href={`https://solscan.io/token/${KINS_MINT}`}
          target="_blank" rel="noreferrer"
        >
          Token on Solscan ↗
        </a>
        <span className="price-link-sub">
          Mint: {KINS_MINT.slice(0, 10)}…{KINS_MINT.slice(-5)}
        </span>
      </div>
    </div>
  );
}
