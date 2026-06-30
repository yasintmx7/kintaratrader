'use client';

import { useMemo, useState } from 'react';
import type { EnrichedTransfer } from '@/types';
import { fmtDate, fmtKins, fmtUsd, fmtAddr } from '@/lib/format';
import { exportTradesCsv } from '@/lib/export';

type Filter  = 'all' | 'buy' | 'sell';
type SortKey = 'newest' | 'oldest' | 'bigKins' | 'bigUsd';

const PAGE_SIZE = 25;

export function TradeTable({ transfers, wallet }: { transfers: EnrichedTransfer[]; wallet: string }) {
  const [filter,  setFilter]  = useState<Filter>('all');
  const [sort,    setSort]    = useState<SortKey>('newest');
  const [search,  setSearch]  = useState('');
  const [minKins, setMinKins] = useState('');
  const [maxKins, setMaxKins] = useState('');
  const [dateFrom,setDateFrom]= useState('');
  const [dateTo,  setDateTo]  = useState('');
  const [page,    setPage]    = useState(1);

  const filtered = useMemo(() => {
    let list = [...transfers];
    if (filter === 'buy')  list = list.filter((t) => t.direction === 'out');
    if (filter === 'sell') list = list.filter((t) => t.direction === 'in');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.counterparty.toLowerCase().includes(q) || t.signature.toLowerCase().includes(q)
      );
    }
    if (minKins) list = list.filter((t) => t.amount >= Number(minKins));
    if (maxKins) list = list.filter((t) => t.amount <= Number(maxKins));
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo)   list = list.filter((t) => t.date <= dateTo + 'T23:59:59Z');
    if (sort === 'newest')  list.sort((a, b) => b.timestamp - a.timestamp);
    if (sort === 'oldest')  list.sort((a, b) => a.timestamp - b.timestamp);
    if (sort === 'bigKins') list.sort((a, b) => b.amount - a.amount);
    if (sort === 'bigUsd')  list.sort((a, b) => (b.txUsdValue ?? 0) - (a.txUsdValue ?? 0));
    return list;
  }, [transfers, filter, sort, search, minKins, maxKins, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilterChange(f: Filter) { setFilter(f); setPage(1); }
  function handleSortChange  (s: SortKey){ setSort(s);   setPage(1); }

  function srcTag(t: EnrichedTransfer) {
    if (t.priceSource === 'historical') return <span className="tag tag-hist">hist</span>;
    if (t.priceSource === 'current')    return <span className="tag tag-cur">cur</span>;
    return <span className="tag tag-na">n/a</span>;
  }

  return (
    <div className="panel">
      {/* Panel head */}
      <div className="panel-head">
        <span className="panel-title">Transaction History</span>
        <div className="ph-right">
          <span className="badge-sm">{filtered.length} tx</span>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => exportTradesCsv(filtered, wallet)}
          >⬇ CSV</button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="fpills">
          {(['all', 'buy', 'sell'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`fpill ${filter === f ? `fp-${f}` : ''}`}
            >
              {f === 'all' ? 'All' : f === 'buy' ? '↑ Buys' : '↓ Sells'}
            </button>
          ))}
        </div>
        <div className="filter-inputs">
          <input className="fi" placeholder="Search addr / sig…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <input className="fi fi-sm" type="number" placeholder="Min KINS" value={minKins}
            onChange={(e) => { setMinKins(e.target.value); setPage(1); }} />
          <input className="fi fi-sm" type="number" placeholder="Max KINS" value={maxKins}
            onChange={(e) => { setMaxKins(e.target.value); setPage(1); }} />
          <input className="fi fi-sm" type="date" placeholder="From" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <input className="fi fi-sm" type="date" placeholder="To" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          <select className="fsel" value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortKey)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="bigKins">Biggest KINS</option>
            <option value="bigUsd">Biggest USD</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount KINS</th>
              <th>KINS Price</th>
              <th>USD @ Tx</th>
              <th>Src</th>
              <th>Counterparty</th>
              <th>Sig</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={9} className="tbl-empty">No transactions match filters</td></tr>
            ) : (
              pageRows.map((t) => (
                <tr key={t.signature + t.date}>
                  <td className="td-dim">{fmtDate(t.date)}</td>
                  <td>
                    <span className={`type-pill ${t.direction === 'in' ? 'tp-in' : 'tp-out'}`}>
                      {t.direction === 'in' ? '↓ Sell' : '↑ Buy'}
                    </span>
                  </td>
                  <td className={`td-mono ${t.direction === 'in' ? 'td-green' : 'td-red'}`}>
                    {t.direction === 'in' ? '+' : '−'}{fmtKins(t.amount, 4)}
                  </td>
                  <td className="td-mono td-dim">
                    {t.kinsPriceAtTx != null ? `$${t.kinsPriceAtTx.toPrecision(4)}` : '—'}
                  </td>
                  <td className={`td-mono ${t.direction === 'in' ? 'td-green' : 'td-red'}`}>
                    {fmtUsd(t.txUsdValue)}
                  </td>
                  <td>{srcTag(t)}</td>
                  <td className="td-mono td-dim" title={t.counterparty}>{fmtAddr(t.counterparty)}</td>
                  <td className="td-mono td-dim" title={t.signature}>{t.signature.slice(0, 10)}…</td>
                  <td>
                    <a href={t.solscan} target="_blank" rel="noreferrer"
                      className="tbl-link" title="Solscan">↗</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="pgbtn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>←</button>
          <span className="pg-info">{page} / {totalPages}</span>
          <button className="pgbtn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
        </div>
      )}
    </div>
  );
}
