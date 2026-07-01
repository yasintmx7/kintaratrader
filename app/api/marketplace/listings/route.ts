import { NextResponse } from 'next/server';
import { fetchMarketplaceListings } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const listings = await fetchMarketplaceListings();
    return NextResponse.json({
      listings,
      count: listings.length,
      status: "success",
      message: "Marketplace listings retrieved successfully."
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch listings';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
