# Kintara P/L Tracker

A simple starter dashboard for Kintara wallet analytics.

## What it does

Paste a Solana wallet address and the app will:

- Fetch public wallet token transfers from Helius
- Filter only KINS transfers
- Separate outgoing KINS as buys/spends
- Separate incoming KINS as sells/receives
- Calculate total buy, total sell, net KINS P/L
- Show transaction history with date, direction, amount, counterparty, and Solscan link

## Important limitation

Wallet data alone can calculate KINS movement, but it cannot always know the exact item name like Coal, Wood, Gold unless Kintara marketplace activity data or marketplace program/escrow addresses are mapped.

For exact marketplace-only P/L, add marketplace/escrow counterparties in `.env.local`:

```bash
KINTARA_MARKETPLACE_COUNTERPARTIES=address1,address2,address3
```

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## Safety

Never ask users for seed phrase or private key. This app only needs a public wallet address.
