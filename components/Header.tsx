'use client';

import type { KinsPrice, Tab } from '@/types';
import { fmtKinsPrice, fmtPct, fmtAddr } from '@/lib/format';

type Props = {
  kinsPrice: KinsPrice | null;
  priceLoading: boolean;
  wallet: string;
  analysisLoaded: boolean;
  tab: Tab;
  setTab: (t: Tab) => void;
  onRefresh: () => void;
  onExport: () => void;
  onSettings: () => void;
};

import { PriceTicker } from './PriceTicker';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',       label: 'Dashboard' },
  { key: 'marketplace',    label: 'Marketplace' },
  { key: 'orders',         label: 'Active Orders' },
  { key: 'resources',      label: 'My Resources' },
  { key: 'trades',         label: 'Trades' },
  { key: 'counterparties', label: 'Counterparties' },
  { key: 'price',          label: 'Price' },
  { key: 'settings',       label: 'Settings' },
];

export function Header({
  kinsPrice, priceLoading, wallet, analysisLoaded,
  tab, setTab, onRefresh, onExport, onSettings,
}: Props) {
  const up   = (kinsPrice?.priceChange24h ?? 0) >= 0;
  const addr = wallet ? fmtAddr(wallet) : null;

  return (
    <header className="header">
      {/* ── Top Bar ── */}
      <div className="header-top">
        <div className="header-left">
          {/* Logo */}
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">
              Kintara Trader <span className="logo-accent">Ledger</span>
            </span>
          </div>

          {/* KINS Price Ticker */}
          <PriceTicker kinsPrice={kinsPrice} loading={priceLoading} />

          {/* Badges */}
          <span className="hbadge hbadge-blue">● Mainnet</span>
          <span className="hbadge hbadge-dim">🔒 Public wallet only</span>
        </div>

        <div className="header-right">
          {addr && analysisLoaded && (
            <span className="wallet-chip"
              title={wallet}
              onClick={() => { navigator.clipboard.writeText(wallet); }}
            >
              ◎ {addr}
            </span>
          )}
          {analysisLoaded && (
            <button className="hbtn" onClick={onRefresh} title="Re-scan wallet">↻</button>
          )}
          {analysisLoaded && (
            <button className="hbtn" onClick={onExport} title="Export report">⬇</button>
          )}
          <button className="hbtn hbtn-active" onClick={onSettings} title="Settings">⚙</button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="tab-bar">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab ${tab === key ? 'tab-active' : ''} ${
              !analysisLoaded && key !== 'price' && key !== 'settings' ? 'tab-disabled' : ''
            }`}
            onClick={() => setTab(key)}
            disabled={!analysisLoaded && key !== 'price' && key !== 'settings'}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
