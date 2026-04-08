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

    const { recipient_email, amount, currency, description } = await req.json();

    if (!recipient_email || !amount || !currency) throw new Error("Missing fields");
    if (typeof amount !== "number" || amount <= 0) throw new Error("Invalid amount");
    if (recipient_email === user.email) throw new Error("Cannot send to yourself");

    // Find recipient
    const { data: recipientProfile } = await admin
      .from("profiles")
      .select("user_id, full_name")
      .eq("email", recipient_email)
      .single();

    if (!recipientProfile) throw new Error("Recipient not found. They must have an account.");

    // Get sender wallet
    const { data: senderWallet } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("currency", currency)
      .single();

    if (!senderWallet) throw new Error("Wallet not found");
    if (senderWallet.balance < amount) throw new Error("Insufficient balance");

    // Get recipient wallet
    const { data: recipientWallet } = await admin
      .from("wallets")
      .select("*")
      .eq("user_id", recipientProfile.user_id)
      .eq("currency", currency)
      .single();

    if (!recipientWallet) throw new Error("Recipient has no " + currency + " wallet");

    const ref = `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Debit sender
    await admin.from("wallets").update({ balance: senderWallet.balance - amount }).eq("id", senderWallet.id);

    // Credit recipient
    await admin.from("wallets").update({ balance: recipientWallet.balance + amount }).eq("id", recipientWallet.id);

    // Get sender name
    const { data: senderProfile } = await admin.from("profiles").select("full_name").eq("user_id", user.id).single();

    // Log sender tx
    await admin.from("transactions").insert({
      user_id: user.id,
      wallet_id: senderWallet.id,
      type: "transfer_out",
      title: `Sent to ${recipientProfile.full_name || recipient_email}`,
      description: description || null,
      amount: -amount,
      currency,
      status: "completed",
      reference: ref,
      metadata: { recipient_email, recipient_id: recipientProfile.user_id },
    });

    // Log recipient tx
    await admin.from("transactions").insert({
      user_id: recipientProfile.user_id,
      wallet_id: recipientWallet.id,
      type: "transfer_in",
      title: `Received from ${senderProfile?.full_name || user.email}`,
      description: description || null,
      amount,
      currency,
      status: "completed",
      reference: ref,
      metadata: { sender_email: user.email, sender_id: user.id },
    });

    // Create notification for recipient
    await admin.from("notifications").insert({
      user_id: recipientProfile.user_id,
      type: "transfer",
      title: "Money Received",
      message: `${senderProfile?.full_name || user.email} sent you ${currency === "USD" ? "$" : "₦"}${amount.toLocaleString()}`,
      metadata: { amount, currency, sender_id: user.id, reference: ref },
    });

    return new Response(JSON.stringify({ success: true, reference: ref }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
