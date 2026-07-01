'use client';

import { useState, useEffect, useMemo } from 'react';
import { MarketplaceListing } from '@/lib/marketplace';
import { ListingCard } from './ListingCard';
import { EmptyState } from './EmptyState';
import { fmtUsd } from '@/lib/format';
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

const CATEGORIES = [
  'all',
  'gold',
  'materials',
  'food',
  'potions',
  'tools',
  'weapons',
  'mounts',
  'pets',
  'cosmetics',
];

export function MarketplaceGrid({
  listings,
  total: apiTotal = 0,
  kinsPrice,
  onRefresh,
  loading = false,
  lastError = '',
}: {
  listings: MarketplaceListing[];
  total?: number;
  kinsPrice: { priceUsd: number } | null;
  onRefresh?: () => void;
  loading?: boolean;
  lastError?: string;
}) {
  const [search, setSearch]               = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'token' | 'gold'>('all');
  const [amountFilter, setAmountFilter]   = useState<'any' | '10' | '100' | '1000' | '10000'>('any');
  const [selectedCategory, setSelectedCategory] = useState('all');  // DEFAULT = "all"
  const [sortBy, setSortBy]               = useState<SortOption>('newest');
  const [viewMode, setViewMode]           = useState<'grid' | 'list'>('grid');
  const [walletMapping, setWalletMapping] = useState<Record<string, string>>({});
  const [displayLimit, setDisplayLimit]   = useState(60);

  useEffect(() => {
    try {
      const m = localStorage.getItem('kins_wallet_to_seller') || '{}';
      setWalletMapping(JSON.parse(m));
    } catch {}
  }, []);

  // Auto-refresh every 30 s
  useEffect(() => {
    if (!onRefresh) return;
    const id = setInterval(onRefresh, 30_000);
    return () => clearInterval(id);
  }, [onRefresh]);

  // ─── Solana wallet detection ──────────────────────────────────────────────
  const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,45}$/.test(search.trim());
  const mappedSellerName = isSolanaAddress ? (walletMapping[search.trim().toLowerCase()] ?? '') : '';
  const showWalletWarning = isSolanaAddress && !mappedSellerName;

  // ─── Stats (always from raw listings + apiTotal) ─────────────────────────
  const stats = useMemo(() => {
    let goldFloor: number | null = null;
    let availableCount = 0;
    let lockedCount    = 0;

    listings.forEach(l => {
      if (l.status === 'locked') {
        lockedCount++;
      } else {
        availableCount++;
      }

      // gold floor = lowest priceGold among gold-currency available listings
      if (
        (l.currency === 'gold' || (l.priceGold ?? 0) > 0) &&
        l.status !== 'locked' &&
        (l.priceGold ?? 0) > 0
      ) {
        if (goldFloor === null || (l.priceGold as number) < goldFloor) {
          goldFloor = l.priceGold as number;
        }
      }
    });

    return { goldFloor, availableCount, lockedCount };
  }, [listings]);

  // ─── Floor price strip (top 8 unique items by USD floor) ─────────────────
  const floorStripData = useMemo(() => {
    const map: Record<string, number> = {};
    listings.forEach(l => {
      if ((l.priceUsd ?? 0) > 0) {
        if (map[l.itemName] === undefined || (l.priceUsd as number) < map[l.itemName]) {
          map[l.itemName] = l.priceUsd as number;
        }
      }
    });
    return Object.entries(map).slice(0, 8);
  }, [listings]);

  // ─── Filter + sort ───────────────────────────────────────────────────────
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search
    const query = search.trim().toLowerCase();
    if (query) {
      if (isSolanaAddress) {
        if (mappedSellerName) {
          result = result.filter(l => l.sellerName?.toLowerCase() === mappedSellerName.toLowerCase());
        } else {
          return [];
        }
      } else {
        result = result.filter(l =>
          l.itemName.toLowerCase().includes(query) ||
          l.itemType.toLowerCase().includes(query) ||
          l.sellerName?.toLowerCase().includes(query) ||
          l.sellerId?.toLowerCase().includes(query)
        );
      }
    }

    // Currency filter
    // All = show all
    // KINS (token) = currency === "token"
    // Gold = currency === "gold" OR priceGold > 0
    if (currencyFilter === 'token') {
      result = result.filter(l => l.currency === 'token');
    } else if (currencyFilter === 'gold') {
      result = result.filter(l => l.currency === 'gold' || (l.priceGold ?? 0) > 0);
    }

    // Quantity filter
    if (amountFilter !== 'any') {
      const minQty = Number(amountFilter);
      result = result.filter(l => l.quantity >= minQty);
    }

    // Category filter
    // "gold" category matches itemType === "gold" (the game item), NOT by currency
    if (selectedCategory === 'gold') {
      result = result.filter(l => l.itemType?.toLowerCase() === 'gold');
    } else if (selectedCategory !== 'all') {
      result = result.filter(l =>
        l.itemType?.toLowerCase().startsWith(selectedCategory.toLowerCase()) ||
        l.itemName?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'unit_low_to_high':
          return (a.pricePerItemUsd ?? a.pricePerItemGold ?? 0) - (b.pricePerItemUsd ?? b.pricePerItemGold ?? 0);
        case 'unit_high_to_low':
          return (b.pricePerItemUsd ?? b.pricePerItemGold ?? 0) - (a.pricePerItemUsd ?? a.pricePerItemGold ?? 0);
        case 'total_low_to_high':
          return ((a.priceUsd ?? 0) || (a.priceGold ?? 0)) - ((b.priceUsd ?? 0) || (b.priceGold ?? 0));
        case 'total_high_to_low':
          return ((b.priceUsd ?? 0) || (b.priceGold ?? 0)) - ((a.priceUsd ?? 0) || (a.priceGold ?? 0));
        case 'quantity_desc':
          return b.quantity - a.quantity;
        case 'locked_first':
          return (b.status === 'locked' ? 1 : 0) - (a.status === 'locked' ? 1 : 0);
        case 'available_first':
          return (b.status === 'available' ? 1 : 0) - (a.status === 'available' ? 1 : 0);
        default:
          return 0;
      }
    });

    return result;
  }, [listings, search, currencyFilter, amountFilter, selectedCategory, sortBy, isSolanaAddress, mappedSellerName]);

  const paginatedListings = useMemo(() => filteredListings.slice(0, displayLimit), [filteredListings, displayLimit]);

  // Log on mount / when listings change (debug)
  useEffect(() => {
    if (listings.length > 0) {
      console.log('[MarketplaceGrid] Normalized listings count:', listings.length, listings.slice(0, 3));
    }
  }, [listings]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Debug bar ── */}
      <div style={{
        background: 'rgba(30,30,30,0.6)',
        border: '1px solid rgba(255,255,0,0.15)',
        borderRadius: '6px',
        padding: '6px 14px',
        fontSize: '11px',
        color: '#888',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        fontFamily: 'monospace',
      }}>
        <span>Fetched listings: <strong style={{ color: '#ccc' }}>{listings.length}</strong></span>
        <span>API total: <strong style={{ color: '#ccc' }}>{apiTotal}</strong></span>
        <span>Filtered listings: <strong style={{ color: '#ccc' }}>{filteredListings.length}</strong></span>
        {lastError && <span style={{ color: '#f87171' }}>Last error: {lastError}</span>}
        {!lastError && listings.length === 0 && (
          <span style={{ color: '#facc15' }}>⚠ No listings returned — check console for API response</span>
        )}
      </div>

      {/* ── Hero Stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}>
        {[
          { label: 'KINS Price',        value: kinsPrice ? `$${kinsPrice.priceUsd.toFixed(8)}` : '—',                   color: 'var(--kt-blue)' },
          { label: 'Gold Floor',        value: stats.goldFloor ? `${Number(stats.goldFloor).toLocaleString()} G` : '—', color: 'var(--kt-gold)' },
          { label: 'Live Listings',     value: `${apiTotal || listings.length}`,                                        color: 'var(--kt-text)' },
          { label: 'Available / Locked',value: null,                                                                    color: '' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--kt-border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--kt-text-dim)', display: 'block' }}>{s.label}</span>
            {s.value !== null ? (
              <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginTop: '6px', color: s.color }}>
                {s.value}
              </span>
            ) : (
              <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>
                <span style={{ color: 'var(--kt-green)' }}>{stats.availableCount}</span>
                {' / '}
                <span style={{ color: 'var(--kt-orange)' }}>{stats.lockedCount}</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Floor price strip ── */}
      {floorStripData.length > 0 && (
        <div style={{
          display: 'flex', gap: '10px', overflowX: 'auto',
          padding: '8px 4px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '6px',
          border: '1px solid var(--kt-border)',
        }}>
          {floorStripData.map(([name, price]) => {
            const item = getItem(name.toLowerCase());
            return (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontSize: '11px',
              }}>
                <span>{item.emoji || '📦'}</span>
                <span style={{ color: item.color, fontWeight: 'bold' }}>{name}</span>
                <span style={{ color: 'var(--kt-green)', fontWeight: 'bold' }}>{fmtUsd(price)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filters panel ── */}
      <div className="panel" style={{ padding: '16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '14px',
          alignItems: 'end',
        }}>
          {/* Search */}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--kt-text-dim)', display: 'block', marginBottom: '6px' }}>Search</span>
            <input
              type="text"
              className="fi"
              placeholder="Item, seller name, wallet…"
              value={search}
              onChange={e => { setSearch(e.target.value); setDisplayLimit(60); }}
              style={{ width: '100%' }}
            />
          </div>

          {/* Currency */}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--kt-text-dim)', display: 'block', marginBottom: '6px' }}>Currency</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'token', 'gold'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCurrencyFilter(c)}
                  className={`btn btn-sm ${currencyFilter === c ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, fontSize: '11px' }}
                >
                  {c === 'token' ? 'KINS' : c === 'all' ? 'All' : 'Gold'}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--kt-text-dim)', display: 'block', marginBottom: '6px' }}>Min Quantity</span>
            <select className="fsel" style={{ width: '100%', padding: '8px' }} value={amountFilter} onChange={e => setAmountFilter(e.target.value as any)}>
              <option value="any">Any</option>
              <option value="10">10+</option>
              <option value="100">100+</option>
              <option value="1000">1,000+</option>
              <option value="10000">10,000+</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--kt-text-dim)', display: 'block', marginBottom: '6px' }}>Sort By</span>
            <select className="fsel" style={{ width: '100%', padding: '8px' }} value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}>
              <option value="newest">Newest First</option>
              <option value="unit_low_to_high">Price/Item: Low → High</option>
              <option value="unit_high_to_low">Price/Item: High → Low</option>
              <option value="total_low_to_high">Total Price: Low → High</option>
              <option value="total_high_to_low">Total Price: High → Low</option>
              <option value="quantity_desc">Most Quantity</option>
              <option value="locked_first">Locked First</option>
              <option value="available_first">Available First</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div style={{
          display: 'flex', gap: '6px', overflowX: 'auto',
          marginTop: '14px', paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: '2px',
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                backgroundColor: selectedCategory === cat ? 'var(--kt-blue)' : 'rgba(255,255,255,0.03)',
                color:           selectedCategory === cat ? '#fff' : 'var(--kt-text-dim)',
                borderRadius: '20px',
                border: 'none',
                padding: '5px 13px',
                textTransform: 'capitalize',
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              {cat === 'all' ? 'All Items' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Wallet mapping notice */}
      {isSolanaAddress && mappedSellerName && (
        <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '10px 16px', color: '#38bdf8', fontSize: '12px' }}>
          💡 Wallet → seller: <strong>{mappedSellerName}</strong>
        </div>
      )}
      {showWalletWarning && (
        <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '8px', padding: '12px 16px', color: '#eab308', fontSize: '12px' }}>
          ⚠️ No seller mapping found for this wallet. Configure one in <strong>Settings</strong>.
        </div>
      )}

      {/* Count row + view toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--kt-text-dim)' }}>
          Showing <strong>{paginatedListings.length}</strong> of <strong>{filteredListings.length}</strong> matching
          {apiTotal > 0 && <> (API total: <strong>{apiTotal}</strong>)</>}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onRefresh && (
            <button className="btn btn-sm btn-ghost" onClick={onRefresh} disabled={loading}>
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          )}
          {(['grid', 'list'] as const).map(m => (
            <button
              key={m}
              className={`btn btn-sm ${viewMode === m ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode(m)}
              style={{ padding: '6px 12px', textTransform: 'capitalize' }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Listings grid / list ── */}
      {filteredListings.length === 0 ? (
        <div className="panel" style={{ padding: '40px' }}>
          <EmptyState
            icon="🔍"
            title={listings.length === 0 ? 'No Listings Loaded' : 'No Listings Match'}
            body={
              listings.length === 0
                ? 'The marketplace fetch returned 0 listings. Check the debug bar above and the browser console for errors.'
                : 'No listings match your current filters. Try resetting them.'
            }
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="item-grid">
          {paginatedListings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Item</th>
                <th className="td-mono">Qty</th>
                <th className="td-mono">Total Price</th>
                <th className="td-mono">Price / Item</th>
                <th>Status</th>
                <th>Seller</th>
                <th>Unlock</th>
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
                      {isKins
                        ? `${(l.priceGold ?? 0).toLocaleString()} KINS`
                        : `${(l.priceGold ?? 0).toLocaleString()} Gold`}
                      {(l.priceUsd ?? 0) > 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--kt-text-dim)' }}>{fmtUsd(l.priceUsd!)}</div>
                      )}
                    </td>
                    <td className="td-mono">
                      {(l.pricePerItemGold ?? 0) > 0
                        ? isKins
                          ? `${l.pricePerItemGold!.toFixed(4)} KINS`
                          : `${l.pricePerItemGold!.toFixed(2)} Gold`
                        : '—'}
                      {(l.pricePerItemUsd ?? 0) > 0 && (
                        <div style={{ fontSize: '9px', color: 'var(--kt-text-dim)' }}>{fmtUsd(l.pricePerItemUsd!)}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge-sm ${l.status === 'locked' ? 'badge-orange' : 'badge-green'}`}>
                        {l.status === 'locked' ? '🔒 Locked' : '✅ Available'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--kt-text)' }}>{l.sellerName}</td>
                    <td>
                      {l.status === 'locked'
                        ? <ListingStatusTimer unlocksAt={l.unlocksAt} />
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Load more */}
      {filteredListings.length > displayLimit && (
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={() => setDisplayLimit(n => n + 60)} style={{ padding: '10px 28px' }}>
            Load More Listings
          </button>
        </div>
      )}
    </div>
  );
}
