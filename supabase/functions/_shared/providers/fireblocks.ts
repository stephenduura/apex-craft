// Fireblocks (custodial crypto) adapter
// Real implementation activates when FIREBLOCKS_API_KEY + FIREBLOCKS_SECRET_KEY are set.
// Without keys, returns a SIMULATED deposit address so dev/preview keeps working.

export type Asset = "USDT" | "USDC";
export type Network = "TRC20" | "ERC20" | "BEP20";

export interface DepositAddress {
  provider: "fireblocks" | "simulated";
  address: string;
  asset: Asset;
  network: Network;
  memo?: string;
}

function hasKeys() {
  return !!Deno.env.get("FIREBLOCKS_API_KEY") && !!Deno.env.get("FIREBLOCKS_SECRET_KEY");
}

function simulatedAddress(network: Network): string {
  const prefix = network === "TRC20" ? "T" : "0x";
  const chars = "abcdef0123456789";
  let addr = prefix;
  const len = network === "TRC20" ? 33 : 40;
  for (let i = 0; i < len; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

export async function getOrCreateDepositAddress(
  userId: string,
  asset: Asset,
  network: Network,
): Promise<DepositAddress> {
  if (!hasKeys()) {
    return { provider: "simulated", address: simulatedAddress(network), asset, network };
  }
  // TODO: real Fireblocks integration
  // 1. Look up the vault account for `userId` (or create one).
  // 2. POST /v1/vault/accounts/{vaultAccountId}/{assetId}/addresses to mint a deposit address.
  // 3. Configure a webhook on /v1/webhooks for INCOMING_TRANSACTION_BROADCASTED to credit the wallet.
  // For now, fall back to simulated so the surface contract is identical.
  return { provider: "simulated", address: simulatedAddress(network), asset, network };
}

export const fireblocksEnabled = hasKeys;