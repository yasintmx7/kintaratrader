'use client';

import { MarketplaceListing } from '@/lib/marketplace';
import { fmtKins } from '@/lib/format';

export function ListingCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <div className="item-preview">
      <div className="item-preview-top">
        <div className="item-preview-ico">
          {/* Replace with actual image tag once we have the iconUrl */}
          📦
        </div>
        <div>
          <div className="item-preview-name">{listing.itemName}</div>
          <div className="item-preview-cat">{listing.itemCategory || 'Unknown'}</div>
        </div>
      </div>
      <div className="item-preview-stats">
        <div className="ips-stat">
          <span className="ips-label">Quantity</span>
          <span className="ips-val">{listing.quantity}</span>
        </div>
        <div className="ips-stat">
          <span className="ips-label">Price</span>
          <span className="ips-val">{listing.totalPriceKins ? fmtKins(listing.totalPriceKins) + ' KINS' : '---'}</span>
        </div>
      </div>
    </div>
  );
}
