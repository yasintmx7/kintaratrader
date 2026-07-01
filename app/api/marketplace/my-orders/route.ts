import { NextRequest, NextResponse } from 'next/server';
import { fetchActiveOrders } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { wallet, sellerName } = await req.json();
    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 400 });
    }
    const orders = await fetchActiveOrders(wallet, sellerName);
    return NextResponse.json({
      orders,
      count: orders.length,
      status: sellerName ? "success" : "unavailable",
      message: sellerName 
        ? "Active orders retrieved successfully." 
        : "Active orders require a marketplace seller mapping. Set your Seller Name in Settings."
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch orders';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
