'use client';

import { EmptyState } from './EmptyState';
import { ALL_ITEMS } from '@/lib/items';

export function ResourceTable() {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Resource / Item Analytics</span>
        <span className="badge-sm badge-blue">Beta</span>
      </div>

      <EmptyState
        icon="⚗️"
        title="Item metadata not available from wallet transfers"
        body="Raw KINS token transfers do not contain item or resource names. Kintara item names (Coal, Wood, Gold, Stone, Fish, etc.) require on-chain marketplace metadata or a Kintara API endpoint that returns item-level trade data. Once available, this section will show per-resource P/L, quantities, and analytics."
        note="Set KINTARA_MARKETPLACE_API_URL in Settings to enable this section."
      >
        <div className="item-grid">
          {ALL_ITEMS.map((item) => (
            <div key={item.id} className="item-preview" style={{ borderColor: item.color + '33' }}>
              <span className="item-preview-ico" style={{ background: item.bgColor }}>
                {item.emoji}
              </span>
              <div>
                <div className="item-preview-name" style={{ color: item.color }}>{item.name}</div>
                <div className="item-preview-cat">{item.category}</div>
              </div>
            </div>
          ))}
        </div>
      </EmptyState>
    </div>
  );
}
