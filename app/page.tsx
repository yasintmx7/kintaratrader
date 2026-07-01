'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Analysis, EnrichedTransfer, KinsPrice, OhlcvCandle, PnlSummary, Tab } from '@/types';
import { enrichTransfers, calculatePnl } from '@/lib/pnl';
import { buildReportText, exportSummaryJson, exportTradesCsv } from '@/lib/export';
import { fmtKins, fmtUsd, fmtPct, fmtKinsPrice, fmtDateShort } from '@/lib/format';

import { Header }            from '@/components/Header';
import { MetricCard }        from '@/components/MetricCard';
import { TradeTable }        from '@/components/TradeTable';
import { CounterpartyTable } from '@/components/CounterpartyTable';
import { ResourceTable }     from '@/components/ResourceTable';
import { ActiveOrdersTab }   from '@/components/ActiveOrdersTab';
import { PriceTab }          from '@/components/PriceTab';
import { SettingsPanel }     from '@/components/SettingsPanel';
import { EmptyState }        from '@/components/EmptyState';
import { DailyChart, BuySellSummaryChart, CumulativePnlChart } from '@/components/Charts';
import { AppShell }          from '@/components/AppShell';
import { MarketplaceGrid }   from '@/components/MarketplaceGrid';
import { ActiveOrdersTable } from '@/components/ActiveOrdersTable';
import { LoadingSkeleton }   from '@/components/LoadingSkeleton';
import type { MarketplaceListing } from '@/lib/marketplace';

// New tab imports
import { FloorPricesTab }    from '@/components/FloorPricesTab';
import { WatchlistTab }      from '@/components/WatchlistTab';
import { MyListingsTab }     from '@/components/MyListingsTab';
import { ActivityTab }       from '@/components/ActivityTab';
import { ItemsTab }          from '@/components/ItemsTab';

/* ─── Data fetching helpers ─────────────────────────────────────────────── */

async function fetchAnalysis(wallet: string, maxPages: number, customCounterparties: string[]): Promise<Analysis> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, maxPages, customCounterparties }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Analysis failed');
  return json as Analysis;
}

async function fetchKinsPrice(): Promise<KinsPrice | null> {
  try {
    const res = await fetch('/api/kins-price');
    if (!res.ok) return null;
    const json = await res.json();
    return json.error ? null : (json as KinsPrice);
  } catch { return null; }
}

