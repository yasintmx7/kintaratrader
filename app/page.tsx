'use client';

import { useEffect, useState, useCallback } from 'react';
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

/* ─── Data fetching helpers ─────────────────────────────────────────────── */

async function fetchAnalysis(wallet: string, maxPages: number): Promise<Analysis> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, maxPages }),
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
  const [tab, setTab]         = useState<Tab>('overview');
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

  /* Fetch price on mount */
  useEffect(() => {
    fetchKinsPrice().then((p) => { setKinsPrice(p); setPriceLoading(false); });
  }, []);

  /* ── Analyze ── */
  const analyze = useCallback(async (w = wallet) => {
    const trimmed = w.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setAnalysis(null);
    setEnriched([]);
    setPnl(null);
    setOhlcv([]);
    setTab('overview');

    try {
      /* 1. Fetch analysis + current price in parallel */
      const [rawAnalysis, freshPrice] = await Promise.all([
        fetchAnalysis(trimmed, maxPages),
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

      setAnalysis(rawAnalysis);
      setEnriched(enrichedTx);
      setPnl(pnlResult);
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
    setError(''); setTab('overview');
  }

  const s = analysis?.summary;

  /* ── Derived metrics ── */
  const bestTrade  = enriched.length > 0
    ? enriched.reduce((b, t) => (t.txUsdValue ?? 0) > (b.txUsdValue ?? 0) ? t : b, enriched[0])
    : null;
  const worstTrade = enriched.filter((t) => t.direction === 'out').length > 0
    ? enriched.filter((t) => t.direction === 'out')
        .reduce((w, t) => (t.txUsdValue ?? 0) > (w.txUsdValue ?? 0) ? t : w,
          enriched.filter((t) => t.direction === 'out')[0])
    : null;
  const lastTx = enriched.length > 0
    ? enriched.reduce((l, t) => t.timestamp > l.timestamp ? t : l, enriched[0])
    : null;

  return (
    <div className="app">
      {/* ─── Header ─── */}
      <Header
        kinsPrice={kinsPrice}
        priceLoading={priceLoading}
        wallet={wallet}
        analysisLoaded={!!analysis}
        tab={tab}
        setTab={setTab}
        onRefresh={() => analysis && analyze()}
        onExport={handleExport}
        onSettings={() => setTab('settings')}
      />

      <main className="main">
        {/* ─── Wallet Input ─── */}
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

        {/* ─── Error ─── */}
        {error && (
          <div className="error-box">
            <span className="err-ico">⚠</span>
            <div>
              <div className="err-title">Analysis Failed</div>
              <div className="err-body">{error}</div>
            </div>
          </div>
        )}

        {/* ─── Loading metric skeletons ─── */}
        {loading && (
          <div className="metrics-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <MetricCard key={i} label="" value="" loading />
            ))}
          </div>
        )}

        {/* ─── Tab content ─── */}
        {analysis && pnl && !loading && (
          <>
            {/* ══ OVERVIEW ══ */}
            {tab === 'overview' && (
              <>
                {/* Primary metrics */}
                <div className="metrics-grid">
                  <MetricCard label="KINS Price"
                    value={kinsPrice ? fmtKinsPrice(kinsPrice.priceUsd) : '—'}
                    sub={kinsPrice ? `${fmtPct(kinsPrice.priceChange24h)} 24h · via DexScreener` : 'Unavailable'}
                    color="blue" />
                  <MetricCard label="Total Buy / Spent"
                    value={fmtKins(pnl.totalBuyKins, 2) + ' KINS'}
                    usd={fmtUsd(pnl.totalBuyUsd)}
                    sub={`${s!.buyCount} outgoing transfers`}
                    color="red" />
                  <MetricCard label="Total Sell / Received"
                    value={fmtKins(pnl.totalSellKins, 2) + ' KINS'}
                    usd={fmtUsd(pnl.totalSellUsd)}
                    sub={`${s!.sellCount} incoming transfers`}
                    color="green" />
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
                  <MetricCard label="Buy Count"
                    value={String(s!.buyCount)}
                    sub="Outgoing KINS transfers"
                    color="amber" />
                  <MetricCard label="Sell Count"
                    value={String(s!.sellCount)}
                    sub="Incoming KINS transfers"
                    color="purple" />
                  <MetricCard label="Active Orders"
                    value="—"
                    sub="Marketplace API not configured"
                    color="default" />
                  <MetricCard label="Best Trade"
                    value={bestTrade ? fmtUsd(bestTrade.txUsdValue) : '—'}
                    sub={bestTrade ? fmtDateShort(bestTrade.date) : 'No data'}
                    color="green" />
                  <MetricCard label="Biggest Buy"
                    value={worstTrade ? fmtKins(worstTrade.amount, 2) + ' K' : '—'}
                    usd={worstTrade ? fmtUsd(worstTrade.txUsdValue) : undefined}
                    color="red" />
                  <MetricCard label="Last Activity"
                    value={lastTx ? fmtDateShort(lastTx.date) : '—'}
                    sub={lastTx ? (lastTx.direction === 'in' ? '↓ Sell/In' : '↑ Buy/Out') : ''}
                    color="blue" />
                </div>

                {/* Charts */}
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

                {/* Cumulative P/L chart */}
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

            {/* ══ TRADES ══ */}
            {tab === 'trades' && (
              <TradeTable transfers={enriched} wallet={wallet} />
            )}

            {/* ══ ACTIVE ORDERS ══ */}
            {tab === 'orders' && <ActiveOrdersTab wallet={wallet} />}

            {/* ══ RESOURCES ══ */}
            {tab === 'resources' && <ResourceTable />}

            {/* ══ COUNTERPARTIES ══ */}
            {tab === 'counterparties' && (
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

            {/* ══ PRICE ══ */}
            {tab === 'price' && (
              <PriceTab kinsPrice={kinsPrice} ohlcv={ohlcv} priceLoading={priceLoading} />
            )}

            {/* ══ SETTINGS ══ */}
            {tab === 'settings' && (
              <SettingsPanel
                maxPages={maxPages}
                setMaxPages={setMaxPages}
                kinsMint={analysis.kinsMint}
                filtered={analysis.filteredByMarketplaceCounterparties}
                kinsPrice={kinsPrice}
              />
            )}
          </>
        )}

        {/* ─── Price/Settings when no analysis loaded ─── */}
        {!analysis && !loading && tab === 'price' && (
          <PriceTab kinsPrice={kinsPrice} ohlcv={ohlcv} priceLoading={priceLoading} />
        )}
        {!analysis && !loading && tab === 'settings' && (
          <SettingsPanel
            maxPages={maxPages}
            setMaxPages={setMaxPages}
            filtered={false}
            kinsPrice={kinsPrice}
          />
        )}

        {/* ─── Empty state (no analysis, not loading, not price/settings) ─── */}
        {!analysis && !loading && !error && tab === 'overview' && (
          <div className="overview-empty">
            <div className="oe-glyph">◈</div>
            <div className="oe-title">Paste a wallet address to begin</div>
            <p className="oe-sub">
              Read-only analysis of KINS token transfers on Solana.
              No seed phrase or private key required. Powered by Helius + DexScreener.
            </p>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Kintara Ledger</span>
        <span className="footer-sep">·</span>
        <span>Helius Enhanced API</span>
        <span className="footer-sep">·</span>
        <span>DexScreener + GeckoTerminal prices</span>
        <span className="footer-sep">·</span>
        <span>Read-only · No private keys</span>
      </footer>
    </div>
  );
}
