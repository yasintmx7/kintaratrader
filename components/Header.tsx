'use client';

import type { KinsPrice, Tab } from '@/types';
import { fmtKinsPrice, fmtAddr } from '@/lib/format';
import { PriceTicker } from './PriceTicker';

type Props = {
  kinsPrice: KinsPrice | null;
  priceLoading: boolean;
  wallet: string;
  tab: Tab;
  setTab: (t: Tab) => void;
  onRefresh: () => void;
  onSettings: () => void;
  goldFloor?: number | null;
  liveCount?: number;
  availableCount?: number;
  lockedCount?: number;
  loadingListings?: boolean;
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'floor',       label: 'Floor Prices' },
  { key: 'watchlist',   label: 'Watchlist' },
  { key: 'mylistings',  label: 'My Listings' },
  { key: 'wallet',      label: 'Wallet P/L' },
  { key: 'activity',    label: 'Activity' },
  { key: 'items',       label: 'Items' },
  { key: 'settings',    label: 'Settings' },
];

export function Header({
  kinsPrice, priceLoading, wallet,
  tab, setTab, onRefresh, onSettings,
  goldFloor = null, liveCount = 0, availableCount = 0, lockedCount = 0, loadingListings = false
}: Props) {
  const addr = wallet ? fmtAddr(wallet) : null;

  return (
    <header className="header" style={{ borderBottom: '1px solid var(--kt-border)', background: 'var(--kt-bg-darker)' }}>
      {/* ── Top Bar ── */}
      <div className="header-top" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Logo */}
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setTab('marketplace')}>
            <span className="logo-icon" style={{ fontSize: '24px', color: 'var(--kt-blue)' }}>◈</span>
            <span className="logo-text" style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'inherit' }}>
              Kintara Trader <span className="logo-accent" style={{ color: 'var(--kt-gold)' }}>Ledger</span>
            </span>
          </div>

          {/* KINS Price Ticker */}
          <PriceTicker kinsPrice={kinsPrice} loading={priceLoading} />
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="https://kintara.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--kt-gold)',
              color: '#000',
              fontWeight: 'bold',
              border: 'none'
            }}
          >
            🎮 Open Game
          </a>

          {addr && (
            <span className="wallet-chip"
              title={wallet}
              onClick={() => { navigator.clipboard.writeText(wallet); alert('Wallet copied!'); }}
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                border: '1px solid var(--kt-border)'
              }}
            >
              ◎ {addr}
            </span>
          )}

          <button 
            className="hbtn" 
            onClick={onRefresh} 
            title="Refresh Listings"
            disabled={loadingListings}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--kt-border)',
              borderRadius: '6px',
              color: '#fff',
              padding: '6px 10px',
              cursor: 'pointer'
            }}
          >
            {loadingListings ? '...' : '↻'}
          </button>
          
          <button 
            className="hbtn" 
            onClick={onSettings} 
            title="Settings"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--kt-border)',
              borderRadius: '6px',
              color: '#fff',
              padding: '6px 10px',
              cursor: 'pointer'
            }}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* ── Marketplace Mini Hero Stats Bar ── */}
      <div style={{
        display: 'flex',
        gap: '20px',
        padding: '8px 20px',
        background: 'rgba(0, 0, 0, 0.25)',
        borderTop: '1px solid rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.02)',
        fontSize: '11px',
        color: 'var(--kt-text-dim)',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>KINS Price:</span>
          <strong style={{ color: 'var(--kt-blue)' }}>{kinsPrice ? `$${kinsPrice.priceUsd.toFixed(8)}` : '—'}</strong>
        </div>
        <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Gold Floor:</span>
          <strong style={{ color: 'var(--kt-gold)' }}>{goldFloor ? `${goldFloor.toLocaleString()} Gold` : '—'}</strong>
        </div>
        <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Live Listings:</span>
          <strong style={{ color: 'var(--kt-text)' }}>{liveCount}</strong>
        </div>
        <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Available:</span>
          <strong style={{ color: 'var(--kt-green)' }}>{availableCount}</strong>
        </div>
        <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Locked:</span>
          <strong style={{ color: 'var(--kt-orange)' }}>{lockedCount}</strong>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="tab-bar" style={{ display: 'flex', gap: '4px', padding: '6px 20px', background: 'var(--kt-bg)' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab ${tab === key ? 'tab-active' : ''}`}
            onClick={() => setTab(key)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              border: 'none',
              background: tab === key ? 'rgba(255, 255, 255, 0.05)' : 'none',
              color: tab === key ? '#fff' : 'var(--kt-text-dim)',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: tab === key ? 'bold' : 'normal',
              transition: 'all 0.15s'
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
