import { PublicKey } from '@solana/web3.js';

export function isValidSolanaAddress(address: string) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function shortAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

export function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(decimals, 2),
  }).format(value);
}
