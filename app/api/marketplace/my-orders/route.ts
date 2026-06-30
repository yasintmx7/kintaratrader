import { NextRequest, NextResponse } from 'next/server';
import { fetchActiveOrders } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { wallet } = await req.json();
    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 400 });
    }
    const orders = await fetchActiveOrders(wallet);
    return NextResponse.json({
      orders,
      count: orders.length,
      status: "unavailable",
      message: "Active orders require a marketplace seller mapping."
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch orders';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
