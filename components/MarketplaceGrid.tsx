'use client';

import { MarketplaceListing } from '@/lib/marketplace';
import { ListingCard } from './ListingCard';
import { EmptyState } from './EmptyState';

export function MarketplaceGrid({ listings }: { listings: MarketplaceListing[] }) {
  if (listings.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Marketplace Data Unavailable"
        body="The marketplace listings endpoint is currently mocked and returning no active items."
      />
    );
  }

  return (
    <div className="item-grid">
      {listings.map(l => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
