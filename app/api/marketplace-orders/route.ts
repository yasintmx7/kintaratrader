import { NextRequest, NextResponse } from 'next/server';
import { isValidSolanaAddress } from '@/lib/solana';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { wallet } = (await req.json()) as { wallet?: string };

    if (!wallet || !isValidSolanaAddress(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Active marketplace orders cannot be reliably determined from wallet
    // token transfers alone. Kintara does not currently have a public
    // listing/order REST API. To detect active orders you would need:
    //   1. A Kintara marketplace public API endpoint
    //   2. Known escrow / program addresses to scan on-chain accounts
    //   3. Sub-graph or indexer data from the Kintara marketplace program

    return NextResponse.json({
      available: false,
      orders: [],
      wallet,
      scannedAt: new Date().toISOString(),
      message:
        'Active marketplace listings could not be verified from wallet transfers only. ' +
        'Add Kintara marketplace API or escrow/program addresses in Settings to enable this feature.',
      requiresConfig: [
        'KINTARA_MARKETPLACE_API_URL',
        'KINTARA_MARKETPLACE_COUNTERPARTIES',
        'KINTARA_ESCROW_PROGRAM_ID',
      ],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to check marketplace orders';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
