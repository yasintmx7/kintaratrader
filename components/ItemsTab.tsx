'use client';

import { useState } from 'react';
import { ALL_ITEMS, getDefaultPrice } from '@/lib/items';

export function ItemsTab() {
  const [search, setSearch] = useState('');

  const filteredItems = ALL_ITEMS.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.rarity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="panel" style={{ padding: '20px' }}>
      <div className="panel-head" style={{ borderBottom: '1px solid var(--kt-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <span className="panel-title">Item Registry</span>
          <p className="panel-desc" style={{ fontSize: '12px', color: 'var(--kt-text-dim)', marginTop: '4px' }}>
            Reference database of Kintara items, default valuations, and categories.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Filter registry by name, category, rarity..."
          className="fi"
          style={{ width: '100%', maxWidth: '400px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Rarity</th>
              <th className="td-mono">Default Price (KINS)</th>
              <th>Asset Path</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      backgroundColor: item.bgColor,
                      color: item.color,
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      {item.emoji}
                    </div>
                    <span style={{ color: item.color, fontWeight: 'bold' }}>{item.name}</span>
                  </div>
                </td>
                <td>
                  <span className="badge-sm" style={{ textTransform: 'capitalize' }}>{item.category}</span>
                </td>
                <td>
                  <span className="badge-sm" style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: item.color,
                    fontWeight: 'bold'
                  }}>{item.rarity}</span>
                </td>
                <td className="td-mono">
                  {item.id === 'kins' ? '—' : `${getDefaultPrice(item.id).toLocaleString()} KINS`}
                </td>
                <td className="td-dim" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                  {item.iconPath}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
