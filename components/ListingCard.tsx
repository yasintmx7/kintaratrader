'use client';

import { MarketplaceListing } from '@/lib/marketplace';
import { fmtKins } from '@/lib/format';
import { getItem } from '@/lib/items';

export function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const item = listing.itemId ? getItem(listing.itemId) : null;
  const emoji = item?.emoji || listing.iconUrl || '📦';
  const color = item?.color || 'inherit';
  const bgColor = item?.bgColor || 'rgba(255, 255, 255, 0.05)';

  return (
    <div className="item-preview">
      <div className="item-preview-top">
        <div className="item-preview-ico" style={{ backgroundColor: bgColor, color: color, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', width: '40px', height: '40px' }}>
          {emoji}
        </div>
        <div>
          <div className="item-preview-name" style={{ color: color, fontWeight: 'bold' }}>{listing.itemName}</div>
          <div className="item-preview-cat">{listing.itemCategory || 'Unknown'}</div>
        </div>
      </div>
      <div className="item-preview-stats" style={{ marginTop: '12px' }}>
        <div className="ips-stat">
          <span className="ips-label">Quantity</span>
          <span className="ips-val">{listing.quantity}</span>
        </div>
        <div className="ips-stat">
          <span className="ips-label">Price</span>
          <span className="ips-val">
            {listing.totalPriceKins 
              ? `${fmtKins(listing.totalPriceKins)} KINS` 
              : listing.totalPriceGold 
                ? `${listing.totalPriceGold} Gold` 
                : '---'}
          </span>
        </div>
      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--kt-text-dim)', textAlign: 'right', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
        Seller: <span style={{ color: 'var(--kt-text)', fontWeight: '500' }}>{listing.sellerName || 'Unknown'}</span>
      </div>
    </div>
  );
}