async function fetchHistoricalPrices(
  dates: string[]
): Promise<{ priceMap: Record<string, number | null>; ohlcv: OhlcvCandle[] }> {
  try {
    const res = await fetch('/api/historical-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates }),
    });
    if (!res.ok) return { priceMap: {}, ohlcv: [] };
    const json = await res.json();
    return json;
  } catch { return { priceMap: {}, ohlcv: [] }; }
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function Home() {
  /* UI state */
  const [tab, setTab]         = useState<Tab>('marketplace');
  const [subTab, setSubTab]   = useState<'overview' | 'trades' | 'resources' | 'counterparties'>('overview');
  const [wallet, setWallet]   = useState('');
  const [maxPages, setMaxPages] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* Price state */
  const [kinsPrice,    setKinsPrice]    = useState<KinsPrice | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);

  /* Analysis state */
  const [analysis,  setAnalysis]  = useState<Analysis | null>(null);
  const [enriched,  setEnriched]  = useState<EnrichedTransfer[]>([]);
  const [pnl,       setPnl]       = useState<PnlSummary | null>(null);
  const [ohlcv,     setOhlcv]     = useState<OhlcvCandle[]>([]);

  /* Marketplace State */
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myOrders, setMyOrders] = useState<MarketplaceListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  /* Price alerts and auto-refresh state */
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [alertPrice,  setAlertPrice]  = useState<number | null>(null);
  const [alertType,   setAlertType]   = useState<'above' | 'below' | 'none'>('none');
  const [alertTriggered, setAlertTriggered] = useState(false);

  const refreshListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const r = await fetch('/api/marketplace/listings?limit=200');
      const d = await r.json();
      if (d.listings) {
        setListings(d.listings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  /* Fetch price on mount */
  useEffect(() => {
    fetchKinsPrice().then((p) => { setKinsPrice(p); setPriceLoading(false); });
    
    // Fetch marketplace listings in background
    refreshListings();

    // Load price alerts and refresh settings
    try {
      const ar = localStorage.getItem('kins_auto_refresh') === 'true';
      setAutoRefresh(ar);
      const ap = localStorage.getItem('kins_alert_price');
      if (ap) setAlertPrice(Number(ap));
      const at = localStorage.getItem('kins_alert_type') as any;
      if (at) setAlertType(at);
    } catch {}
  }, [refreshListings]);

  /* Auto-refresh live price */
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      const freshPrice = await fetchKinsPrice();
      if (freshPrice) {
        setKinsPrice(freshPrice);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  /* Evaluate price alerts */
  useEffect(() => {
    if (!kinsPrice || alertType === 'none' || !alertPrice) {
      setAlertTriggered(false);
      return;
    }
    const current = kinsPrice.priceUsd;
    const isTriggered =
      alertType === 'above' ? current >= alertPrice : current <= alertPrice;
    setAlertTriggered(isTriggered);
  }, [kinsPrice, alertPrice, alertType]);

  /* ── Analyze ── */
  const analyze = useCallback(async (w = wallet, forceRefresh = false) => {
    const trimmed = w.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');

    // Fetch custom counterparties list
    let customCounterparties: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kins_custom_counterparties');
        if (stored) {
          customCounterparties = stored
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean);
        }
      } catch {}
    }

    const cacheKey = `kins_cache_${trimmed}_${maxPages}_${customCounterparties.join(',')}`;

    if (!forceRefresh && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          if (age < 5 * 60 * 1000) { // 5 minutes cache
            setAnalysis(parsed.analysis);
            setEnriched(parsed.enriched);
            setPnl(parsed.pnl);
            setOhlcv(parsed.ohlcv);
            setMyOrders(parsed.myOrders);
            if (parsed.kinsPrice) setKinsPrice(parsed.kinsPrice);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }

    setAnalysis(null);
    setEnriched([]);
    setPnl(null);
    setOhlcv([]);
    setTab('wallet');

    try {
      /* 1. Fetch analysis + current price in parallel */
      const [rawAnalysis, freshPrice] = await Promise.all([
        fetchAnalysis(trimmed, maxPages, customCounterparties),
        fetchKinsPrice(),
      ]);
      if (freshPrice) setKinsPrice(freshPrice);

      /* 2. Extract unique transaction dates */
      const uniqueDates = [...new Set(rawAnalysis.transfers.map((t) => t.date.slice(0, 10)))];

      /* 3. Fetch historical prices (+ price chart OHLCV) */
      const { priceMap, ohlcv: candleData } = await fetchHistoricalPrices(uniqueDates);
      setOhlcv(candleData);

      /* 4. Enrich transfers with USD values */
      const enrichedTx = enrichTransfers(
        rawAnalysis.transfers, priceMap, freshPrice?.priceUsd ?? null
      );

      /* 5. Calculate P/L */
      const pnlResult = calculatePnl(enrichedTx, freshPrice?.priceUsd ?? null);

      /* 6. Fetch Active Orders */
      let ordersData: any[] = [];
      try {
        const sellerName = typeof window !== 'undefined' ? localStorage.getItem('kins_seller_name') || '' : '';
        const r = await fetch('/api/marketplace/my-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: trimmed, sellerName })
        });
        const d = await r.json();
        ordersData = d.orders || [];
      } catch {}
      setMyOrders(ordersData);

      setAnalysis(rawAnalysis);
      setEnriched(enrichedTx);
      setPnl(pnlResult);

      // Save to cache
      if (typeof window !== 'undefined') {
        try {
          const sellerName = localStorage.getItem('kins_seller_name') || '';
          if (sellerName) {
            const mappingStr = localStorage.getItem('kins_wallet_to_seller') || '{}';
            const mapping = JSON.parse(mappingStr);
            mapping[trimmed.toLowerCase()] = sellerName;
            localStorage.setItem('kins_wallet_to_seller', JSON.stringify(mapping));
          }
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now(),
              analysis: rawAnalysis,
              enriched: enrichedTx,
              pnl: pnlResult,
              ohlcv: candleData,
              myOrders: ordersData,
              kinsPrice: freshPrice,
            })
          );
        } catch {}
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [wallet, maxPages]);

  /* ── Export handlers ── */
  function handleExport() {
    if (!analysis || !pnl) return;
    exportSummaryJson(analysis, pnl, kinsPrice);
  }

  function handleCopyReport() {
    if (!analysis || !pnl) return;
    const text = buildReportText(analysis, pnl, kinsPrice);
    navigator.clipboard.writeText(text);
  }

  function reset() {
    setAnalysis(null); setEnriched([]); setPnl(null); setOhlcv([]);
    setError(''); setTab('marketplace');
  }

  const s = analysis?.summary;

  /* ── Derived metrics ── */
  const bestTrade  = enriched.length > 0
    ? enriched.reduce((b, t) => (t.txUsdValue ?? 0) > (b.txUsdValue ?? 0) ? t : b, enriched[0])
    : null;
  const biggestBuyTx = enriched.filter((t) => t.direction === 'in').length > 0
    ? enriched.filter((t) => t.direction === 'in')
        .reduce((w, t) => (t.txUsdValue ?? 0) > (w.txUsdValue ?? 0) ? t : w,
          enriched.filter((t) => t.direction === 'in')[0])
    : null;
  const lastTx = enriched.length > 0
    ? enriched.reduce((l, t) => t.timestamp > l.timestamp ? t : l, enriched[0])
    : null;

  // Compute live stats for header
  const goldFloor = useMemo(() => {
    let minGold: number | null = null;
    listings.forEach(l => {
      if (l.currency === 'gold' && l.priceGold != null && l.priceGold > 0) {
        if (minGold === null || l.priceGold < minGold) {
          minGold = l.priceGold;
        }
      }
    });
    return minGold;
  }, [listings]);

  const liveCount = listings.length;
  const availableCount = useMemo(() => listings.filter(l => l.status === 'available' || l.status === 'available_expired_lock').length, [listings]);
  const lockedCount = useMemo(() => listings.filter(l => l.status === 'locked').length, [listings]);

  return (
    <AppShell>
      {/* ─── Header ─── */}
      <Header
        kinsPrice={kinsPrice}
        priceLoading={priceLoading}
        wallet={wallet}
        tab={tab}
        setTab={setTab}
        onRefresh={refreshListings}
        onSettings={() => setTab('settings')}
        goldFloor={goldFloor}
        liveCount={liveCount}
        availableCount={availableCount}
        lockedCount={lockedCount}
        loadingListings={loadingListings}
      />

      {alertTriggered && kinsPrice && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          borderBottom: '1px solid #ef4444',
          color: '#ef4444',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px'
        }}>
          🚨 PRICE ALERT TRIGGERED: KINS price is ${kinsPrice.priceUsd.toFixed(8)} (target: {alertType === 'above' ? '>=' : '<='} ${alertPrice})
        </div>
      )}

      <main className="main">
        
        {/* ══ MARKETPLACE ══ */}
        {tab === 'marketplace' && (
          <MarketplaceGrid listings={listings} kinsPrice={kinsPrice} onRefresh={refreshListings} loading={loadingListings} />
        )}

        {/* ══ FLOOR PRICES ══ */}
        {tab === 'floor' && (
          <FloorPricesTab listings={listings} />
        )}

        {/* ══ WATCHLIST ══ */}
        {tab === 'watchlist' && (
          <WatchlistTab listings={listings} />
        )}

        {/* ══ MY LISTINGS ══ */}
        {tab === 'mylistings' && (
          <MyListingsTab listings={listings} />
        )}

        {/* ══ ACTIVITY ══ */}
        {tab === 'activity' && (
          <ActivityTab />
        )}

        {/* ══ ITEMS REGISTRY ══ */}
        {tab === 'items' && (
          <ItemsTab />
        )}

        {/* ══ SETTINGS ══ */}
        {tab === 'settings' && (
          <SettingsPanel
            maxPages={maxPages}
            setMaxPages={setMaxPages}
            kinsMint={analysis?.kinsMint || 'Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump'}
            filtered={analysis?.filteredByMarketplaceCounterparties || false}
            kinsPrice={kinsPrice}
            wallet={wallet}
          />
        )}

        {/* ══ WALLET P/L ══ */}
        {tab === 'wallet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Wallet Input */}
            <div className="wallet-card">
              <div className="wc-text">
                <div className="wc-eyebrow">Kintara Analytics</div>
                <h1 className="wc-title">
                  KINS Wallet<br/>
                  <span className="wc-accent">P/L Ledger</span>
                </h1>
                <p className="wc-desc">
                  Scan any Solana wallet for $KINS trading history — buys, sells, net P/L,
                  historical USD values, and counterparty breakdown. No seed phrase required.
                </p>
              </div>

              <div className="wc-form">
                <div className="input-row">
                  <div className="input-wrap">
                    <span className="input-ico">◎</span>
                    <input
                      id="wallet-input"
                      className="wallet-input"
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value)}
                      placeholder="Paste Solana wallet address…"
                      onKeyDown={(e) => e.key === 'Enter' && !loading && analyze()}
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>
                  <input
                    className="pages-input"
                    type="number" min={1} max={50}
                    value={maxPages}
                    onChange={(e) => setMaxPages(Math.min(50, Math.max(1, Number(e.target.value))))}
                    title="Pages to scan (max 50)"
                  />
                </div>

                <div className="btn-row">
                  <button
                    id="analyze-btn"
                    className="btn btn-primary"
                    onClick={() => analyze()}
                    disabled={loading || !wallet.trim()}
                  >
                    {loading
                      ? <><span className="spinner" />Scanning…</>
                      : '⚡ Analyze Wallet'
                    }
                  </button>

                  {analysis && (
                    <>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => exportTradesCsv(enriched, wallet)}>⬇ CSV</button>
                      <button className="btn btn-ghost btn-sm" onClick={handleExport}>⬇ JSON</button>
                      <button className="btn btn-ghost btn-sm" onClick={handleCopyReport}>⎘ Copy</button>
                      <button className="btn btn-danger btn-sm" onClick={reset}>✕ Reset</button>
                    </>
                  )}
                </div>

                {analysis && (
                  <div className="wc-meta">
                    <span className="wc-dot" />
                    <span>{s!.totalTransfersChecked} txs scanned</span>
                    <span className="wc-sep">·</span>
                    <span>{s!.kinsTransfers} KINS transfers</span>
                    <span className="wc-sep">·</span>
                    <span>
                      {pnl?.hasHistoricalPrices
                        ? '📊 Historical USD prices'
                        : pnl?.totalBuyUsd != null
                          ? '⚡ Current price (historical unavailable)'
                          : '⚠ Price unavailable'}
                    </span>
                    {analysis.filteredByMarketplaceCounterparties && (
                      <>
                        <span className="wc-sep">·</span>
                        <span>Marketplace filter active</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="error-box">
                <span className="err-ico">⚠</span>
                <div>
                  <div className="err-title">Analysis Failed</div>
                  <div className="err-body">{error}</div>
                </div>
              </div>
            )}

            {loading && <LoadingSkeleton />}

            {analysis && pnl && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* subTabs controls */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--kt-border)', paddingBottom: '10px' }}>
                  {(['overview', 'trades', 'resources', 'counterparties'] as const).map(k => (
                    <button
                      key={k}
                      className={`btn btn-sm ${subTab === k ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setSubTab(k)}
                      style={{
                        padding: '6px 14px',
                        textTransform: 'capitalize',
                        borderRadius: '6px'
                      }}
                    >
                      {k === 'overview' ? 'P/L Overview' : k === 'resources' ? 'My Resources' : k}
                    </button>
                  ))}
                </div>

                {/* SubTab Content */}
                {subTab === 'overview' && (
                  <>
                    <div className="metrics-grid">
                      <MetricCard label="KINS Price"
                        value={kinsPrice ? fmtKinsPrice(kinsPrice.priceUsd) : '—'}
                        sub="Current market price via DexScreener"
                        color="blue" />
                      <MetricCard label="Total Buy / Received"
                        value={fmtKins(pnl.totalBuyKins, 2) + ' KINS'}
                        usd={fmtUsd(pnl.totalBuyUsd)}
                        sub={`${s!.buyCount} incoming transfers`}
                        color="green" />
                      <MetricCard label="Total Sell / Sent"
                        value={fmtKins(pnl.totalSellKins, 2) + ' KINS'}
                        usd={fmtUsd(pnl.totalSellUsd)}
                        sub={`${s!.sellCount} outgoing transfers`}
                        color="red" />
                      <MetricCard label="Realized P/L"
                        value={fmtUsd(pnl.realizedProfitUsd)}
                        sub={`ROI: ${fmtPct(pnl.roiPercent)}`}
                        color={pnl.realizedProfitUsd == null ? 'default' : pnl.realizedProfitUsd >= 0 ? 'green' : 'red'} />
                      <MetricCard label="Net KINS"
                        value={`${pnl.netKins >= 0 ? '+' : ''}${fmtKins(pnl.netKins, 4)}`}
                        usd={fmtUsd(pnl.currentHoldingUsd)}
                        sub="Received minus spent"
                        color={pnl.netKins >= 0 ? 'green' : 'red'} />
                      <MetricCard label="ROI %"
                        value={fmtPct(pnl.roiPercent)}
                        sub="Realized return on investment"
                        color={pnl.roiPercent == null ? 'default' : pnl.roiPercent >= 0 ? 'green' : 'red'} />
                      <MetricCard label="Best Trade"
                        value={bestTrade ? fmtUsd(bestTrade.txUsdValue) : '—'}
                        sub={bestTrade ? fmtDateShort(bestTrade.date) : 'No data'}
                        color="green" />
                      <MetricCard label="Biggest Buy"
                        value={biggestBuyTx ? fmtKins(biggestBuyTx.amount, 2) + ' K' : '—'}
                        usd={biggestBuyTx ? fmtUsd(biggestBuyTx.txUsdValue) : undefined}
                        color="green" />
                      <MetricCard label="Last Activity"
                        value={lastTx ? fmtDateShort(lastTx.date) : '—'}
                        sub={lastTx ? (lastTx.direction === 'in' ? '↓ Buy/In' : '↑ Sell/Out') : ''}
                        color="blue" />
                    </div>

                    {s!.kinsTransfers > 0 && (
                      <div className="charts-row">
                        <div className="chart-box">
                          <div className="chart-label">Buy vs Sell Total</div>
                          <BuySellSummaryChart pnl={pnl} />
                        </div>
                        <div className="chart-box">
                          <div className="chart-label">Daily Activity (last 45 days)</div>
                          <DailyChart transfers={enriched} />
                        </div>
                      </div>
                    )}

                    {enriched.some((t) => t.txUsdValue != null) && (
                      <div className="panel" style={{ marginBottom: 12 }}>
                        <div className="panel-head">
                          <span className="panel-title">Cumulative P/L</span>
                          <span className="badge-sm badge-blue">USD</span>
                        </div>
                        <div style={{ padding: '4px 14px 14px' }}>
                          <CumulativePnlChart transfers={enriched} />
                        </div>
                      </div>
                    )}

                    {s!.kinsTransfers === 0 && (
                      <div className="panel">
                        <EmptyState
                          icon="🔍"
                          title="No KINS transfers found"
                          body="This wallet has no $KINS token transfers in the scanned range. Try increasing pages to scan or verify the wallet address."
                          note={`KINS Mint: Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump`}
                        />
                      </div>
                    )}
                  </>
                )}

                {subTab === 'trades' && (
                  <TradeTable transfers={enriched} wallet={wallet} />
                )}

                {subTab === 'resources' && (
                  <ResourceTable transfers={enriched} wallet={wallet} />
                )}

                {subTab === 'counterparties' && (
                  analysis.counterparties.length === 0 ? (
                    <div className="panel">
                      <EmptyState icon="🔍" title="No counterparties found" body="No KINS transfers with counterparty data." />
                    </div>
                  ) : (
                    <CounterpartyTable
                      counterparties={analysis.counterparties}
                      currentPrice={kinsPrice?.priceUsd ?? null}
                    />
                  )
                )}
              </div>
            )}

            {!analysis && !loading && (
              <div className="overview-empty">
                <div className="oe-glyph">◈</div>
                <div className="oe-title">Paste a wallet address to begin</div>
                <p className="oe-sub">
                  Read-only analysis of KINS token transfers on Solana.
                  No seed phrase or private key required. Powered by Helius + DexScreener.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Kintara Trader Ledger</span>
        <span className="footer-sep">·</span>
        <span>Helius Enhanced API</span>
        <span className="footer-sep">·</span>
        <span>DexScreener + GeckoTerminal prices</span>
        <span className="footer-sep">·</span>
        <span>Read-only · No private keys</span>
      </footer>
    </AppShell>
  );
}
