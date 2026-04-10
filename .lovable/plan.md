

# Digital Assets (USDT & USDC) — Implementation Plan

## Overview

Add stablecoin digital asset wallets (USDT and USDC) with receive functionality and swap-to-Naira capability. The implementation follows a **CBN-compliant peer-to-peer (P2P) OTC model** — the app does NOT act as a crypto exchange or custodian. Instead, it facilitates users receiving stablecoins into their OVO Shield wallets and converting to NGN at market rates through an internal swap, similar to how licensed fintech apps operate in Nigeria.

## CBN Compliance Strategy

The CBN's 2021 circular prohibits banks from facilitating crypto transactions, but does NOT prohibit individuals from holding or trading crypto. The compliant approach:

1. **No direct crypto purchases** — users cannot buy USDT/USDC with NGN directly through the app
2. **Receive-only model** — users receive stablecoins via wallet addresses (simulated for now; real blockchain integration later)
3. **P2P swap to NGN** — the app facilitates conversion at transparent OTC rates with full audit trail
4. **KYC enforcement** — only KYC-verified users (Tier 1+) can access digital assets
5. **Transaction limits** — daily/monthly limits on swaps
6. **Full transaction logging** — every swap creates auditable records with compliance metadata
7. **Disclaimer & Terms** — users acknowledge regulatory risks before activating digital assets

---

## Technical Plan

### Step 1: Database Migration

Create `digital_asset_wallets` table:
- `id`, `user_id`, `asset` (USDT/USDC), `network` (TRC20/ERC20/BEP20), `balance`, `wallet_address`, `is_active`, `created_at`, `updated_at`
- RLS: users can only see/modify their own wallets

Create `digital_asset_transactions` table:
- `id`, `user_id`, `wallet_id`, `type` (receive/swap), `asset`, `amount`, `status`, `reference`, `metadata` (includes compliance data like IP, KYC level), `created_at`
- RLS: users can only see their own transactions

Add `fx_rates` entries for USDT→NGN and USDC→NGN swap rates.

Enable realtime on both new tables.

### Step 2: Edge Functions

**`swap-asset-to-ngn`** — Atomic swap function:
- Validates KYC level >= 1
- Checks daily swap limit (e.g., $10,000/day)
- Debits digital asset wallet, credits NGN wallet
- Creates transactions in both `digital_asset_transactions` and `transactions` tables
- Logs compliance metadata (timestamp, KYC level, IP)

**`receive-asset`** — Simulates receiving stablecoins:
- Credits the user's digital asset wallet
- Creates a receive transaction
- Sends notification

### Step 3: Hooks

- `useDigitalAssets.ts` — fetch digital asset wallets with realtime updates
- `useAssetTransactions.ts` — fetch digital asset transaction history

### Step 4: UI Pages & Components

**New page: `src/pages/Assets.tsx`**
- KYC gate — shows a compliance disclaimer + KYC prompt if not verified
- Asset wallet cards (USDT, USDC) showing balances
- "Receive" action → shows wallet address + QR code
- "Swap to Naira" action → opens swap dialog

**New component: `src/components/SwapToNairaDialog.tsx`**
- Asset selector (USDT/USDC)
- Amount input with balance check
- Live NGN conversion preview with rate, spread, fee breakdown
- Daily limit indicator
- Compliance notice footer
- Rate lock (30s) reusing existing pattern

**New component: `src/components/ReceiveAssetDialog.tsx`**
- Network selector (TRC20/ERC20/BEP20)
- Wallet address display with copy button
- QR code generation
- "Minimum deposit" notice

**New component: `src/components/AssetWalletCard.tsx`**
- Stablecoin-branded card (green tint for USDT, blue for USDC)
- Balance display with show/hide toggle
- Network badge
- Action buttons (Receive, Swap)

### Step 5: Navigation & Routing

- Add `/assets` route (protected) to `App.tsx`
- Add "Assets" tab to `BottomNav.tsx` (using `Coins` icon from lucide), replacing or adding alongside existing nav items
- Add digital asset transactions to the History page filter

### Step 6: Compliance UI Elements

- Terms acceptance modal on first access to Assets page
- "CBN Notice" banner explaining the P2P OTC nature
- Transaction receipts include compliance disclaimers
- Daily limit progress bar in swap dialog

---

## Files to Create
- `supabase/migrations/[timestamp]_digital_assets.sql`
- `supabase/functions/swap-asset-to-ngn/index.ts`
- `supabase/functions/receive-asset/index.ts`
- `src/hooks/useDigitalAssets.ts`
- `src/pages/Assets.tsx`
- `src/components/SwapToNairaDialog.tsx`
- `src/components/ReceiveAssetDialog.tsx`
- `src/components/AssetWalletCard.tsx`

## Files to Edit
- `src/App.tsx` — add `/assets` route
- `src/components/BottomNav.tsx` — add Assets nav item
- `src/pages/History.tsx` — add digital asset transaction filter
- `src/pages/Index.tsx` — add digital assets summary card on dashboard

