import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

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

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { from_currency, to_currency, amount } = await req.json();

    if (!from_currency || !to_currency || !amount || typeof amount !== "number" || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (from_currency === to_currency) {
      return new Response(JSON.stringify({ error: "Cannot convert same currency" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Get FX rate
    const { data: fxRate, error: rateError } = await admin
      .from("fx_rates")
      .select("*")
      .eq("from_currency", from_currency)
      .eq("to_currency", to_currency)
      .single();

    if (rateError || !fxRate) {
      return new Response(JSON.stringify({ error: "Exchange rate not available" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get source wallet
    const { data: fromWallet } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("currency", from_currency)
      .single();

    if (!fromWallet) {
      return new Response(JSON.stringify({ error: `${from_currency} wallet not found` }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get destination wallet
    const { data: toWallet } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("currency", to_currency)
      .single();

    if (!toWallet) {
      return new Response(JSON.stringify({ error: `${to_currency} wallet not found` }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check balance
    if (parseFloat(fromWallet.balance) < amount) {
      return new Response(JSON.stringify({ error: "Insufficient balance" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate conversion
    const effectiveRate = parseFloat(fxRate.effective_rate);
    const convertedAmount = parseFloat((amount * effectiveRate).toFixed(2));
    const fee = parseFloat((amount * parseFloat(fxRate.spread_percent) / 100).toFixed(2));

    // Debit source
    const newFromBalance = parseFloat(fromWallet.balance) - amount;
    await admin.from("wallets").update({ balance: newFromBalance }).eq("id", fromWallet.id);

    // Credit destination
    const newToBalance = parseFloat(toWallet.balance) + convertedAmount;
    await admin.from("wallets").update({ balance: newToBalance }).eq("id", toWallet.id);

    // Create debit transaction
    const ref = `CVT-${Date.now()}`;
    const fromSymbol = from_currency === "USD" ? "$" : "₦";
    const toSymbol = to_currency === "USD" ? "$" : "₦";

    await admin.from("transactions").insert({
      user_id: user.id,
      wallet_id: fromWallet.id,
      type: "convert",
      title: `${from_currency} → ${to_currency}`,
      description: `Rate: ${fromSymbol}1 = ${toSymbol}${effectiveRate.toLocaleString()}`,
      amount,
      currency: from_currency,
      status: "completed",
      reference: ref,
      metadata: {
        direction: `${from_currency}_to_${to_currency}`,
        rate: effectiveRate,
        spread: parseFloat(fxRate.spread_percent),
        fee,
        converted_amount: convertedAmount,
      },
    });

    // Create credit transaction
    await admin.from("transactions").insert({
      user_id: user.id,
      wallet_id: toWallet.id,
      type: "credit",
      title: `${to_currency} Received`,
      description: `From ${from_currency} conversion`,
      amount: convertedAmount,
      currency: to_currency,
      status: "completed",
      reference: ref,
      metadata: { conversion_ref: ref },
    });

    return new Response(JSON.stringify({
      success: true,
      from_amount: amount,
      to_amount: convertedAmount,
      rate: effectiveRate,
      spread: parseFloat(fxRate.spread_percent),
      fee,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
