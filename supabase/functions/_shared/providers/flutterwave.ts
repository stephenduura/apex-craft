// Flutterwave provider adapter
// Real implementation activates when FLUTTERWAVE_SECRET_KEY is set.
// Without keys, returns a clearly-labelled SIMULATED result so the rest
// of the system keeps working in development.

const FLW_BASE = "https://api.flutterwave.com/v3";

export interface FundIntent {
  userId: string;
  email: string;
  amount: number;        // major units e.g. 1000.00
  currency: "NGN" | "USD";
  reference: string;
}

export interface FundIntentResult {
  provider: "flutterwave" | "simulated";
  status: "pending" | "completed" | "failed";
  reference: string;
  paymentUrl?: string;   // hosted checkout URL (real) or null (simulated)
  raw?: unknown;
}

export interface WithdrawIntent {
  userId: string;
  amount: number;
  currency: "NGN" | "USD";
  reference: string;
  bankCode?: string;
  accountNumber?: string;
  narration?: string;
}

export interface WithdrawIntentResult {
  provider: "flutterwave" | "simulated";
  status: "pending" | "completed" | "failed";
  reference: string;
  raw?: unknown;
}

function hasKeys() {
  return !!Deno.env.get("FLUTTERWAVE_SECRET_KEY");
}

export async function createFundIntent(intent: FundIntent): Promise<FundIntentResult> {
  if (!hasKeys()) {
    return {
      provider: "simulated",
      status: "completed",
      reference: intent.reference,
    };
  }

  const secret = Deno.env.get("FLUTTERWAVE_SECRET_KEY")!;
  const res = await fetch(`${FLW_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: intent.reference,
      amount: intent.amount,
      currency: intent.currency,
      customer: { email: intent.email },
      redirect_url: Deno.env.get("FLUTTERWAVE_REDIRECT_URL") ?? "",
      payment_options: "card,banktransfer,ussd",
    }),
  });
  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    return { provider: "flutterwave", status: "failed", reference: intent.reference, raw: data };
  }
  return {
    provider: "flutterwave",
    status: "pending",
    reference: intent.reference,
    paymentUrl: data.data?.link,
    raw: data,
  };
}

export async function createWithdrawIntent(intent: WithdrawIntent): Promise<WithdrawIntentResult> {
  if (!hasKeys()) {
    return {
      provider: "simulated",
      status: "completed",
      reference: intent.reference,
    };
  }

  const secret = Deno.env.get("FLUTTERWAVE_SECRET_KEY")!;
  const res = await fetch(`${FLW_BASE}/transfers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_bank: intent.bankCode,
      account_number: intent.accountNumber,
      amount: intent.amount,
      currency: intent.currency,
      narration: intent.narration ?? "OVO Shield withdrawal",
      reference: intent.reference,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    return { provider: "flutterwave", status: "failed", reference: intent.reference, raw: data };
  }
  return {
    provider: "flutterwave",
    status: data.data?.status === "SUCCESSFUL" ? "completed" : "pending",
    reference: intent.reference,
    raw: data,
  };
}

export const flutterwaveEnabled = hasKeys;