'use client';

import { useState } from 'react';
import type { Counterparty } from '@/types';
import { fmtKins, fmtUsd, fmtAddr, fmtDate } from '@/lib/format';

export function CounterpartyTable({
  counterparties,
  currentPrice,
}: {
  counterparties: Counterparty[];
  currentPrice: number | null;
}) {
  const [copied, setCopied] = useState('');

  function copy(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(''), 1800);
  }

  const toUsd = (k: number) =>
    currentPrice != null ? fmtUsd(k * currentPrice) : '—';

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Counterparty Analysis</span>
        <span className="badge-sm">{Math.min(counterparties.length, 30)}</span>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Address</th>
              <th>In KINS</th>
              <th>Out KINS</th>
              <th>Net KINS</th>
              <th>In USD</th>
              <th>Out USD</th>
              <th>Txs</th>
              <th>First Seen</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {counterparties.slice(0, 30).map((c) => (
              <tr key={c.address}>
                <td className="td-mono td-dim" title={c.address}>{fmtAddr(c.address)}</td>
                <td className="td-mono td-green">+{fmtKins(c.in,  2)}</td>
                <td className="td-mono td-red">−{fmtKins(c.out, 2)}</td>
                <td className={`td-mono ${c.net >= 0 ? 'td-green' : 'td-red'}`}>
                  {c.net >= 0 ? '+' : ''}{fmtKins(c.net, 2)}
                </td>
                <td className="td-dim">{toUsd(c.in)}</td>
                <td className="td-dim">{toUsd(c.out)}</td>
                <td className="td-dim">{c.count}</td>
                <td className="td-dim td-xs">{fmtDate(c.firstSeen)}</td>
                <td className="td-dim td-xs">{fmtDate(c.lastSeen)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="icobtn"
                      onClick={() => copy(c.address)}
                      title={copied === c.address ? 'Copied!' : 'Copy'}
                    >{copied === c.address ? '✓' : '⎘'}</button>
                    <a
                      href={`https://solscan.io/account/${c.address}`}
                      target="_blank" rel="noreferrer"
                      className="icobtn icobtn-blue" title="Solscan"
                    >↗</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
