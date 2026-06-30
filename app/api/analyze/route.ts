import { NextRequest, NextResponse } from 'next/server';
import { isValidSolanaAddress } from '@/lib/solana';
import type { Transfer, Counterparty } from '@/types';

/* ─── Types matching Helius parsed transaction shape ────────────────────────── */

type HeliusTokenTransfer = {
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  mint: string;
};

type HeliusTx = {
  signature: string;
  timestamp: number;
  tokenTransfers: HeliusTokenTransfer[];
  transactionError?: unknown;
};

/* ─── Config ────────────────────────────────────────────────────────────────── */

const KINS_MINT = process.env.KINS_MINT || 'Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump';

function allowedCounterparties(): string[] {
  return (process.env.KINTARA_MARKETPLACE_COUNTERPARTIES || '')
    .split(',').map((x) => x.trim()).filter(Boolean);
}

/* ─── Helius fetcher ────────────────────────────────────────────────────────── */

async function fetchParsedTxs(wallet: string, maxPages: number): Promise<HeliusTx[]> {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) throw new Error('Missing HELIUS_API_KEY in .env.local');

  let beforeSig = '';
  let page = 0;
  const all: HeliusTx[] = [];

  while (page < maxPages) {
    const url = new URL(`https://api.helius.xyz/v0/addresses/${wallet}/transactions`);
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('limit', '100');
    if (beforeSig) url.searchParams.set('before-signature', beforeSig);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Helius ${res.status}: ${detail.slice(0, 200)}`);
    }

    const batch = (await res.json()) as HeliusTx[];
    if (!batch || batch.length === 0) break;
    all.push(...batch);

    const last = batch[batch.length - 1];
    if (!last?.signature) break;
    beforeSig = last.signature;
    page++;
  }

  return all;
}

/* ─── Route handler ─────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json();
    const wallet    = String(body.wallet   || '').trim();
    const maxPages  = Math.min(Number(body.maxPages || 10), 50);
    const clientCounterparties = Array.isArray(body.customCounterparties)
      ? body.customCounterparties.map((x: unknown) => String(x || '').trim()).filter(Boolean)
      : [];

    if (!isValidSolanaAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }

    const allowed = [...allowedCounterparties(), ...clientCounterparties];
    const txs     = await fetchParsedTxs(wallet, maxPages);

    const transfers: Transfer[] = [];
    let totalChecked = 0;

    for (const tx of txs) {
      if (tx.transactionError) continue;
      for (const t of tx.tokenTransfers ?? []) {
        if (t.mint !== KINS_MINT) continue;
        totalChecked++;

        let direction: 'in' | 'out' | null = null;
        let counterparty = '';

        if (t.fromUserAccount === wallet) {
          direction    = 'out';
          counterparty = t.toUserAccount;
        } else if (t.toUserAccount === wallet) {
          direction    = 'in';
          counterparty = t.fromUserAccount;
        }

        if (!direction) continue;
        if (allowed.length > 0 && !allowed.includes(counterparty)) continue;

        transfers.push({
          date:         new Date(tx.timestamp * 1000).toISOString(),
          direction,
          amount:       t.tokenAmount,
          counterparty: counterparty || 'unknown',
          signature:    tx.signature,
          solscan:      `https://solscan.io/tx/${tx.signature}`,
          timestamp:    tx.timestamp,
        });
      }
    }

    transfers.sort((a, b) => b.timestamp - a.timestamp);

    /* ── Counterparties ── */
    const cpAgg: Record<string, {
      in: number; out: number; count: number; timestamps: number[];
    }> = {};

    for (const t of transfers) {
      const key = t.counterparty || 'unknown';
      if (!cpAgg[key]) cpAgg[key] = { in: 0, out: 0, count: 0, timestamps: [] };
      if (t.direction === 'in') cpAgg[key].in  += t.amount;
      else                       cpAgg[key].out += t.amount;
      cpAgg[key].count++;
      cpAgg[key].timestamps.push(t.timestamp);
    }

    const counterparties: Counterparty[] = Object.entries(cpAgg)
      .map(([address, v]) => ({
        address,
        in:        v.in,
        out:       v.out,
        count:     v.count,
        net:       v.in - v.out,
        firstSeen: new Date(Math.min(...v.timestamps) * 1000).toISOString(),
        lastSeen:  new Date(Math.max(...v.timestamps) * 1000).toISOString(),
      }))
      .sort((a, b) => b.count - a.count);

    const buys  = transfers.filter((t) => t.direction === 'in');
    const sells = transfers.filter((t) => t.direction === 'out');
    const totalBuyKins  = buys.reduce((s, t) => s + t.amount, 0);
    const totalSellKins = sells.reduce((s, t) => s + t.amount, 0);

    return NextResponse.json({
      wallet,
      kinsMint: KINS_MINT,
      filteredByMarketplaceCounterparties: allowed.length > 0,
      summary: {
        totalTransfersChecked: totalChecked,
        kinsTransfers:  transfers.length,
        buyCount:       buys.length,
        sellCount:      sells.length,
        totalBuyKins,
        totalSellKins,
        netKins:        totalBuyKins - totalSellKins,
      },
      counterparties,
      transfers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Something went wrong';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
