'use client';

import { useState, useEffect, useMemo } from 'react';
import { MarketplaceListing } from '@/lib/marketplace';
import { ListingCard } from './ListingCard';
import { EmptyState } from './EmptyState';
import { fmtUsd, fmtKins } from '@/lib/format';
import { getItem } from '@/lib/items';
import { ListingStatusTimer } from './ListingStatusTimer';

type SortOption = 
  | 'newest'
  | 'unit_low_to_high'
  | 'unit_high_to_low'
  | 'total_low_to_high'
  | 'total_high_to_low'
  | 'quantity_desc'
  | 'locked_first'
  | 'available_first';

export function MarketplaceGrid({ 
  listings, 
  kinsPrice,
  onRefresh,
  loading = false
}: { 
  listings: MarketplaceListing[];
  kinsPrice: { priceUsd: number } | null;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'token' | 'gold'>('all');
  const [amountFilter, setAmountFilter] = useState<'any' | '10' | '100' | '1000' | '10000'>('any');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [walletMapping, setWalletMapping] = useState<Record<string, string>>({});

  // Pagination limit state
  const [displayLimit, setDisplayLimit] = useState(30);

  useEffect(() => {
    try {
      const mappingStr = localStorage.getItem('kins_wallet_to_seller') || '{}';
      setWalletMapping(JSON.parse(mappingStr));
    } catch {}
  }, []);

  // 30 seconds auto-refresh logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh) onRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  // Dynamic statistics
  const stats = useMemo(() => {
    let goldFloor: number | null = null;
    let availableCount = 0;
    let lockedCount = 0;

    listings.forEach(l => {
      if (l.status === 'locked') {
        lockedCount++;
      } else {
        availableCount++;
      }

      if (l.currency === 'gold' && l.priceGold != null && l.priceGold > 0) {
        if (goldFloor === null || l.priceGold < goldFloor) {
          goldFloor = l.priceGold;
        }
      }
    });

    return {
      goldFloor,
      liveCount: listings.length,
      availableCount,
      lockedCount
    };
  }, [listings]);

  // Floor prices mini strip calculation
  const floorStripData = useMemo(() => {
    const map: Record<string, number> = {};
    listings.forEach(l => {
      if (l.priceUsd != null) {
        const type = l.itemName;
        if (map[type] === undefined || l.priceUsd < map[type]) {
          map[type] = l.priceUsd;
        }
      }
    });
    return Object.entries(map).slice(0, 8); // Top 8 items
  }, [listings]);

  // Wallet address pattern detection
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

  // Filters application
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search query filter
    const query = search.trim().toLowerCase();
    if (query) {
      if (isSolanaAddress) {
        if (mappedSellerName) {
          result = result.filter(l => l.sellerName?.toLowerCase() === mappedSellerName.toLowerCase());
        } else {
          return []; // No mapping
        }
      } else {
        result = result.filter(l => 
          l.itemName.toLowerCase().includes(query) ||
          l.sellerName?.toLowerCase().includes(query)
        );
      }
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      result = result.filter(l => l.currency === currencyFilter);
    }

    // Amount filter
    if (amountFilter !== 'any') {
      const minQty = Number(amountFilter);
      result = result.filter(l => l.quantity >= minQty);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(l => l.itemCategory?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Sort options
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'unit_low_to_high') {
        const aVal = a.pricePerItemUsd || a.pricePerItemGold || 0;
        const bVal = b.pricePerItemUsd || b.pricePerItemGold || 0;
        return aVal - bVal;
      }
      if (sortBy === 'unit_high_to_low') {
        const aVal = a.pricePerItemUsd || a.pricePerItemGold || 0;
        const bVal = b.pricePerItemUsd || b.pricePerItemGold || 0;
        return bVal - aVal;
      }
      if (sortBy === 'total_low_to_high') {
        const aVal = a.priceUsd || a.priceGold || 0;
        const bVal = b.priceUsd || b.priceGold || 0;
        return aVal - bVal;
      }
      if (sortBy === 'total_high_to_low') {
        const aVal = a.priceUsd || a.priceGold || 0;
        const bVal = b.priceUsd || b.priceGold || 0;
        return bVal - aVal;
      }
      if (sortBy === 'quantity_desc') {
        return b.quantity - a.quantity;
      }
      if (sortBy === 'locked_first') {
        const aLock = a.status === 'locked' ? 1 : 0;
        const bLock = b.status === 'locked' ? 1 : 0;
        return bLock - aLock;
      }
      if (sortBy === 'available_first') {
        const aAvail = a.status === 'available' ? 1 : 0;
        const bAvail = b.status === 'available' ? 1 : 0;
        return bAvail - aAvail;
      }
      return 0;
    });

    return result;
  }, [listings, search, currencyFilter, amountFilter, selectedCategory, sortBy, isSolanaAddress, mappedSellerName]);

  const paginatedListings = useMemo(() => {
    return filteredListings.slice(0, displayLimit);
  }, [filteredListings, displayLimit]);

  const categories = [
    'all',
    'gold',
    'materials',
    'food',
    'potions',
    'tools',
    'weapons',
    'mounts',
    'pets',
    'cosmetics'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Hero Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--kt-border)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'block' }}>KINS Price</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginTop: '6px', color: 'var(--kt-blue)' }}>
            {kinsPrice ? `$${kinsPrice.priceUsd.toFixed(8)}` : '—'}
          </span>
        </div>
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--kt-border)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'block' }}>Gold Floor</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginTop: '6px', color: 'var(--kt-gold)' }}>
            {stats.goldFloor ? `${Number(stats.goldFloor).toLocaleString()} Gold` : '—'}
          </span>
        </div>
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--kt-border)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'block' }}>Live Listings</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>{stats.liveCount} total</span>
        </div>
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--kt-border)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'block' }}>Available / Locked</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>
            <span style={{ color: 'var(--kt-green)' }}>{stats.availableCount}</span> / <span style={{ color: 'var(--kt-orange)' }}>{stats.lockedCount}</span>
          </span>
        </div>
      </div>

      {/* 2. Floor Price Mini Strip */}
      {floorStripData.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          padding: '8px 4px',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '6px',
          border: '1px solid var(--kt-border)'
        }}>
          {floorStripData.map(([name, price]) => {
            const item = getItem(name.toLowerCase());
            return (
              <div key={name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontSize: '11px'
              }}>
                <span>{item.emoji || '📦'}</span>
                <span style={{ color: item.color, fontWeight: 'bold' }}>{name}</span>
                <span style={{ color: 'var(--kt-green)', fontWeight: 'bold' }}>{fmtUsd(price)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Filters Panel */}
      <div className="panel" style={{ padding: '16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* Search Field */}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--kt-text-dim)', display: 'block', marginBottom: '6px' }}>Search Item</span>
            <input
              type="text"
              className="fi"
              placeholder="Search items, sellers, wallets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Currency Filter */}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--kt-text-dim)', display: 'block', marginBottom: '6px' }}>Currency</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'token', 'gold'] as const).map(curr => (
                <button
                  key={curr}
                  onClick={() => setCurrencyFilter(curr)}
                  className={`btn btn-sm ${currencyFilter === curr ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, textTransform: 'capitalize', fontSize: '11px' }}
                >
                  {curr === 'token' ? 'KINS' : curr}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Filter */}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--kt-text-dim)', display: 'block', marginBottom: '6px' }}>Amount</span>
            <select
              className="fsel"
              style={{ width: '100%', padding: '8px' }}
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value as any)}
            >
              <option value="any">Any Quantity</option>
              <option value="10">10+ items</option>
              <option value="100">100+ items</option>
              <option value="1000">1,000+ items</option>
              <option value="10000">10,000+ items</option>
            </select>
          </div>

          {/* Sort selection */}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--kt-text-dim)', display: 'block', marginBottom: '6px' }}>Sort By</span>
            <select
              className="fsel"
              style={{ width: '100%', padding: '8px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="newest">Newest first</option>
              <option value="unit_low_to_high">Per unit: Low to High</option>
              <option value="unit_high_to_low">Per unit: High to Low</option>
              <option value="total_low_to_high">Total price: Low to High</option>
              <option value="total_high_to_low">Total price: High to Low</option>
              <option value="quantity_desc">Most Quantity</option>
              <option value="locked_first">Locked first</option>
              <option value="available_first">Available first</option>
            </select>
          </div>
        </div>

        {/* Category Filter Horizontal Scroll */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          marginTop: '16px',
          paddingBottom: '4px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '12px'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                backgroundColor: selectedCategory === cat ? 'var(--kt-blue)' : 'rgba(255,255,255,0.03)',
                color: selectedCategory === cat ? '#fff' : 'var(--kt-text-dim)',
                borderRadius: '20px',
                border: 'none',
                padding: '6px 14px',
                textTransform: 'capitalize',
                fontSize: '11px'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Wallet Mapping status details */}
      {isSolanaAddress && mappedSellerName && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '8px',
          padding: '10px 16px',
          color: '#38bdf8',
          fontSize: '12px',
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
          fontSize: '12px'
        }}>
          ⚠️ <strong>No seller mapping found for this wallet.</strong> To search for listings belonging to this wallet, configure its <strong>Marketplace Seller Name</strong> in the Settings tab.
        </div>
      )}

      {/* Grid/List layout toggle header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--kt-text-dim)' }}>
          Showing <strong>{filteredListings.length}</strong> matching listings
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onRefresh && (
            <button className="btn btn-sm btn-ghost" onClick={onRefresh} disabled={loading}>
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          )}
          <button 
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setViewMode('grid')}
            style={{ padding: '6px 12px' }}
          >
            Grid
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`} 
            onClick={() => setViewMode('list')}
            style={{ padding: '6px 12px' }}
          >
            List
          </button>
        </div>
      </div>

      {/* 4. Listing Grid / List */}
      {filteredListings.length === 0 ? (
        <div className="panel" style={{ padding: '40px' }}>
          <EmptyState
            icon="🔍"
            title="No Listings Found"
            body="No listings match your search options. Try resetting filters."
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="item-grid">
          {paginatedListings.map(l => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Item</th>
                <th className="td-mono">Quantity</th>
                <th className="td-mono">Total Price</th>
                <th className="td-mono">Price/Item</th>
                <th>Status</th>
                <th>Seller</th>
                <th>Unlock Countdown</th>
                <th className="td-mono">ID</th>
              </tr>
            </thead>
            <tbody>
              {paginatedListings.map(l => {
                const gameItem = getItem(l.itemName.toLowerCase());
                const isKins = l.currency === 'token';
                return (
                  <tr key={l.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{l.iconUrl || gameItem.emoji}</span>
                        <span style={{ color: gameItem.color, fontWeight: 'bold' }}>{l.itemName}</span>
                      </div>
                    </td>
                    <td className="td-mono">×{l.quantity.toLocaleString()}</td>
                    <td className="td-mono" style={{ fontWeight: 'bold' }}>
                      {isKins ? `${l.priceGold?.toLocaleString()} KINS` : `${l.priceGold?.toLocaleString()} Gold`}
                      {l.priceUsd != null && (
                        <div style={{ fontSize: '10px', color: 'var(--kt-text-dim)' }}>{fmtUsd(l.priceUsd)}</div>
                      )}
                    </td>
                    <td className="td-mono">
                      {isKins && l.pricePerItemGold
                        ? `${l.pricePerItemGold.toFixed(4)} KINS`
                        : l.pricePerItemGold
                          ? `${l.pricePerItemGold.toFixed(2)} Gold`
                          : '—'}
                      {l.pricePerItemUsd != null && (
                        <div style={{ fontSize: '9px', color: 'var(--kt-text-dim)' }}>{fmtUsd(l.pricePerItemUsd)}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge-sm ${
                        l.status === 'locked' ? 'badge-orange' : l.status === 'available' ? 'badge-green' : 'badge-dim'
                      }`}>
                        {l.status === 'locked' ? 'Locked' : l.status === 'available' ? 'Available' : 'Expired Lock'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--kt-text)' }}>{l.sellerName}</span>
                    </td>
                    <td>
                      {l.status === 'locked' ? (
                        <ListingStatusTimer unlocksAt={l.unlocksAt} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="td-mono td-dim">#{l.id}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Load More */}
      {filteredListings.length > displayLimit && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setDisplayLimit(prev => prev + 30)}
            style={{ padding: '10px 24px' }}
          >
            Load More Listings
          </button>
        </div>
      )}
    </div>
  );
}
