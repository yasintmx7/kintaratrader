'use client';

import { useState } from 'react';
import { EmptyState } from './EmptyState';

type ActivityFilter = 'all' | 'sales' | 'listings' | 'reservations' | 'cancellations';

export function ActivityTab() {
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filters: { key: ActivityFilter; label: string }[] = [
    { key: 'all', label: 'All Activity' },
    { key: 'sales', label: 'Completed Sales' },
    { key: 'listings', label: 'New Listings' },
    { key: 'reservations', label: 'Reservations' },
    { key: 'cancellations', label: 'Cancellations' }
  ];

  return (
    <div className="panel" style={{ padding: '20px' }}>
      <div className="panel-head" style={{ borderBottom: '1px solid var(--kt-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <span className="panel-title">Marketplace Activity</span>
          <p className="panel-desc" style={{ fontSize: '12px', color: 'var(--kt-text-dim)', marginTop: '4px' }}>
            Live stream of Kintara marketplace transactions and listing events.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.key)}
            style={{
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px dashed var(--kt-border)',
        borderRadius: '8px',
        padding: '40px'
      }}>
        <EmptyState
          icon="⚡"
          title="Marketplace Activity Offline"
          body="Completed marketplace activity endpoint not connected yet."
          note="This page is pre-structured for real-time Sales, New Listings, Reservations, and Cancellations once the pub/sub connection is configured."
        />
      </div>
    </div>
  );
}
