// Live FX rates updater. Pulls USDT/USDC -> NGN and USD -> NGN from CoinGecko (no key)
// and upserts into fx_rates. Triggered by pg_cron every 5 minutes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SPREAD = 0.5; // %

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=ngn,usd";
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();

    const usdtNgn = data?.tether?.ngn;
    const usdcNgn = data?.["usd-coin"]?.ngn;
    const usdtUsd = data?.tether?.usd ?? 1;
    const usdNgn = (usdtNgn ?? usdcNgn) / (usdtUsd || 1); // close enough to USD/NGN

    if (!usdtNgn || !usdcNgn) throw new Error("Incomplete CoinGecko response");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const rows = [
      { from_currency: "USD", to_currency: "NGN", base: usdNgn },
      { from_currency: "NGN", to_currency: "USD", base: 1 / usdNgn },
      { from_currency: "USDT", to_currency: "NGN", base: usdtNgn },
      { from_currency: "USDC", to_currency: "NGN", base: usdcNgn },
    ];

    for (const r of rows) {
      const effective = r.from_currency === "NGN"
        ? r.base * (1 - SPREAD / 100)   // user buys foreign at slightly worse rate
        : r.base * (1 - SPREAD / 100);  // user sells foreign at slightly worse rate

      // upsert by (from_currency, to_currency)
      const { data: existing } = await admin
        .from("fx_rates")
        .select("id")
        .eq("from_currency", r.from_currency)
        .eq("to_currency", r.to_currency)
        .maybeSingle();

      const payload = {
        from_currency: r.from_currency,
        to_currency: r.to_currency,
        base_rate: r.base,
        spread_percent: SPREAD,
        effective_rate: effective,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await admin.from("fx_rates").update(payload).eq("id", existing.id);
      } else {
        await admin.from("fx_rates").insert(payload);
      }
    }

    return new Response(JSON.stringify({ updated: rows.length, source: "coingecko" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});