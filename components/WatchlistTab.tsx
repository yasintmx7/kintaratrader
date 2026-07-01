'use client';

import { useState, useEffect, useMemo } from 'react';
import { MarketplaceListing } from '@/lib/marketplace';
import { getItem } from '@/lib/items';
import { fmtUsd } from '@/lib/format';
import { EmptyState } from './EmptyState';

export function WatchlistTab({ listings }: { listings: MarketplaceListing[] }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Record<string, number>>({});
  const [alertInputs, setAlertInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('kins_watchlist') || '[]';
      setWatchlist(JSON.parse(stored));
      const storedAlerts = localStorage.getItem('kins_watchlist_alerts') || '{}';
      setAlerts(JSON.parse(storedAlerts));
    } catch {}
  }, []);

  const handleRemove = (itemType: string) => {
    const updated = watchlist.filter(x => x !== itemType);
    setWatchlist(updated);
    try {
      localStorage.setItem('kins_watchlist', JSON.stringify(updated));
    } catch {}
  };

  const handleSetAlert = (itemType: string) => {
    const val = alertInputs[itemType];
    const num = Number(val);
    if (!val || isNaN(num) || num <= 0) return;
    
    const updatedAlerts = { ...alerts, [itemType]: num };
    setAlerts(updatedAlerts);
    try {
      localStorage.setItem('kins_watchlist_alerts', JSON.stringify(updatedAlerts));
    } catch {}
  };

  const handleClearAlert = (itemType: string) => {
    const updatedAlerts = { ...alerts };
    delete updatedAlerts[itemType];
    setAlerts(updatedAlerts);
    try {
      localStorage.setItem('kins_watchlist_alerts', JSON.stringify(updatedAlerts));
    } catch {}
  };

  const watchlistItems = useMemo(() => {
    return watchlist.map(itemType => {
      const gameItem = getItem(itemType.replace(/_/g, ' '));
      const itemListings = listings.filter(l => l.itemType?.toLowerCase() === itemType.toLowerCase());
      
      let floorUsd: number | null = null;
      let floorGold: number | null = null;
      let cheapestListing: MarketplaceListing | null = null;

      itemListings.forEach(l => {
        if (l.priceUsd != null) {
          if (floorUsd === null || l.priceUsd < floorUsd) {
            floorUsd = l.priceUsd;
            cheapestListing = l;
          }
        }
        if (l.priceGold != null && l.priceGold > 0) {
          if (floorGold === null || l.priceGold < floorGold) {
            floorGold = l.priceGold;
          }
        }
      });

      const alertPrice = alerts[itemType];
      const isTriggered = alertPrice && floorUsd !== null && floorUsd <= alertPrice;

      return {
        itemType,
        itemName: gameItem.name !== 'Unknown Item' ? gameItem.name : itemType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        emoji: gameItem.emoji || '📦',
        color: gameItem.color || '#fff',
        bgColor: gameItem.bgColor || 'rgba(255,255,255,0.05)',
        floorUsd,
        floorGold,
        listingsCount: itemListings.length,
        cheapestListing,
        alertPrice,
        isTriggered
      };
    });
  }, [watchlist, listings, alerts]);

  if (watchlist.length === 0) {
    return (
      <div className="panel">
        <EmptyState
          icon="⭐"
          title="Watchlist is Empty"
          body="Start watching items by clicking the star icon on any marketplace card or listing."
        />
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: '20px' }}>
      <div className="panel-head" style={{ borderBottom: '1px solid var(--kt-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <span className="panel-title">My Watchlist</span>
          <p className="panel-desc" style={{ fontSize: '12px', color: 'var(--kt-text-dim)', marginTop: '4px' }}>
            Monitor floors and set price drop alerts for your favorite items.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {watchlistItems.map(item => (
          <div key={item.itemType} style={{
            border: item.isTriggered ? '1px solid var(--kt-red)' : '1px solid var(--kt-border)',
            background: item.isTriggered ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                backgroundColor: item.bgColor,
                color: item.color,
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {item.emoji}
              </div>
              <div>
                <h4 style={{ color: item.color, margin: 0, fontWeight: 'bold' }}>{item.itemName}</h4>
                <div style={{ fontSize: '12px', color: 'var(--kt-text-dim)', marginTop: '4px' }}>
                  {item.listingsCount} active listings
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <span className="ips-label" style={{ display: 'block', fontSize: '11px', color: 'var(--kt-text-dim)' }}>Floor USD</span>
                <span className="td-mono" style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--kt-green)' }}>
                  {item.floorUsd !== null ? fmtUsd(item.floorUsd) : '—'}
                </span>
              </div>
              <div>
                <span className="ips-label" style={{ display: 'block', fontSize: '11px', color: 'var(--kt-text-dim)' }}>Floor Gold</span>
                <span className="td-mono" style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--kt-gold)' }}>
                  {item.floorGold ? `${Number(item.floorGold).toLocaleString()} Gold` : '—'}
                </span>
              </div>
              <div>
                <span className="ips-label" style={{ display: 'block', fontSize: '11px', color: 'var(--kt-text-dim)' }}>Cheapest</span>
                <span className="badge-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  {(item.cheapestListing as any) ? `👤 ${(item.cheapestListing as any).sellerName}` : 'N/A'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Alert Configuration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  step="any"
                  placeholder="Alert Usd Threshold"
                  className="fi fi-sm"
                  style={{ width: '100px', textAlign: 'right' }}
                  value={alertInputs[item.itemType] || ''}
                  onChange={(e) => setAlertInputs({ ...alertInputs, [item.itemType]: e.target.value })}
                />
                <button className="btn btn-sm btn-ghost" onClick={() => handleSetAlert(item.itemType)}>🔔 Set</button>
              </div>

              {item.alertPrice && (
                <div className="badge-sm" style={{
                  backgroundColor: item.isTriggered ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: item.isTriggered ? 'var(--kt-red)' : 'var(--kt-text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>Alert: &lt;= {fmtUsd(item.alertPrice)}</span>
                  <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }} onClick={() => handleClearAlert(item.itemType)}>✕</button>
                </div>
              )}

              <button className="btn btn-sm btn-danger" onClick={() => handleRemove(item.itemType)}>✕ Stop Watch</button>
            </div>

            {item.isTriggered && (
              <div style={{ width: '100%', fontSize: '12px', color: 'var(--kt-red)', marginTop: '8px', fontWeight: 'bold' }}>
                🚨 PRICE ALERT TRIGGERED! Current floor ({fmtUsd(item.floorUsd)}) is below your threshold ({fmtUsd(item.alertPrice)}).
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
