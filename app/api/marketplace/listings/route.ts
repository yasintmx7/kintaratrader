import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function formatItemName(itemType: string): string {
  if (!itemType) return 'Unknown Item';
  let name = itemType.toLowerCase();

  // Custom mappings
  if (name === 'cooked_fish_meat') return 'Cooked Fish';
  if (name === 'mount_octopus')    return 'Octopus Mount';
  if (name === 'gold')             return 'Gold';

  // Strip common prefixes
  const prefixes = ['tool_', 'pet_', 'cosmetic_', 'mount_', 'item_'];
  for (const p of prefixes) {
    if (name.startsWith(p)) { name = name.slice(p.length); break; }
  }

  // Level suffixes _l2 or _12
  name = name.replace(/_l(\d+)$/i, ' Lv.$1').replace(/_(\d+)$/, ' Lv.$1');

  // Replace underscores
  name = name.replace(/_/g, ' ');

  // Title case
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit  = Number(searchParams.get('limit'))  || 60;
  const offset = Number(searchParams.get('offset')) || 0;

  const apiUrl =
    `https://fanout.kintara.gg/api/marketplace/listings?sort=latest&currency=all&category=all&limit=${limit}&offset=${offset}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      // Revalidate every 15 s so Vercel edge cache doesn't serve stale data
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Upstream error: ${res.status}`, listings: [], total: 0 },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.ok || !Array.isArray(data.listings)) {
      return NextResponse.json({
        ok: false,
        error: 'Upstream returned no listings array',
        listings: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
      });
    }

    const now = Date.now();

    const normalizedListings = data.listings.map((raw: any) => {
      const quantity        = Number(raw.quantity   || 0);
      const priceGold       = Number(raw.priceGold  || 0);
      const priceUsd        = Number(raw.priceUsd   || 0);
      const reservedUntilMs = raw.reservedUntilMs ? Number(raw.reservedUntilMs) : null;
      const reservedBy      = raw.reservedBy || null;

      const isLocked =
        Boolean(reservedBy) &&
        reservedUntilMs !== null &&
        reservedUntilMs > now;

      const status: 'locked' | 'available' = isLocked ? 'locked' : 'available';

      return {
        id:             String(raw.id ?? ''),
        sellerId:       raw.sellerId  ? String(raw.sellerId) : undefined,
        sellerName:     raw.sellerName ?? 'Unknown',
        itemType:       raw.itemType  ?? 'unknown',
        itemName:       formatItemName(raw.itemType ?? ''),
        quantity,
        priceGold,
        priceUsd,
        currency:       raw.currency  ?? 'gold',
        createdAt:      raw.createdAt ?? new Date().toISOString(),
        reservedBy,
        reservedUntilMs,
        itemDurability: raw.itemDurability ? Number(raw.itemDurability) : null,
        isReserved:     isLocked,
        status,
        unlocksInMs:    isLocked ? Math.max(0, (reservedUntilMs as number) - now) : 0,
        unlocksAt:      isLocked ? new Date(reservedUntilMs as number).toISOString() : '',
        pricePerItemUsd:  quantity > 0 ? priceUsd  / quantity : 0,
        pricePerItemGold: quantity > 0 ? priceGold / quantity : 0,
      };
    });

    return NextResponse.json({
      ok:       true,
      listings: normalizedListings,
      total:    data.total ?? normalizedListings.length,
      limit,
      offset,
      hasMore:  data.hasMore ?? (offset + limit < (data.total ?? normalizedListings.length)),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch listings';
    console.error('[marketplace/listings] Error:', msg);
    return NextResponse.json(
      { ok: false, error: msg, listings: [], total: 0, limit, offset, hasMore: false },
      { status: 500 }
    );
  }
}
