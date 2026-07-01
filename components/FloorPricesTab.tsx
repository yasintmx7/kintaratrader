'use client';

import { useMemo } from 'react';
import { MarketplaceListing } from '@/lib/marketplace';
import { getItem } from '@/lib/items';
import { fmtUsd } from '@/lib/format';

type FloorItem = {
  itemType: string;
  itemName: string;
  emoji: string;
  color: string;
  bgColor: string;
  category: string;
  floorUsd: number | null;
  floorGold: number | null;
  totalListings: number;
  availableCount: number;
  lockedCount: number;
  lowestSeller: string;
};

export function FloorPricesTab({ listings }: { listings: MarketplaceListing[] }) {
  const floorData = useMemo(() => {
    const groups: Record<string, MarketplaceListing[]> = {};
    
    listings.forEach(l => {
      const type = l.itemType || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(l);
    });

    const items: FloorItem[] = Object.entries(groups).map(([itemType, list]) => {
      let minUsd: number | null = null;
      let minGold: number | null = null;
      let lowestSeller = 'N/A';

      // Find lowest seller & minimums
      list.forEach(l => {
        if (l.priceUsd != null) {
          if (minUsd === null || l.priceUsd < minUsd) {
            minUsd = l.priceUsd;
            if (l.currency === 'token' || l.priceGold === undefined) {
              lowestSeller = l.sellerName || 'Unknown';
            }
          }
        }
        if (l.priceGold != null && l.priceGold > 0) {
          if (minGold === null || l.priceGold < minGold) {
            minGold = l.priceGold;
            lowestSeller = l.sellerName || 'Unknown';
          }
        }
      });

      const totalListings = list.length;
      const availableCount = list.filter(l => l.status === 'available' || l.status === 'available_expired_lock').length;
      const lockedCount = list.filter(l => l.status === 'locked').length;
      
      const gameItem = getItem(list[0].itemName.toLowerCase());
      
      return {
        itemType,
        itemName: list[0].itemName,
        emoji: list[0].iconUrl || gameItem.emoji || '📦',
        color: gameItem.color || '#fff',
        bgColor: gameItem.bgColor || 'rgba(255, 255, 255, 0.05)',
        category: list[0].itemCategory || 'Unknown',
        floorUsd: minUsd,
        floorGold: minGold,
        totalListings,
        availableCount,
        lockedCount,
        lowestSeller
      };
    });

    // Sort by total listings desc
    return items.sort((a, b) => b.totalListings - a.totalListings);
  }, [listings]);

  if (listings.length === 0) {
    return (
      <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
        <h3>No Listings Loaded</h3>
        <p style={{ color: 'var(--kt-text-dim)' }}>
          Please wait for marketplace data to finish loading.
        </p>
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: '20px' }}>
      <div className="panel-head" style={{ borderBottom: '1px solid var(--kt-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <span className="panel-title">Floor Prices</span>
          <p className="panel-desc" style={{ fontSize: '12px', color: 'var(--kt-text-dim)', marginTop: '4px' }}>
            Calculated dynamic floor prices grouped by item type across all live listings.
          </p>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Item</th>
              <th>Floor USD</th>
              <th>Floor Gold</th>
              <th className="td-mono">Available</th>
              <th className="td-mono">Locked</th>
              <th className="td-mono">Total Listings</th>
              <th>Lowest Seller</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {floorData.map(f => (
              <tr key={f.itemType}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      backgroundColor: f.bgColor,
                      color: f.color,
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {f.emoji}
                    </div>
                    <span style={{ color: f.color, fontWeight: 'bold' }}>{f.itemName}</span>
                  </div>
                </td>
                <td className="td-mono" style={{ color: 'var(--kt-green)', fontWeight: 'bold' }}>
                  {f.floorUsd !== null ? fmtUsd(f.floorUsd) : '—'}
                </td>
                <td className="td-mono" style={{ color: 'var(--kt-gold)', fontWeight: 'bold' }}>
                  {f.floorGold !== null ? `${f.floorGold.toLocaleString()} Gold` : '—'}
                </td>
                <td className="td-mono" style={{ color: 'var(--kt-green)' }}>{f.availableCount}</td>
                <td className="td-mono" style={{ color: 'var(--kt-orange)' }}>{f.lockedCount}</td>
                <td className="td-mono">{f.totalListings}</td>
                <td>
                  <span className="badge-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--kt-text)' }}>
                    👤 {f.lowestSeller}
                  </span>
                </td>
                <td className="td-dim">{f.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
