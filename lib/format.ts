// ─── Number & Date formatting helpers ─────────────────────────────────────────

export function fmtKins(v: number, d = 2): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: d,
    minimumFractionDigits: 0,
  }).format(v);
}

export function fmtUsd(v: number | null, d = 2): string {
  if (v === null || isNaN(v)) return '—';
  if (Math.abs(v) < 0.01 && v !== 0) {
    return `$${v.toFixed(8).replace(/\.?0+$/, '')}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    maximumFractionDigits: d, minimumFractionDigits: d,
  }).format(v);
}

export function fmtUsdCompact(v: number | null): string {
  if (v === null || isNaN(v)) return '—';
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(2)}K`;
  return fmtUsd(v, 2);
}

export function fmtPct(v: number | null): string {
  if (v === null || isNaN(v) || !isFinite(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export function fmtAddr(addr: string): string {
  if (!addr || addr === 'unknown') return '—';
  return `${addr.slice(0, 5)}…${addr.slice(-4)}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

export function fmtDateDay(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export function fmtAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

export function fmtKinsPrice(v: number): string {
  if (v === 0) return '$0';
  if (v >= 1)  return fmtUsd(v, 4);
  // Show significant digits for micro-cap tokens
  const s = v.toPrecision(4);
  return `$${parseFloat(s)}`;
}
