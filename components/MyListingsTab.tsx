'use client';

import { useState, useEffect, useMemo } from 'react';
import { MarketplaceListing } from '@/lib/marketplace';
import { getItem } from '@/lib/items';
import { fmtUsd, fmtDateShort } from '@/lib/format';
import { EmptyState } from './EmptyState';
import { ListingStatusTimer } from './ListingStatusTimer';

export function MyListingsTab({ listings }: { listings: MarketplaceListing[] }) {
  const [sellerName, setSellerName] = useState('');

  useEffect(() => {
    try {
      const sn = localStorage.getItem('kins_seller_name') || '';
      setSellerName(sn);
    } catch {}
  }, []);

  const myListings = useMemo(() => {
    if (!sellerName.trim()) return [];
    return listings.filter(l => l.sellerName?.toLowerCase() === sellerName.trim().toLowerCase());
  }, [listings, sellerName]);

  const stats = useMemo(() => {
    if (myListings.length === 0) return null;

    let totalUsd = 0;
    let totalGold = 0;
    let lockedCount = 0;
    let availableCount = 0;
    let oldest: MarketplaceListing = myListings[0];
    let mostValuable: MarketplaceListing = myListings[0];

    myListings.forEach(l => {
      if (l.priceUsd != null) totalUsd += l.priceUsd;
      if (l.priceGold != null && l.currency === 'gold') totalGold += l.priceGold;
      if (l.status === 'locked') lockedCount++;
      else availableCount++;

      // Oldest listing
      if (l.createdAt && oldest.createdAt && new Date(l.createdAt).getTime() < new Date(oldest.createdAt).getTime()) {
        oldest = l;
      }
      
      // Most valuable
      const lVal = l.priceUsd || 0;
      const mVal = mostValuable.priceUsd || 0;
      if (lVal > mVal) {
        mostValuable = l;
      }
    });

    return {
      totalUsd,
      totalGold,
      lockedCount,
      availableCount,
      oldest,
      mostValuable
    };
  }, [myListings]);

  if (!sellerName.trim()) {
    return (
      <div className="panel">
        <EmptyState
          icon="👤"
          title="Marketplace Seller Name Not Set"
          body="Go to the Settings tab and set your Marketplace Seller Name (Username) to track your active sell listings."
        />
      </div>
    );
  }

  if (myListings.length === 0) {
    return (
      <div className="panel">
        <EmptyState
          icon="📋"
          title="No Active Listings Found"
          body={`We searched for active listings belonging to "${sellerName}", but found zero items.`}
          note="Make sure your username matches exactly what is displayed in the game marketplace."
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats Row */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div className="stat-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--kt-border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'block' }}>Active Listings</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>{myListings.length} items</span>
          </div>
          <div className="stat-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--kt-border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'block' }}>Total Listed Value</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginTop: '6px', color: 'var(--kt-green)' }}>{fmtUsd(stats.totalUsd)}</span>
            {stats.totalGold > 0 && <span style={{ fontSize: '12px', color: 'var(--kt-gold)' }}>+ {stats.totalGold.toLocaleString()} Gold</span>}
          </div>
          <div className="stat-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--kt-border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'block' }}>Locked / Available</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>
              <span style={{ color: 'var(--kt-orange)' }}>{stats.lockedCount}</span> / <span style={{ color: 'var(--kt-green)' }}>{stats.availableCount}</span>
            </span>
          </div>
          <div className="stat-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--kt-border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'block' }}>Most Valuable</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginTop: '6px', color: 'var(--kt-blue)' }}>{stats.mostValuable ? stats.mostValuable.itemName : '—'}</span>
            {stats.mostValuable && (
              <span style={{ fontSize: '12px', color: 'var(--kt-green)' }}>({fmtUsd(stats.mostValuable.priceUsd ?? null)})</span>
            )}
          </div>
        </div>
      )}

      {/* Listings Table */}
      <div className="panel" style={{ padding: '20px' }}>
        <div className="panel-head" style={{ borderBottom: '1px solid var(--kt-border)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <span className="panel-title">My Listings</span>
            <span className="badge-sm" style={{ marginLeft: '8px' }}>Seller: {sellerName}</span>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Item</th>
                <th className="td-mono">Quantity</th>
                <th className="td-mono">Price</th>
                <th className="td-mono">Price/Item</th>
                <th>Status</th>
                <th>Reserved By</th>
                <th>Unlock Countdown</th>
                <th className="td-mono">Listing ID</th>
                <th>Created Time</th>
              </tr>
            </thead>
            <tbody>
              {myListings.map(l => {
                const gameItem = getItem(l.itemName.toLowerCase());
                return (
                  <tr key={l.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{l.iconUrl || gameItem.emoji}</span>
                        <span style={{ color: gameItem.color, fontWeight: 'bold' }}>{l.itemName}</span>
                      </div>
                    </td>
                    <td className="td-mono">{l.quantity.toLocaleString()}</td>
                    <td className="td-mono" style={{ fontWeight: 'bold' }}>
                      {l.currency === 'token' && l.priceGold
                        ? `${l.priceGold.toLocaleString()} KINS`
                        : l.priceGold
                          ? `${l.priceGold.toLocaleString()} Gold`
                          : '—'}
                      {l.priceUsd != null && (
                        <div style={{ fontSize: '10px', color: 'var(--kt-text-dim)' }}>{fmtUsd(l.priceUsd)}</div>
                      )}
                    </td>
                    <td className="td-mono">
                      {l.currency === 'token' && l.pricePerItemGold
                        ? `${l.pricePerItemGold.toFixed(4)} KINS`
                        : l.pricePerItemGold
                          ? `${l.pricePerItemGold.toFixed(2)} Gold`
                          : '—'}
                      {l.pricePerItemUsd != null && (
                        <div style={{ fontSize: '10px', color: 'var(--kt-text-dim)' }}>{fmtUsd(l.pricePerItemUsd)}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge-sm ${
                        l.status === 'locked' ? 'badge-orange' : l.status === 'available' ? 'badge-green' : 'badge-dim'
                      }`}>
                        {l.status === 'locked' ? 'Locked' : l.status === 'available' ? 'Available' : 'Expired Lock'}
                      </span>
                    </td>
                    <td className="td-dim">{l.reservedBy || '—'}</td>
                    <td>
                      {l.status === 'locked' ? (
                        <ListingStatusTimer unlocksAt={l.unlocksAt} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="td-mono td-dim">{l.id}</td>
                    <td className="td-dim">{l.createdAt ? fmtDateShort(l.createdAt) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
