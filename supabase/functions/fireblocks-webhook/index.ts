import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { notifyUser } from "../_shared/notify.ts";

// Receives Fireblocks transaction status callbacks and finalizes the
// matching swap settlement. Configure this URL in the Fireblocks console
// under Settings → Webhooks for TRANSACTION_STATUS_UPDATED.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // TODO: verify the X-Fireblocks-Signature header against FIREBLOCKS_PUBLIC_KEY.

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const payload = await req.json();
    const { type, data } = payload;
    if (type !== "TRANSACTION_STATUS_UPDATED" || !data?.id) {
      return new Response(JSON.stringify({ ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settlement } = await admin
      .from("swap_settlements")
      .select("*")
      .eq("provider_tx_id", data.id)
      .single();

    if (!settlement) {
      return new Response(JSON.stringify({ unknown_tx: data.id }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.status === "COMPLETED") {
      await admin.from("swap_settlements").update({
        status: "settled",
        settled_at: new Date().toISOString(),
      }).eq("id", settlement.id);

      await notifyUser(admin, {
        userId: settlement.user_id,
        type: "transaction",
        title: "Settlement Confirmed",
        body: `Your ${settlement.asset} → NGN swap (${settlement.swap_reference}) is fully settled.`,
        url: "/history",
      });
    } else if (["FAILED", "REJECTED", "CANCELLED", "BLOCKED"].includes(data.status)) {
      await admin.from("swap_settlements").update({
        status: "failed",
        error_message: data.status,
      }).eq("id", settlement.id);

      await notifyUser(admin, {
        userId: settlement.user_id,
        type: "alert",
        title: "Settlement Issue",
        body: `Swap ${settlement.swap_reference} could not be settled (${data.status}). Support has been notified.`,
        url: "/history",
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});