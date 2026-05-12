import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { getOrCreateDepositAddress, fireblocksEnabled } from "../_shared/providers/fireblocks.ts";

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

    // Check KYC
    const { data: profile } = await admin
      .from("profiles")
      .select("kyc_level, kyc_status")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.kyc_level < 1 || profile.kyc_status !== "verified") {
      return new Response(JSON.stringify({ error: "KYC verification required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { asset, network, amount } = await req.json();

    if (!asset || !network || !amount || typeof amount !== "number" || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["USDT", "USDC"].includes(asset)) {
      return new Response(JSON.stringify({ error: "Only USDT and USDC are supported" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["TRC20", "ERC20", "BEP20"].includes(network)) {
      return new Response(JSON.stringify({ error: "Unsupported network" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create wallet for this asset+network
    let { data: wallet } = await admin
      .from("digital_asset_wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("asset", asset)
      .eq("network", network)
      .single();

    if (!wallet) {
      // Provider-issued deposit address (Fireblocks when keys present, simulated otherwise)
      const dep = await getOrCreateDepositAddress(user.id, asset, network);
      const addr = dep.address;

      const { data: newWallet, error: createError } = await admin
        .from("digital_asset_wallets")
        .insert({
          user_id: user.id,
          asset,
          network,
          wallet_address: addr,
          balance: 0,
        })
        .select()
        .single();

      if (createError) {
        return new Response(JSON.stringify({ error: "Failed to create wallet" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      wallet = newWallet;
    }

    // In a real Fireblocks integration, the wallet credit happens when the
    // INCOMING_TRANSACTION webhook fires. Without keys we simulate the credit
    // immediately so the dev experience stays smooth.
    let newBalance = parseFloat(String(wallet.balance));
    if (!fireblocksEnabled()) {
      newBalance += amount;
      await admin.from("digital_asset_wallets").update({ balance: newBalance }).eq("id", wallet.id);
    }

    const ref = `RCV-${Date.now()}`;

    await admin.from("digital_asset_transactions").insert({
      user_id: user.id,
      wallet_id: wallet.id,
      type: "receive",
      asset,
      amount,
      status: fireblocksEnabled() ? "pending" : "completed",
      reference: ref,
      metadata: {
        network,
        wallet_address: wallet.wallet_address,
        provider: fireblocksEnabled() ? "fireblocks" : "simulated",
        timestamp: new Date().toISOString(),
      },
    });

    await admin.from("notifications").insert({
      user_id: user.id,
      title: `${asset} Received`,
      message: `You received ${amount} ${asset} on ${network}`,
      type: "transaction",
      metadata: { reference: ref },
    });

    return new Response(JSON.stringify({
      success: true,
      asset,
      amount,
      network,
      new_balance: newBalance,
      wallet_address: wallet.wallet_address,
      reference: ref,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
