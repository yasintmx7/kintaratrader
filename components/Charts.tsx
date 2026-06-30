'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, Cell,
} from 'recharts';
import type { EnrichedTransfer, OhlcvCandle, PnlSummary } from '@/types';
import { fmtUsd, fmtKins } from '@/lib/format';

/* ─── Shared tooltip style ────────────────────────────────────────────────── */

const TIP = {
  contentStyle: {
    background: '#070d14',
    border: '1px solid #1a2840',
    borderRadius: 3,
    fontSize: 11,
    color: '#cbd5e1',
    boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
  },
  labelStyle: { color: '#475569', marginBottom: 3 },
  itemStyle:  { color: '#94a3b8' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

/* ─── Daily Buy vs Sell ──────────────────────────────────────────────────── */

export function DailyChart({ transfers }: { transfers: EnrichedTransfer[] }) {
  const map: Record<string, { date: string; buy: number; sell: number }> = {};
  for (const t of transfers) {
    const d = t.date.slice(0, 10);
    if (!map[d]) map[d] = { date: d, buy: 0, sell: 0 };
    if (t.direction === 'out') map[d].buy  += t.amount;
    else                        map[d].sell += t.amount;
  }
  const data = Object.values(map)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-45);

  if (data.length === 0) return <div className="chart-empty">No daily data</div>;

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#334155', fontSize: 9 }} axisLine={false} tickLine={false}
          interval="preserveStartEnd" />
        <YAxis hide />
        <Tooltip {...TIP}
          formatter={(v: unknown, name: unknown) =>
            [`${fmtKins(Number(v), 2)} KINS`, name === 'buy' ? 'Buy/Spent' : 'Sell/Received']}
        />
        <Legend iconType="square" iconSize={7} wrapperStyle={{ fontSize: 10, color: '#475569' }}
          formatter={(v: string) => v === 'buy' ? 'Buy / Out' : 'Sell / In'} />
        <Bar dataKey="buy"  fill="#ef4444" opacity={0.85} radius={[2,2,0,0]} maxBarSize={20} />
        <Bar dataKey="sell" fill="#22c55e" opacity={0.85} radius={[2,2,0,0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Buy vs Sell Summary ─────────────────────────────────────────────────── */

export function BuySellSummaryChart({ pnl }: { pnl: PnlSummary }) {
  const data = [
    { name: 'Buy / Spent',    value: pnl.totalBuyKins },
    { name: 'Sell / Received',value: pnl.totalSellKins },
  ];
  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 20, top: 4, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={105}
          tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip {...TIP}
          formatter={(v: unknown) => [`${fmtKins(Number(v), 2)} KINS`, 'Amount']} />
        <Bar dataKey="value" radius={[0, 2, 2, 0]}
          background={{ fill: 'rgba(255,255,255,0.02)' }}>
          <Cell fill="#ef4444" />
          <Cell fill="#22c55e" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Cumulative P/L Chart ────────────────────────────────────────────────── */

export function CumulativePnlChart({ transfers }: { transfers: EnrichedTransfer[] }) {
  let cum = 0;
  const data = transfers
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((t) => {
      const val = t.txUsdValue ?? 0;
      if (t.direction === 'in')  cum += val;
      if (t.direction === 'out') cum -= val;
      return { date: t.date.slice(0, 10), pnl: parseFloat(cum.toFixed(4)) };
    });

  if (data.length === 0) return <div className="chart-empty">No P/L data</div>;

  const isProfit = cum >= 0;

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#334155', fontSize: 9 }} axisLine={false} tickLine={false}
          interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#334155', fontSize: 9 }} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => fmtUsd(v, 0)} width={55} />
        <Tooltip {...TIP} formatter={(v: unknown) => [fmtUsd(Number(v)), 'Cumulative P/L']} />
        <Line type="monotone" dataKey="pnl"
          stroke={isProfit ? '#22c55e' : '#ef4444'}
          strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── KINS Price Chart ────────────────────────────────────────────────────── */

export function PriceChart({ ohlcv }: { ohlcv: OhlcvCandle[] }) {
  const data = ohlcv.slice(-90).map((c) => ({ date: c.date, price: c.close }));
  if (data.length === 0) return <div className="chart-empty">No price history available</div>;

  const first = data[0].price;
  const last  = data[data.length - 1].price;
  const color = last >= first ? '#22c55e' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#334155', fontSize: 9 }} axisLine={false} tickLine={false}
          interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#334155', fontSize: 9 }} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => `$${v.toPrecision(3)}`} width={60} />
        <Tooltip {...TIP}
          formatter={(v: unknown) => [`$${Number(v).toPrecision(6)}`, 'KINS Price']} />
        <Line type="monotone" dataKey="price"
          stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
