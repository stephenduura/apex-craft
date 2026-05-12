// Card-issuer adapter (Sudo Africa / Bridgecard / Stripe Issuing).
// Without provider keys: returns a randomly-generated mock card so the UI keeps working.

export interface IssueCardRequest {
  userId: string;
  cardHolderName: string;
  spendingLimit: number;
  currency: "USD" | "NGN";
}

export interface IssuedCard {
  provider: "sudo" | "bridgecard" | "stripe" | "simulated";
  cardNumberLast4: string;
  brand: "Visa" | "Mastercard";
  expiryMonth: number;
  expiryYear: number;
  externalCardId?: string;
}

function hasKeys() {
  return !!Deno.env.get("CARD_ISSUER_API_KEY");
}

export async function issueCard(req: IssueCardRequest): Promise<IssuedCard> {
  if (!hasKeys()) {
    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();
    return {
      provider: "simulated",
      cardNumberLast4: last4,
      brand: "Visa",
      expiryMonth: now.getMonth() + 1,
      expiryYear: now.getFullYear() + 3,
    };
  }
  // TODO: real card issuer integration. Recommended providers for NG:
  //   - Sudo Africa  (Visa/Mastercard, NGN+USD, KYC required)
  //   - Bridgecard   (Visa, USD-only, easy onboarding)
  //   - Stripe Issuing (US/EU only)
  throw new Error("Card issuer configured but no implementation provided yet");
}

export const cardIssuerEnabled = hasKeys;