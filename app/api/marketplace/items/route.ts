import { NextResponse } from 'next/server';
import { ALL_ITEMS } from '@/lib/items';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    items: ALL_ITEMS,
    count: ALL_ITEMS.length,
    status: "available",
  });
}
