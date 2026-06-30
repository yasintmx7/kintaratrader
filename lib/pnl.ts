// ─── P&L enrichment and calculation ───────────────────────────────────────────

import type { Transfer, EnrichedTransfer, PnlSummary } from '../types';

export function enrichTransfers(
  transfers: Transfer[],
  priceMap: Record<string, number | null>,
  currentPriceUsd: number | null,
): EnrichedTransfer[] {
  return transfers.map((t) => {
    const day = t.date.slice(0, 10); // YYYY-MM-DD
    const hp   = priceMap[day];

    if (hp != null && hp > 0) {
      return {
        ...t,
        kinsPriceAtTx: hp,
        txUsdValue:    t.amount * hp,
        priceSource:   'historical' as const,
      };
    }

    // Fall back to current price (less accurate, labelled accordingly)
    if (currentPriceUsd != null && currentPriceUsd > 0) {
      return {
        ...t,
        kinsPriceAtTx: currentPriceUsd,
        txUsdValue:    t.amount * currentPriceUsd,
        priceSource:   'current' as const,
      };
    }

    return {
      ...t,
      kinsPriceAtTx: null,
      txUsdValue:    null,
      priceSource:   'unavailable' as const,
    };
  });
}

export function calculatePnl(
  transfers: EnrichedTransfer[],
  currentPriceUsd: number | null,
): PnlSummary {
  const buys  = transfers.filter((t) => t.direction === 'in');
  const sells = transfers.filter((t) => t.direction === 'out');

  const totalBuyKins  = buys.reduce((s, t) => s + t.amount, 0);
  const totalSellKins = sells.reduce((s, t) => s + t.amount, 0);
  const netKins       = totalBuyKins - totalSellKins;

  const hasHistoricalPrices = transfers.some((t) => t.priceSource === 'historical');
  const hasPrices = transfers.some((t) => t.priceSource !== 'unavailable');

  const totalBuyUsd = hasPrices
    ? buys.reduce((s, t) => s + (t.txUsdValue ?? 0), 0)
    : null;

  const totalSellUsd = hasPrices
    ? sells.reduce((s, t) => s + (t.txUsdValue ?? 0), 0)
    : null;

  const realizedProfitUsd =
    totalSellUsd != null && totalBuyUsd != null
      ? totalSellUsd - totalBuyUsd
      : null;

  const roiPercent =
    realizedProfitUsd != null && totalBuyUsd != null && totalBuyUsd > 0
      ? (realizedProfitUsd / totalBuyUsd) * 100
      : null;

  const currentHoldingUsd =
    netKins !== 0 && currentPriceUsd != null
      ? netKins * currentPriceUsd
      : null;

  return {
    totalBuyKins,  totalBuyUsd,
    totalSellKins, totalSellUsd,
    realizedProfitUsd, netKins,
    roiPercent, currentHoldingUsd,
    hasHistoricalPrices,
  };
}
