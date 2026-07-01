import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketplaceListings } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 60;
    const offset = Number(searchParams.get('offset')) || 0;

    const { listings, total } = await fetchMarketplaceListings(limit, offset);
    return NextResponse.json({
      listings,
      count: listings.length,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      status: "success",
      message: "Marketplace listings retrieved successfully."
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch listings';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
