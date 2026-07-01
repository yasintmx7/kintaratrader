'use client';

import { useState, useEffect } from 'react';
import { MarketplaceListing } from '@/lib/marketplace';
import { ListingCard } from './ListingCard';
import { EmptyState } from './EmptyState';

export function MarketplaceGrid({ listings }: { listings: MarketplaceListing[] }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [walletMapping, setWalletMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const mappingStr = localStorage.getItem('kins_wallet_to_seller') || '{}';
      setWalletMapping(JSON.parse(mappingStr));
    } catch {}
  }, []);

  if (listings.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Marketplace Data Unavailable"
        body="The marketplace listings endpoint is currently returning no active items."
      />
    );
  }

  // Determine if search query is a Solana wallet address (roughly 32-45 chars long)
  const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,45}$/.test(search.trim());
  
  let mappedSellerName = '';
  let showWalletWarning = false;
  
  if (isSolanaAddress) {
    const key = search.trim().toLowerCase();
    if (walletMapping[key]) {
      mappedSellerName = walletMapping[key];
    } else {
      showWalletWarning = true;
    }
  }

  // Filter listings
  const filteredListings = listings.filter(l => {
    // Category filter
    if (selectedCategory !== 'all' && l.itemCategory?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }

    // Search query filter
    const query = search.trim().toLowerCase();
    if (!query) return true;

    // If it's a Solana address, we filter by mapped seller name
    if (isSolanaAddress) {
      if (mappedSellerName) {
        return l.sellerName?.toLowerCase() === mappedSellerName.toLowerCase();
      }
      return false; // Show nothing since no mapping is found (warning will be shown)
    }

    // Otherwise, search item name, seller name, or category
    return (
      l.itemName.toLowerCase().includes(query) ||
      l.sellerName?.toLowerCase().includes(query) ||
      l.itemCategory?.toLowerCase().includes(query)
    );
  });

  const categories = ['all', 'materials', 'food', 'tools', 'weapons', 'mounts', 'currency'];

  return (
    <div className="panel" style={{ padding: '20px' }}>
      <div className="panel-head" style={{ borderBottom: '1px solid var(--kt-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <span className="panel-title">Public Marketplace</span>
          <p className="panel-desc" style={{ fontSize: '12px', color: 'var(--kt-text-dim)', marginTop: '4px' }}>
            Live listings currently active on the Kintara marketplace.
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="fi"
            placeholder="Search by item name, seller name, or wallet address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              paddingLeft: '40px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--kt-border)',
              borderRadius: '8px',
              color: 'var(--kt-text)',
              fontSize: '14px'
            }}
          />
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--kt-text-dim)', fontSize: '16px' }}>🔍</span>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                background: selectedCategory === cat ? 'var(--kt-blue)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCategory === cat ? '#fff' : 'var(--kt-text-dim)',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Wallet Mapping Status / Warnings */}
      {isSolanaAddress && mappedSellerName && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '8px',
          padding: '10px 16px',
          color: '#38bdf8',
          fontSize: '13px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          💡 Wallet address mapped to seller: <strong>{mappedSellerName}</strong>. Showing listings for this seller.
        </div>
      )}

      {showWalletWarning && (
        <div style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.2)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#eab308',
          fontSize: '13px',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          ⚠️ <strong>No seller mapping found for this wallet.</strong><br/>
          To view listings for this wallet address, go to the <strong>Settings</strong> tab, configure the <strong>Marketplace Seller Name (Username)</strong> for this wallet, and try searching again.
        </div>
      )}

      {filteredListings.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Matching Listings"
          body="No active marketplace listings match your query. Try resetting filters or changing your search."
        />
      ) : (
        <div className="item-grid">
          {filteredListings.map(l => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
