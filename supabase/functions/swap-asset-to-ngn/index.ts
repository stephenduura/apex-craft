import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { notifyUser } from "../_shared/notify.ts";
import { initiateLiquidation } from "../_shared/providers/fireblocks.ts";

const DAILY_SWAP_LIMIT = 10000; // $10,000 USD equivalent per day

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

    const admin = createClient(supabaseUrl, serviceKey);

    // Check KYC level
    const { data: profile } = await admin
      .from("profiles")
      .select("kyc_level, kyc_status")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.kyc_level < 1 || profile.kyc_status !== "verified") {
      return new Response(JSON.stringify({ error: "KYC verification required. Please complete identity verification to access digital assets." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { asset, amount, wallet_id } = await req.json();

    if (!asset || !amount || !wallet_id || typeof amount !== "number" || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["USDT", "USDC"].includes(asset)) {
      return new Response(JSON.stringify({ error: "Only USDT and USDC swaps are supported" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check daily swap limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todaySwaps } = await admin
      .from("digital_asset_transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "swap")
      .gte("created_at", todayStart.toISOString());

    const totalSwappedToday = (todaySwaps ?? []).reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);
    if (totalSwappedToday + amount > DAILY_SWAP_LIMIT) {
      const remaining = Math.max(0, DAILY_SWAP_LIMIT - totalSwappedToday);
      return new Response(JSON.stringify({ 
        error: `Daily swap limit exceeded. Remaining: $${remaining.toFixed(2)}. Limit resets at midnight.`,
        daily_limit: DAILY_SWAP_LIMIT,
        used_today: totalSwappedToday,
        remaining,
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get digital asset wallet
    const { data: assetWallet } = await admin
      .from("digital_asset_wallets")
      .select("*")
      .eq("id", wallet_id)
      .eq("user_id", user.id)
      .single();

    if (!assetWallet) {
      return new Response(JSON.stringify({ error: "Digital asset wallet not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parseFloat(String(assetWallet.balance)) < amount) {
      return new Response(JSON.stringify({ error: "Insufficient balance" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get FX rate
    const { data: fxRate } = await admin
      .from("fx_rates")
      .select("*")
      .eq("from_currency", asset)
      .eq("to_currency", "NGN")
      .single();

    if (!fxRate) {
      return new Response(JSON.stringify({ error: "Exchange rate not available" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveRate = parseFloat(String(fxRate.effective_rate));
    const ngnAmount = parseFloat((amount * effectiveRate).toFixed(2));
    const fee = parseFloat((amount * parseFloat(String(fxRate.spread_percent)) / 100).toFixed(2));

    // Get NGN wallet
    const { data: ngnWallet } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("currency", "NGN")
      .single();

    if (!ngnWallet) {
      return new Response(JSON.stringify({ error: "NGN wallet not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Debit digital asset wallet
    const newAssetBalance = parseFloat(String(assetWallet.balance)) - amount;
    await admin.from("digital_asset_wallets").update({ balance: newAssetBalance }).eq("id", assetWallet.id);

    // Credit NGN wallet
    const newNgnBalance = parseFloat(String(ngnWallet.balance)) + ngnAmount;
    await admin.from("wallets").update({ balance: newNgnBalance }).eq("id", ngnWallet.id);

    const ref = `SWAP-${Date.now()}`;

    // Initiate liquidation through the custodial provider (or internal treasury).
    const settlement = await initiateLiquidation(asset, amount, ref);

    const { data: settlementRow } = await admin
      .from("swap_settlements")
      .insert({
        user_id: user.id,
        swap_reference: ref,
        asset,
        amount,
        ngn_amount: ngnAmount,
        rate_used: effectiveRate,
        provider: settlement.provider,
        provider_tx_id: settlement.providerTxId,
        hot_wallet_address: settlement.hotWalletAddress,
        status: settlement.status,
        error_message: settlement.error ?? null,
        settled_at: settlement.status === "settled" ? new Date().toISOString() : null,
        metadata: { fee_amount: fee, kyc_level: profile.kyc_level },
      })
      .select()
      .single();

    // Audit treasury outflow (assets leaving the OVO hot wallet pool).
    await admin.from("treasury_movements").insert({
      asset,
      direction: "outflow",
      amount,
      related_settlement_id: settlementRow?.id ?? null,
      provider: settlement.provider,
      provider_tx_id: settlement.providerTxId,
      notes: `Swap ${ref} liquidation`,
    });

    // Create digital asset transaction
    await admin.from("digital_asset_transactions").insert({
      user_id: user.id,
      wallet_id: assetWallet.id,
      type: "swap",
      asset,
      amount,
      ngn_amount: ngnAmount,
      rate_used: effectiveRate,
      fee_amount: fee,
      status: "completed",
      reference: ref,
      metadata: {
        kyc_level: profile.kyc_level,
        swap_direction: `${asset}_to_NGN`,
        daily_total: totalSwappedToday + amount,
        timestamp: new Date().toISOString(),
        settlement_id: settlementRow?.id ?? null,
        settlement_status: settlement.status,
        settlement_provider: settlement.provider,
      },
    });

    // Create NGN credit transaction
    await admin.from("transactions").insert({
      user_id: user.id,
      wallet_id: ngnWallet.id,
      type: "credit",
      title: `${asset} → NGN Swap`,
      description: `Swapped ${amount} ${asset} at ₦${effectiveRate.toLocaleString()}`,
      amount: ngnAmount,
      currency: "NGN",
      status: "completed",
      reference: ref,
      metadata: { swap_ref: ref, source_asset: asset, source_amount: amount },
    });

    await notifyUser(admin, {
      userId: user.id,
      type: "transaction",
      title: "Swap Completed",
      body: settlement.status === "settled"
        ? `Swapped ${amount} ${asset} → ₦${ngnAmount.toLocaleString()}`
        : `Swap of ${amount} ${asset} initiated. Settlement pending confirmation.`,
      url: "/history",
      metadata: { reference: ref, asset, amount, ngn_amount: ngnAmount },
    });

    return new Response(JSON.stringify({
      success: true,
      asset,
      amount,
      ngn_amount: ngnAmount,
      rate: effectiveRate,
      fee,
      reference: ref,
      settlement: {
        provider: settlement.provider,
        status: settlement.status,
        provider_tx_id: settlement.providerTxId,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
