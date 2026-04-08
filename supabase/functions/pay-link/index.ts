import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { action } = body;

    if (action === "pay") {
      // Pay a payment link
      const { link_id } = body;
      if (!link_id) throw new Error("Missing link_id");

      const { data: link } = await admin.from("payment_links").select("*").eq("id", link_id).single();
      if (!link) throw new Error("Payment link not found");
      if (link.status !== "active") throw new Error("Link is no longer active");
      if (link.creator_id === user.id) throw new Error("Cannot pay your own link");
      if (link.expires_at && new Date(link.expires_at) < new Date()) throw new Error("Link has expired");

      const { currency, amount } = link;

      // Get payer wallet
      const { data: payerWallet } = await admin.from("wallets").select("*").eq("user_id", user.id).eq("currency", currency).single();
      if (!payerWallet) throw new Error("No " + currency + " wallet");
      if (payerWallet.balance < amount) throw new Error("Insufficient balance");

      // Get creator wallet
      const { data: creatorWallet } = await admin.from("wallets").select("*").eq("user_id", link.creator_id).eq("currency", currency).single();
      if (!creatorWallet) throw new Error("Creator wallet not found");

      const ref = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Transfer
      await admin.from("wallets").update({ balance: payerWallet.balance - amount }).eq("id", payerWallet.id);
      await admin.from("wallets").update({ balance: creatorWallet.balance + amount }).eq("id", creatorWallet.id);

      // Get names
      const { data: payerProfile } = await admin.from("profiles").select("full_name").eq("user_id", user.id).single();
      const { data: creatorProfile } = await admin.from("profiles").select("full_name").eq("user_id", link.creator_id).single();

      const sym = currency === "USD" ? "$" : "₦";

      // Payer tx
      await admin.from("transactions").insert({
        user_id: user.id,
        wallet_id: payerWallet.id,
        type: "payment_link_out",
        title: `Paid ${creatorProfile?.full_name || "user"}`,
        description: link.description || null,
        amount: -amount,
        currency,
        status: "completed",
        reference: ref,
        metadata: { link_id, creator_id: link.creator_id },
      });

      // Creator tx
      await admin.from("transactions").insert({
        user_id: link.creator_id,
        wallet_id: creatorWallet.id,
        type: "payment_link_in",
        title: `Payment from ${payerProfile?.full_name || "user"}`,
        description: link.description || null,
        amount,
        currency,
        status: "completed",
        reference: ref,
        metadata: { link_id, payer_id: user.id },
      });

      // Update link
      await admin.from("payment_links").update({ status: "paid", recipient_id: user.id, paid_at: new Date().toISOString() }).eq("id", link_id);

      // Notify creator
      await admin.from("notifications").insert({
        user_id: link.creator_id,
        type: "payment",
        title: "Payment Received",
        message: `${payerProfile?.full_name || "Someone"} paid your ${sym}${amount.toLocaleString()} link`,
        metadata: { amount, currency, link_id, payer_id: user.id },
      });

      return new Response(JSON.stringify({ success: true, reference: ref }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
