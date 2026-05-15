import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Polls pending swap settlements and finalizes them.
// - For `internal_treasury` rows: nothing to poll, they settle at swap time.
// - For `fireblocks` rows: query Fireblocks for the tx status and update.
// Designed to run on a 5-minute pg_cron schedule.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: pending } = await admin
    .from("swap_settlements")
    .select("*")
    .eq("status", "pending")
    .eq("provider", "fireblocks")
    .limit(100);

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ checked: 0, settled: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("FIREBLOCKS_API_KEY");
  let settled = 0;
  let failed = 0;

  for (const row of pending) {
    if (!row.provider_tx_id) continue;

    let providerStatus: string | null = null;
    if (apiKey) {
      try {
        const res = await fetch(
          `https://api.fireblocks.io/v1/transactions/${row.provider_tx_id}`,
          { headers: { "X-API-Key": apiKey } },
        );
        if (res.ok) {
          const json = await res.json();
          providerStatus = json.status ?? null;
        }
      } catch (_) { /* swallow, retry next cycle */ }
    }

    if (providerStatus === "COMPLETED") {
      await admin.from("swap_settlements").update({
        status: "settled",
        settled_at: new Date().toISOString(),
      }).eq("id", row.id);
      settled++;
    } else if (providerStatus === "FAILED" || providerStatus === "REJECTED" || providerStatus === "CANCELLED") {
      await admin.from("swap_settlements").update({
        status: "failed",
        error_message: providerStatus,
      }).eq("id", row.id);
      failed++;
    }
  }

  return new Response(JSON.stringify({ checked: pending.length, settled, failed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});