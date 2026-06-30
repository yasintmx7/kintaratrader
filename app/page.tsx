'use client';

import { useMemo, useState } from 'react';
import { formatNumber, shortAddress } from '@/lib/solana';

type Analysis = {
  wallet: string;
  kinsMint: string;
  filteredByMarketplaceCounterparties: boolean;
  summary: {
    totalTransfersChecked: number;
    kinsTransfers: number;
    buyCount: number;
    sellCount: number;
    totalBuyKins: number;
    totalSellKins: number;
    netKins: number;
  };
  counterparties: Array<{
    address: string;
    in: number;
    out: number;
    count: number;
    net: number;
  }>;
  transfers: Array<{
    date: string;
    direction: 'in' | 'out';
    amount: number;
    counterparty: string;
    signature: string;
    solscan: string;
  }>;
};

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [maxPages, setMaxPages] = useState(10);
  const [data, setData] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, maxPages }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Request failed');
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const statusText = useMemo(() => {
    if (!data) return '';
    if (data.filteredByMarketplaceCounterparties) {
      return 'Filtered by Kintara marketplace counterparties from .env';
    }
    return 'Counting all KINS transfers because marketplace counterparties are not set';
  }, [data]);

  return (
    <main className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">Kintara Analytics</p>
          <h1>KINS Buy/Sell P&L Tracker</h1>
          <p className="sub">
            Paste a Solana wallet address. The app checks public KINS transfers and calculates total buy, total sell, and net P/L.
          </p>
        </div>
        <div className="badge">No seed phrase needed</div>
      </section>

      <section className="panel">
        <label>Solana wallet address</label>
        <input
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="Paste wallet address here"
        />

        <div className="row">
          <div>
            <label>Pages to scan</label>
            <input
              type="number"
              value={maxPages}
              min={1}
              max={50}
              onChange={(e) => setMaxPages(Number(e.target.value))}
            />
          </div>
          <button onClick={analyze} disabled={loading || !wallet.trim()}>
            {loading ? 'Checking...' : 'Analyze Wallet'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
      </section>

      {data && (
        <>
          <section className="notice">
            <strong>{statusText}</strong>
            <span>KINS mint: {shortAddress(data.kinsMint)}</span>
          </section>

          <section className="grid">
            <Card title="Total Buy / Spent" value={`${formatNumber(data.summary.totalBuyKins, 4)} KINS`} note={`${data.summary.buyCount} outgoing transfers`} />
            <Card title="Total Sell / Received" value={`${formatNumber(data.summary.totalSellKins, 4)} KINS`} note={`${data.summary.sellCount} incoming transfers`} />
            <Card title="Net P/L" value={`${data.summary.netKins >= 0 ? '+' : ''}${formatNumber(data.summary.netKins, 4)} KINS`} note="Sell received minus buy spent" />
            <Card title="KINS Transfers" value={String(data.summary.kinsTransfers)} note={`${data.summary.totalTransfersChecked} total transfers checked`} />
          </section>

          <section className="panel">
            <h2>Top Counterparties</h2>
            <div className="table">
              <div className="thead four">
                <span>Counterparty</span>
                <span>In</span>
                <span>Out</span>
                <span>Net</span>
              </div>
              {data.counterparties.slice(0, 12).map((c) => (
                <div className="tr four" key={c.address}>
                  <span>{shortAddress(c.address)} · {c.count} tx</span>
                  <span>{formatNumber(c.in, 2)}</span>
                  <span>{formatNumber(c.out, 2)}</span>
                  <span>{c.net >= 0 ? '+' : ''}{formatNumber(c.net, 2)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Transfer History</h2>
            <div className="table">
              <div className="thead five">
                <span>Date</span>
                <span>Type</span>
                <span>Amount</span>
                <span>Counterparty</span>
                <span>Tx</span>
              </div>
              {data.transfers.map((t) => (
                <div className="tr five" key={t.signature}>
                  <span>{new Date(t.date).toLocaleString()}</span>
                  <span className={t.direction === 'in' ? 'green' : 'red'}>
                    {t.direction === 'in' ? 'Sell / In' : 'Buy / Out'}
                  </span>
                  <span>{formatNumber(t.amount, 4)} KINS</span>
                  <span>{shortAddress(t.counterparty)}</span>
                  <a href={t.solscan} target="_blank" rel="noreferrer">Solscan</a>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <style jsx>{`
        .container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 42px 18px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .eyebrow {
          color: #7ea7ff;
          margin: 0 0 8px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 6vw, 68px);
          line-height: 0.95;
        }

        h2 {
          margin: 0 0 16px;
        }

        .sub {
          color: #a9b6d3;
          max-width: 680px;
          font-size: 17px;
          line-height: 1.6;
        }

        .badge {
          border: 1px solid rgba(126, 167, 255, 0.3);
          color: #bcd0ff;
          border-radius: 999px;
          padding: 10px 14px;
          white-space: nowrap;
          background: rgba(126, 167, 255, 0.08);
        }

        .panel, .notice, .card {
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.22);
        }

        .panel {
          padding: 22px;
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #c3cce2;
          font-size: 14px;
        }

        input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(0, 0, 0, 0.25);
          color: #fff;
          outline: none;
        }

        .row {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 14px;
          align-items: end;
          margin-top: 14px;
        }

        button {
          border: 0;
          border-radius: 14px;
          padding: 14px 18px;
          color: #07101f;
          background: #eaf0ff;
          cursor: pointer;
          font-weight: 700;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .error {
          margin-top: 14px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 70, 70, 0.12);
          color: #ffb4b4;
        }

        .notice {
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          color: #b7c2de;
          margin-bottom: 20px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .card {
          padding: 18px;
        }

        .cardTitle {
          color: #98a7ca;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .cardValue {
          font-size: 25px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .cardNote {
          color: #7d8dad;
          font-size: 13px;
        }

        .table {
          overflow-x: auto;
        }

        .thead, .tr {
          display: grid;
          gap: 12px;
          min-width: 760px;
          padding: 12px 4px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .thead {
          color: #8495b9;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .four {
          grid-template-columns: 2fr 1fr 1fr 1fr;
        }

        .five {
          grid-template-columns: 1.5fr 1fr 1fr 1.2fr 0.7fr;
        }

        .green {
          color: #73e7a3;
        }

        .red {
          color: #ff9d9d;
        }

        a {
          color: #9ebcff;
          text-decoration: none;
        }

        @media (max-width: 800px) {
          .hero, .notice {
            flex-direction: column;
          }

          .row, .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function Card({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="card">
      <div className="cardTitle">{title}</div>
      <div className="cardValue">{value}</div>
      <div className="cardNote">{note}</div>
    </div>
  );
}
