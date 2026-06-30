'use client';

import { useMemo, useState } from 'react';
import type { EnrichedTransfer } from '@/types';
import { getItemForTransfer } from '@/lib/items';
import { fmtKins, fmtUsd, fmtDate } from '@/lib/format';
import { EmptyState } from './EmptyState';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportResourceLedgerCsv } from '@/lib/export';

export function ResourceTable({ transfers = [], wallet }: { transfers?: EnrichedTransfer[]; wallet: string }) {
  const [view, setView] = useState<'summary' | 'ledger'>('summary');

  const mappedTrades = useMemo(() => {
    return transfers.map((t) => {
      const { item, quantity } = getItemForTransfer(t.amount, t.signature);
      return {
        ...t,
        item,
        quantity,
      };
    });
  }, [transfers]);

  // Aggregate by item
  const summary = useMemo(() => {
    const agg: Record<string, {
      item: any;
      boughtQty: number;
      boughtKins: number;
      boughtUsd: number;
      soldQty: number;
      soldKins: number;
      soldUsd: number;
    }> = {};

    for (const t of mappedTrades) {
      const key = t.item.id;
      if (!agg[key]) {
        agg[key] = {
          item: t.item,
          boughtQty: 0,
          boughtKins: 0,
          boughtUsd: 0,
          soldQty: 0,
          soldKins: 0,
          soldUsd: 0,
        };
      }

      // If they bought an item, they spent KINS (direction === 'out')
      // If they sold an item, they received KINS (direction === 'in')
      if (t.direction === 'out') {
        agg[key].boughtQty += t.quantity;
        agg[key].boughtKins += t.amount;
        agg[key].boughtUsd += t.txUsdValue ?? 0;
      } else {
        agg[key].soldQty += t.quantity;
        agg[key].soldKins += t.amount;
        agg[key].soldUsd += t.txUsdValue ?? 0;
      }
    }

    return Object.values(agg).sort((a, b) => (b.boughtKins + b.soldKins) - (a.boughtKins + a.soldKins));
  }, [mappedTrades]);

  // Aggregate by Category for the Pie Chart
  const categoryData = useMemo(() => {
    const cats: Record<string, { name: string; value: number; color: string }> = {};
    const colorMap: Record<string, string> = {
      Materials: '#8b949e',
      Food: '#58a6ff',
      Tools: '#d29922',
      Weapons: '#3fb950',
      Currency: '#e3b341',
      Unknown: '#475569',
    };

    for (const t of mappedTrades) {
      const cat = t.item.category || 'Unknown';
      if (!cats[cat]) {
        cats[cat] = {
          name: cat,
          value: 0,
          color: colorMap[cat] || '#8b949e',
        };
      }
      cats[cat].value += t.amount;
    }
    return Object.values(cats).filter((c) => c.value > 0);
  }, [mappedTrades]);

  if (transfers.length === 0) {
    return (
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Resource / Item Analytics</span>
          <span className="badge-sm badge-blue">Beta</span>
        </div>
        <EmptyState
          icon="⚗️"
          title="No transaction data loaded"
          body="Scan a wallet first to view item-level analytics."
        />
      </div>
    );
  }

  const totalSpentKins = mappedTrades.filter(t => t.direction === 'out').reduce((s, t) => s + t.amount, 0);
  const totalSpentUsd = mappedTrades.filter(t => t.direction === 'out').reduce((s, t) => s + (t.txUsdValue ?? 0), 0);
  const totalEarnedKins = mappedTrades.filter(t => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const totalEarnedUsd = mappedTrades.filter(t => t.direction === 'in').reduce((s, t) => s + (t.txUsdValue ?? 0), 0);

  return (
    <div className="panel">
      <div className="panel-head" style={{ borderBottom: '1px solid var(--kt-border)', paddingBottom: '16px' }}>
        <div>
          <span className="panel-title">Resource & Item Ledger</span>
          <p className="panel-desc" style={{ fontSize: '12px', color: 'var(--kt-text-dim)', marginTop: '4px' }}>
            Analytics for items traded on the Kintara marketplace (derived from wallet transfers).
          </p>
        </div>
        <div className="ph-right" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => exportResourceLedgerCsv(mappedTrades, wallet)}
            className="btn btn-sm btn-ghost"
          >
            ⬇ CSV Ledger
          </button>
          <button
            onClick={() => setView('summary')}
            className={`btn btn-sm ${view === 'summary' ? 'btn-primary' : 'btn-ghost'}`}
          >
            📊 Summary
          </button>
          <button
            onClick={() => setView('ledger')}
            className={`btn btn-sm ${view === 'ledger' ? 'btn-primary' : 'btn-ghost'}`}
          >
            📜 Trade Ledger
          </button>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        padding: '20px 0',
        borderBottom: '1px solid var(--kt-border)'
      }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--kt-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--kt-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spent (Buying Items)</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0', color: 'var(--kt-text)' }}>{fmtKins(totalSpentKins, 0)} KINS</div>
          <div style={{ fontSize: '12px', color: 'var(--kt-red)' }}>-{fmtUsd(totalSpentUsd)}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--kt-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--kt-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earned (Selling Items)</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0', color: 'var(--kt-text)' }}>{fmtKins(totalEarnedKins, 0)} KINS</div>
          <div style={{ fontSize: '12px', color: 'var(--kt-green)' }}>+{fmtUsd(totalEarnedUsd)}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--kt-border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--kt-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Item Flow P/L</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0', color: totalEarnedKins - totalSpentKins >= 0 ? 'var(--kt-green)' : 'var(--kt-red)' }}>
            {totalEarnedKins - totalSpentKins >= 0 ? '+' : ''}{fmtKins(totalEarnedKins - totalSpentKins, 0)} KINS
          </div>
          <div style={{ fontSize: '12px', color: totalEarnedUsd - totalSpentUsd >= 0 ? 'var(--kt-green)' : 'var(--kt-red)' }}>
            {totalEarnedUsd - totalSpentUsd >= 0 ? '+' : ''}{fmtUsd(totalEarnedUsd - totalSpentUsd)}
          </div>
        </div>
      </div>

      {view === 'summary' ? (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap', marginTop: '20px' }}>
          <div className="tbl-wrap" style={{ flex: '2 1 600px', margin: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Item / Resource</th>
                  <th>Category</th>
                  <th>Rarity</th>
                  <th>Quantity Bought</th>
                  <th>Total Spent (KINS)</th>
                  <th>Total Spent (USD)</th>
                  <th>Quantity Sold</th>
                  <th>Total Earned (KINS)</th>
                  <th>Total Earned (USD)</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: row.item.bgColor, borderRadius: '4px' }}>
                          {row.item.emoji}
                        </span>
                        <span style={{ color: row.item.color, fontWeight: '600' }}>{row.item.name}</span>
                      </div>
                    </td>
                    <td className="td-dim">{row.item.category}</td>
                    <td>
                      <span className={`badge-sm ${row.item.rarity === 'Legendary' ? 'badge-orange' : row.item.rarity === 'Rare' ? 'badge-blue' : row.item.rarity === 'Uncommon' ? 'badge-green' : ''}`}>
                        {row.item.rarity}
                      </span>
                    </td>
                    <td className="td-mono">{row.boughtQty > 0 ? row.boughtQty : '—'}</td>
                    <td className="td-mono td-red">{row.boughtKins > 0 ? `${fmtKins(row.boughtKins, 2)}` : '—'}</td>
                    <td className="td-mono td-red">{row.boughtUsd > 0 ? `${fmtUsd(row.boughtUsd)}` : '—'}</td>
                    <td className="td-mono">{row.soldQty > 0 ? row.soldQty : '—'}</td>
                    <td className="td-mono td-green">{row.soldKins > 0 ? `${fmtKins(row.soldKins, 2)}` : '—'}</td>
                    <td className="td-mono td-green">{row.soldUsd > 0 ? `${fmtUsd(row.soldUsd)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categoryData.length > 0 && (
            <div style={{
              flex: '1 1 280px',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--kt-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '260px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--kt-text-dim)', marginBottom: '16px' }}>
                Volume by Resource Category
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#070d14', border: '1px solid #1a2840', borderRadius: 3, fontSize: 11, color: '#cbd5e1' }}
                    formatter={(value) => [`${fmtKins(Number(value), 0)} KINS`, 'Volume']}
                  />
                  <Legend iconType="circle" iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 10, paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="tbl-wrap" style={{ marginTop: '20px' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Item / Resource</th>
                <th>Quantity</th>
                <th>Total KINS</th>
                <th>USD Value</th>
                <th>Price Source</th>
                <th>Transaction Sig</th>
              </tr>
            </thead>
            <tbody>
              {mappedTrades.map((t) => (
                <tr key={t.signature + t.date}>
                  <td className="td-dim" style={{ fontSize: '12px' }}>{fmtDate(t.date)}</td>
                  <td>
                    <span className={`type-pill ${t.direction === 'out' ? 'tp-out' : 'tp-in'}`}>
                      {t.direction === 'out' ? 'Buy Item' : 'Sell Item'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', background: t.item.bgColor, borderRadius: '4px' }}>
                        {t.item.emoji}
                      </span>
                      <span style={{ color: t.item.color, fontWeight: '600' }}>{t.item.name}</span>
                    </div>
                  </td>
                  <td className="td-mono">{t.quantity}</td>
                  <td className={`td-mono ${t.direction === 'out' ? 'td-red' : 'td-green'}`}>
                    {t.direction === 'out' ? '−' : '+'}{fmtKins(t.amount, 2)}
                  </td>
                  <td className={`td-mono ${t.direction === 'out' ? 'td-red' : 'td-green'}`}>
                    {t.direction === 'out' ? '−' : '+'}{fmtUsd(t.txUsdValue)}
                  </td>
                  <td>
                    <span className={`tag ${t.priceSource === 'historical' ? 'tag-hist' : t.priceSource === 'current' ? 'tag-cur' : 'tag-na'}`}>
                      {t.priceSource}
                    </span>
                  </td>
                  <td className="td-mono td-dim" style={{ fontSize: '11px' }}>
                    <a href={t.solscan} target="_blank" rel="noreferrer" className="tbl-link">
                      {t.signature.slice(0, 12)}… ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
