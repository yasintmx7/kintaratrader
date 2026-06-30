'use client';

import { useState, useEffect } from 'react';
import { ALL_ITEMS, getDefaultPrice } from '@/lib/items';

type Props = {
  maxPages: number;
  setMaxPages: (n: number) => void;
  kinsMint?: string;
  filtered?: boolean;
  kinsPrice?: { priceUsd: number } | null;
};

export function SettingsPanel({ maxPages, setMaxPages, kinsMint, filtered, kinsPrice }: Props) {
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [customCounterparties, setCustomCounterparties] = useState('');

  // Auto refresh & Price alerts settings state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below' | 'none'>('none');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedPrices = localStorage.getItem('kins_item_prices');
      if (storedPrices) {
        setCustomPrices(JSON.parse(storedPrices));
      }

      const storedCp = localStorage.getItem('kins_custom_counterparties');
      if (storedCp) {
        setCustomCounterparties(storedCp);
      }

      const ar = localStorage.getItem('kins_auto_refresh') === 'true';
      setAutoRefresh(ar);

      const ap = localStorage.getItem('kins_alert_price') || '';
      setAlertPrice(ap);

      const at = (localStorage.getItem('kins_alert_type') as any) || 'none';
      setAlertType(at);
    } catch {}
  }, []);

  const handlePriceChange = (itemId: string, val: string) => {
    const updated = { ...customPrices, [itemId]: val };
    setCustomPrices(updated);
    try {
      localStorage.setItem('kins_item_prices', JSON.stringify(updated));
    } catch {}
  };

  const handleCpChange = (val: string) => {
    setCustomCounterparties(val);
    try {
      localStorage.setItem('kins_custom_counterparties', val);
    } catch {}
  };

  const handleAutoRefreshToggle = (checked: boolean) => {
    setAutoRefresh(checked);
    try {
      localStorage.setItem('kins_auto_refresh', String(checked));
    } catch {}
  };

  const handleAlertPriceChange = (val: string) => {
    setAlertPrice(val);
    try {
      localStorage.setItem('kins_alert_price', val);
    } catch {}
  };

  const handleAlertTypeChange = (val: 'above' | 'below' | 'none') => {
    setAlertType(val);
    try {
      localStorage.setItem('kins_alert_type', val);
    } catch {}
  };

  const resetAll = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        localStorage.removeItem('kins_item_prices');
        localStorage.removeItem('kins_custom_counterparties');
        localStorage.removeItem('kins_auto_refresh');
        localStorage.removeItem('kins_alert_price');
        localStorage.removeItem('kins_alert_type');
        // Clear all caches too
        Object.keys(localStorage)
          .filter(k => k.startsWith('kins_cache_'))
          .forEach(k => localStorage.removeItem(k));
      } catch {}
      setCustomPrices({});
      setCustomCounterparties('');
      setAutoRefresh(false);
      setAlertPrice('');
      setAlertType('none');
      window.location.reload();
    }
  };

  const clearCache = () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('kins_cache_'))
        .forEach(k => localStorage.removeItem(k));
      alert('Local scan caches cleared successfully!');
    } catch {}
  };

  const tradeItems = ALL_ITEMS.filter(item => item.id !== 'kins');

  return (
    <div className="panel">
      <div className="panel-head" style={{ borderBottom: '1px solid var(--kt-border)', paddingBottom: '16px' }}>
        <div>
          <span className="panel-title">Dashboard Settings</span>
          <p className="panel-desc" style={{ fontSize: '12px', color: 'var(--kt-text-dim)', marginTop: '4px' }}>
            Customize scan depth, mock item values, and configure escrow/marketplace filtering.
          </p>
        </div>
        <div className="ph-right" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-ghost" onClick={clearCache}>🧹 Clear Scan Cache</button>
          <button className="btn btn-sm btn-ghost" onClick={resetAll} style={{ color: 'var(--kt-red)' }}>♻️ Reset All</button>
        </div>
      </div>

      <div className="s-rows" style={{ gap: '24px', marginTop: '20px' }}>
        {/* Scan depth */}
        <div className="s-row">
          <div className="s-label">Pages to Scan</div>
          <div className="s-desc">
            Each page fetches up to 100 parsed transactions from Helius. Max 50 pages (5,000 txs).
          </div>
          <input
            className="s-input"
            type="number" min={1} max={50}
            value={maxPages}
            onChange={(e) => setMaxPages(Math.min(50, Math.max(1, Number(e.target.value))))}
          />
        </div>

        {/* Live Pricing & Alerts */}
        <div className="s-row" style={{ borderBottom: '1px solid var(--kt-border)', paddingBottom: '24px' }}>
          <div className="s-label">Live Pricing & Price Alerts</div>
          <div className="s-desc">
            Enable KINS token price auto-refresh (every 30 seconds) and set up notifications when the KINS price threshold is met.
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => handleAutoRefreshToggle(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '500' }}>Auto-Refresh Price (30s)</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>Alert Condition:</span>
              <select
                className="fsel"
                style={{ padding: '4px 8px' }}
                value={alertType}
                onChange={(e) => handleAlertTypeChange(e.target.value as any)}
              >
                <option value="none">No Alert</option>
                <option value="above">Price reaches or goes ABOVE</option>
                <option value="below">Price reaches or goes BELOW</option>
              </select>
              <input
                type="number"
                step="any"
                className="fi fi-sm"
                style={{ width: '120px' }}
                placeholder="Target Price USD"
                value={alertPrice}
                onChange={(e) => handleAlertPriceChange(e.target.value)}
                disabled={alertType === 'none'}
              />
            </div>
          </div>
        </div>

        {/* Custom Escrow / Counterparty Addresses */}
        <div className="s-row">
          <div className="s-label">Custom Escrow / Marketplace Counterparties</div>
          <div className="s-desc">
            Enter a comma-separated list of Solana wallet or program addresses to limit the scan ONLY to these counterparties (overrides global transfers scan).
          </div>
          <textarea
            className="fi"
            style={{
              width: '100%',
              minHeight: '80px',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--kt-border)',
              borderRadius: '6px',
              color: 'var(--kt-text)',
              marginTop: '10px'
            }}
            placeholder="e.g., Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump, 5YF4..."
            value={customCounterparties}
            onChange={(e) => handleCpChange(e.target.value)}
          />
        </div>

        {/* Item Price Overrides */}
        <div className="s-row">
          <div className="s-label">Manual Kintara Item Price Overrides (KINS)</div>
          <div className="s-desc">
            Set custom KINS valuations per item/resource unit to calculate quantities and trade breakdowns.
          </div>
          <div className="tbl-wrap" style={{ marginTop: '12px', border: '1px solid var(--kt-border)', borderRadius: '6px' }}>
            <table className="tbl" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Default Price (KINS)</th>
                  <th style={{ width: '150px' }}>Custom Price Override</th>
                </tr>
              </thead>
              <tbody>
                {tradeItems.map((item) => {
                  const val = customPrices[item.id] !== undefined ? customPrices[item.id] : '';
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{item.emoji}</span>
                          <span style={{ color: item.color, fontWeight: '600' }}>{item.name}</span>
                        </div>
                      </td>
                      <td className="td-dim">{item.category}</td>
                      <td className="td-mono">{getDefaultPrice(item.id)} KINS</td>
                      <td>
                        <input
                          type="number"
                          min={0.01}
                          step="any"
                          className="fi fi-sm"
                          style={{ width: '100px', textAlign: 'right' }}
                          placeholder="Default"
                          value={val}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* KINS mint */}
        <div className="s-row">
          <div className="s-label">KINS Mint Address</div>
          <div className="s-desc">SPL token mint used to identify KINS transfers on Solana.</div>
          <code className="s-mono">{kinsMint || 'Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump'}</code>
        </div>
      </div>
    </div>
  );
}
