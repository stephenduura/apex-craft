import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createFundIntent, flutterwaveEnabled } from "../_shared/providers/flutterwave.ts";
import { notifyUser } from "../_shared/notify.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { currency, amount } = await req.json();
    if (!currency || !amount || typeof amount !== "number" || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount or currency" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Get wallet
    const { data: wallet, error: walletError } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("currency", currency)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reference = `FND-${Date.now()}`;

    // Provider intent (real Flutterwave when keys present, simulated otherwise)
    const intent = await createFundIntent({
      userId: user.id,
      email: user.email ?? "",
      amount,
      currency,
      reference,
    });

    // For real Flutterwave the wallet credit happens later via webhook; here we
    // only credit immediately when the intent already came back as completed
    // (simulated mode). For the real flow, return the paymentUrl to the client.
    if (intent.status !== "completed") {
      await admin.from("transactions").insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: "fund",
        title: `${currency} Wallet Fund Pending`,
        description: `via ${intent.provider}`,
        amount,
        currency,
        status: "pending",
        reference,
      });
      return new Response(JSON.stringify({
        success: true,
        status: "pending",
        paymentUrl: intent.paymentUrl,
        reference,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const newBalance = parseFloat(wallet.balance) + amount;

    // Update balance
    const { error: updateError } = await admin
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    if (updateError) throw updateError;

    const { error: txError } = await admin.from("transactions").insert({
      user_id: user.id,
      wallet_id: wallet.id,
      type: "fund",
      title: `${currency} Wallet Funded`,
      description: flutterwaveEnabled() ? "Bank transfer (Flutterwave)" : "Simulated funding",
      amount,
      currency,
      status: "completed",
      reference,
    });

    if (txError) throw txError;

    const sym = currency === "USD" ? "$" : "₦";
    await notifyUser(admin, {
      userId: user.id,
      type: "transaction",
      title: "Wallet Funded",
      body: `Your ${currency} wallet was credited ${sym}${amount.toLocaleString()}.`,
      url: "/history",
      metadata: { reference, amount, currency },
    });

    return new Response(JSON.stringify({ success: true, status: "completed", balance: newBalance, reference }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
