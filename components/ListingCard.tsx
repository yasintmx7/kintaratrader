'use client';

import { useState, useEffect } from 'react';
import { MarketplaceListing } from '@/lib/marketplace';
import { fmtKins, fmtUsd } from '@/lib/format';
import { getItem } from '@/lib/items';
import { ListingStatusTimer } from './ListingStatusTimer';

export function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('kins_watchlist') || '[]';
      const watchlist = JSON.parse(stored) as string[];
      setIsStarred(watchlist.includes(listing.itemType));
    } catch {}
  }, [listing.itemType]);

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('kins_watchlist') || '[]';
      let watchlist = JSON.parse(stored) as string[];
      if (watchlist.includes(listing.itemType)) {
        watchlist = watchlist.filter(x => x !== listing.itemType);
        setIsStarred(false);
      } else {
        watchlist.push(listing.itemType);
        setIsStarred(true);
      }
      localStorage.setItem('kins_watchlist', JSON.stringify(watchlist));
    } catch {}
  };

  const gameItem = getItem(listing.itemName.toLowerCase());
  const color = gameItem.color || '#fff';
  const bgColor = gameItem.bgColor || 'rgba(255, 255, 255, 0.05)';
  const emoji = listing.iconUrl || gameItem.emoji || '📦';
  const rarity = listing.rarity || gameItem.rarity || 'Common';

  const priceVal = listing.priceGold || 0;
  const isKins = listing.currency === 'token';

  return (
    <div className="item-preview" style={{ position: 'relative', border: isStarred ? '1px solid var(--kt-blue)' : '1px solid var(--kt-border)' }}>
      {/* Watchlist Star */}
      <button
        onClick={toggleStar}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          color: isStarred ? 'var(--kt-gold)' : 'var(--kt-text-dim)',
          fontSize: '18px',
          cursor: 'pointer',
          padding: 0,
          zIndex: 10
        }}
        title={isStarred ? "Remove from watchlist" : "Add to watchlist"}
      >
        ★
      </button>

      {/* Top Header info */}
      <div className="item-preview-top">
        <div className="item-preview-ico" style={{
          backgroundColor: bgColor,
          color: color,
          fontSize: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          width: '42px',
          height: '42px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {emoji}
        </div>
        <div style={{ marginRight: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="item-preview-name" style={{ color: color, fontWeight: 'bold' }}>{listing.itemName}</span>
            <span className="badge-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color, fontSize: '9px', fontWeight: 'bold' }}>
              {rarity}
            </span>
          </div>
          <div className="item-preview-cat">{listing.itemCategory || 'Unknown'}</div>
        </div>
      </div>

      {/* Rarity & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '8px' }}>
        <span className={`badge-sm ${
          listing.status === 'locked' ? 'badge-orange' : listing.status === 'available' ? 'badge-green' : 'badge-dim'
        }`}>
          {listing.status === 'locked' ? 'Locked' : listing.status === 'available' ? 'Available' : 'Expired Lock'}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--kt-text-dim)', fontFamily: 'monospace' }}>
          Qty: <strong style={{ color: '#fff' }}>×{listing.quantity.toLocaleString()}</strong>
        </span>
      </div>

      {/* Prices Info */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255,255,255,0.03)',
        borderRadius: '6px',
        padding: '10px',
        margin: '12px 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)' }}>Total Price</span>
          <span className="td-mono" style={{ fontWeight: 'bold', color: isKins ? 'var(--kt-blue)' : 'var(--kt-gold)' }}>
            {isKins ? `${priceVal.toLocaleString()} KINS` : `${priceVal.toLocaleString()} Gold`}
            {listing.priceUsd != null && (
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--kt-green)', textAlign: 'right', fontWeight: 'normal' }}>
                ({fmtUsd(listing.priceUsd)})
              </span>
            )}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)' }}>Unit Price</span>
          <span className="td-mono" style={{ fontSize: '11px', color: 'var(--kt-text)' }}>
            {isKins && listing.pricePerItemGold
              ? `${listing.pricePerItemGold.toFixed(4)} KINS`
              : listing.pricePerItemGold
                ? `${listing.pricePerItemGold.toFixed(2)} Gold`
                : '—'}
            {listing.pricePerItemUsd != null && (
              <span style={{ display: 'block', fontSize: '9px', color: 'var(--kt-text-dim)', textAlign: 'right' }}>
                ({fmtUsd(listing.pricePerItemUsd)})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Seller info */}
      <div style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          Seller: <strong style={{ color: 'var(--kt-text)' }}>{listing.sellerName}</strong>
          {listing.sellerId && <span style={{ fontSize: '9px', opacity: 0.5 }}> ({listing.sellerId})</span>}
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: '9px' }}>ID: #{listing.id}</span>
      </div>

      {/* Lock details & timer */}
      {listing.status === 'locked' && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(249, 115, 22, 0.05)',
          border: '1px solid rgba(249, 115, 22, 0.1)',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <span style={{ display: 'block', color: 'var(--kt-text-dim)' }}>Reserved by: <strong style={{ color: 'var(--kt-text)' }}>{listing.reservedBy}</strong></span>
          <ListingStatusTimer unlocksAt={listing.unlocksAt} />
        </div>
      )}

      {/* View Details Button */}
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '12px', border: '1px solid var(--kt-border)', fontSize: '11px' }} onClick={() => alert(`Listing ID: ${listing.id}\nItem: ${listing.itemName}\nQuantity: ${listing.quantity}\nSeller: ${listing.sellerName}\nStatus: ${listing.status}\nDurability: ${listing.itemDurability ?? 'N/A'}`)}>
        🔍 View Details
      </button>
    </div>
  );
}
