import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    activity: [],
    status: "unavailable",
    message: "Marketplace activity data source not configured."
  });
}
