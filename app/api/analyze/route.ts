import { NextRequest, NextResponse } from 'next/server';
import { isValidSolanaAddress } from '@/lib/solana';

type HeliusTokenTransfer = {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount?: string;
  toTokenAccount?: string;
  tokenAmount: number;
  mint: string;
  tokenStandard?: string;
};

type HeliusParsedTransaction = {
  description: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  signature: string;
  slot: number;
  timestamp: number;
  tokenTransfers: HeliusTokenTransfer[];
  transactionError?: any;
};

const KINS_MINT = process.env.KINS_MINT || 'Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump';

function getAllowedCounterparties() {
  return (process.env.KINTARA_MARKETPLACE_COUNTERPARTIES || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

async function fetchParsedTransactions(wallet: string, maxPages: number) {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing HELIUS_API_KEY in .env.local');
  }

  let beforeSignature = '';
  let page = 0;
  const allTransactions: HeliusParsedTransaction[] = [];

  while (page < maxPages) {
    const url = new URL(`https://api.helius.xyz/v0/addresses/${wallet}/transactions`);
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('limit', '100');
    if (beforeSignature) {
      url.searchParams.set('before-signature', beforeSignature);
    }

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Helius error ${response.status}: ${detail}`);
    }

    const data = (await response.json()) as HeliusParsedTransaction[];
    if (!data || data.length === 0) {
      break;
    }

    allTransactions.push(...data);

    // The last transaction's signature is used as the cursor for the next page
    const lastTx = data[data.length - 1];
    if (!lastTx || !lastTx.signature) {
      break;
    }
    beforeSignature = lastTx.signature;
    page += 1;
  }

  return allTransactions;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = String(body.wallet || '').trim();
    const maxPages = Math.min(Number(body.maxPages || 10), 50);

    if (!isValidSolanaAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }

    const allowedCounterparties = getAllowedCounterparties();
    const transactions = await fetchParsedTransactions(wallet, maxPages);

    const kinsTransfers: Array<{
      date: string;
      direction: 'in' | 'out';
      amount: number;
      counterparty: string;
      signature: string;
      solscan: string;
      timestamp: number;
    }> = [];

    let totalTransfersChecked = 0;

    for (const tx of transactions) {
      if (tx.transactionError) {
        continue;
      }
      const transfers = tx.tokenTransfers || [];
      for (const t of transfers) {
        if (t.mint === KINS_MINT) {
          totalTransfersChecked++;

          let direction: 'in' | 'out' | null = null;
          let counterparty = '';

          if (t.fromUserAccount === wallet) {
            direction = 'out'; // outgoing/spent -> Buy
            counterparty = t.toUserAccount;
          } else if (t.toUserAccount === wallet) {
            direction = 'in'; // incoming/received -> Sell
            counterparty = t.fromUserAccount;
          }

          if (direction) {
            const isKnownCounterparty =
              allowedCounterparties.length === 0 ||
              allowedCounterparties.includes(counterparty);

            if (isKnownCounterparty) {
              kinsTransfers.push({
                date: new Date(tx.timestamp * 1000).toISOString(),
                direction,
                amount: t.tokenAmount,
                counterparty,
                signature: tx.signature,
                solscan: `https://solscan.io/tx/${tx.signature}`,
                timestamp: tx.timestamp,
              });
            }
          }
        }
      }
    }

    // Sort newest first
    kinsTransfers.sort((a, b) => b.timestamp - a.timestamp);

    const buys = kinsTransfers.filter((t) => t.direction === 'out');
    const sells = kinsTransfers.filter((t) => t.direction === 'in');

    const totalBuyKins = buys.reduce((sum, t) => sum + t.amount, 0);
    const totalSellKins = sells.reduce((sum, t) => sum + t.amount, 0);
    const netKins = totalSellKins - totalBuyKins;

    const byCounterparty: Record<string, { in: number; out: number; count: number }> = {};
    for (const t of kinsTransfers) {
      const key = t.counterparty || 'unknown';
      if (!byCounterparty[key]) byCounterparty[key] = { in: 0, out: 0, count: 0 };
      if (t.direction === 'in') {
        byCounterparty[key].in += t.amount;
      } else {
        byCounterparty[key].out += t.amount;
      }
      byCounterparty[key].count += 1;
    }

    return NextResponse.json({
      wallet,
      kinsMint: KINS_MINT,
      filteredByMarketplaceCounterparties: allowedCounterparties.length > 0,
      summary: {
        totalTransfersChecked,
        kinsTransfers: kinsTransfers.length,
        buyCount: buys.length,
        sellCount: sells.length,
        totalBuyKins,
        totalSellKins,
        netKins,
      },
      counterparties: Object.entries(byCounterparty)
        .map(([address, value]) => ({
          address,
          ...value,
          net: value.in - value.out,
        }))
        .sort((a, b) => b.count - a.count),
      transfers: kinsTransfers.map((t) => ({
        date: t.date,
        direction: t.direction,
        amount: t.amount,
        counterparty: t.counterparty,
        signature: t.signature,
        solscan: t.solscan,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
